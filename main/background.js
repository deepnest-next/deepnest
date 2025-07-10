'use strict';

import { NfpCache } from '../build/nfpDb.js';
import { HullPolygon } from '../build/util/HullPolygon.js';

window.onload = function () {
  const { ipcRenderer } = require('electron');
  window.ipcRenderer = ipcRenderer;
  window.addon = require('@deepnest/calculate-nfp');

  window.path = require('path')
  window.url = require('url')
  window.fs = require('graceful-fs');
  /*
  add package 'filequeue 0.5.0' if you enable this
    window.FileQueue = require('filequeue');
    window.fq = new FileQueue(500);
  */
  window.db = new NfpCache();

  ipcRenderer.on('background-start', (event, data) => {
    console.log('Background-start event received, processing data...');
    console.log('Data contains:', data.individual.placement.length, 'parts');
    
    var index = data.index;
    var individual = data.individual;

    var parts = individual.placement;
    var rotations = individual.rotation;
    var ids = data.ids;
    var sources = data.sources;
    var children = data.children;
    var filenames = data.filenames;

    for (let i = 0; i < parts.length; i++) {
      parts[i].rotation = rotations[i];
      parts[i].id = ids[i];
      parts[i].source = sources[i];
      parts[i].filename = filenames[i];
      if (!data.config.simplify) {
        parts[i].children = children[i];
      }
    }

    const _sheets = JSON.parse(JSON.stringify(data.sheets));
    for (let i = 0; i < data.sheets.length; i++) {
      _sheets[i].id = data.sheetids[i];
      _sheets[i].source = data.sheetsources[i];
      _sheets[i].children = data.sheetchildren[i];
    }
    data.sheets = _sheets;

    // preprocess
    var pairs = [];
    var inpairs = function (key, p) {
      for (let i = 0; i < p.length; i++) {
        if (p[i].Asource == key.Asource && p[i].Bsource == key.Bsource && p[i].Arotation == key.Arotation && p[i].Brotation == key.Brotation) {
          return true;
        }
      }
      return false;
    }
    for (let i = 0; i < parts.length; i++) {
      var B = parts[i];
      for (let j = 0; j < i; j++) {
        var A = parts[j];
        var key = {
          A: A,
          B: B,
          Arotation: A.rotation,
          Brotation: B.rotation,
          Asource: A.source,
          Bsource: B.source
        };
        var doc = {
          A: A.source,
          B: B.source,
          Arotation: A.rotation,
          Brotation: B.rotation
        }
        if (!inpairs(key, pairs) && !db.has(doc)) {
          pairs.push(key);
        }
      }
    }

    console.log('Created', pairs.length, 'NFP pairs for processing');
    if (pairs.length > 1000) {
      console.warn('Very large number of NFP pairs - this will take a long time!');
    }

    var process = function (pair) {

      var A = rotatePolygon(pair.A, pair.Arotation);
      var B = rotatePolygon(pair.B, pair.Brotation);

      // Check if we can use the optimized rectangle NFP for exact-fit cases
      if (GeometryUtil.isRectangle(A) && !pair.inside) {
        var rectangleNfp = GeometryUtil.noFitPolygonRectangle(A, B);
        if (rectangleNfp && rectangleNfp.length > 0) {
          pair.A = null;
          pair.B = null;
          return { A: pair.A, B: pair.B, nfp: rectangleNfp };
        }
      }

      var clipper = new ClipperLib.Clipper();

      var Ac = toClipperCoordinates(A);
      ClipperLib.JS.ScaleUpPath(Ac, 10000000);
      var Bc = toClipperCoordinates(B);
      ClipperLib.JS.ScaleUpPath(Bc, 10000000);
      for (let i = 0; i < Bc.length; i++) {
        Bc[i].X *= -1;
        Bc[i].Y *= -1;
      }
      var solution = ClipperLib.Clipper.MinkowskiSum(Ac, Bc, true);
      var clipperNfp;

      var largestArea = null;
      for (let i = 0; i < solution.length; i++) {
        var n = toNestCoordinates(solution[i], 10000000);
        var sarea = -GeometryUtil.polygonArea(n);
        if (largestArea === null || largestArea < sarea) {
          clipperNfp = n;
          largestArea = sarea;
        }
      }

      for (let i = 0; i < clipperNfp.length; i++) {
        clipperNfp[i].x += B[0].x;
        clipperNfp[i].y += B[0].y;
      }

      pair.A = null;
      pair.B = null;
      pair.nfp = clipperNfp;
      return pair;

      function toClipperCoordinates(polygon) {
        var clone = [];
        for (let i = 0; i < polygon.length; i++) {
          clone.push({
            X: polygon[i].x,
            Y: polygon[i].y
          });
        }

        return clone;
      };

      function toNestCoordinates(polygon, scale) {
        var clone = [];
        for (let i = 0; i < polygon.length; i++) {
          clone.push({
            x: polygon[i].X / scale,
            y: polygon[i].Y / scale
          });
        }

        return clone;
      };

      function rotatePolygon(polygon, degrees) {
        var rotated = [];
        var angle = degrees * Math.PI / 180;
        for (let i = 0; i < polygon.length; i++) {
          var x = polygon[i].x;
          var y = polygon[i].y;
          var x1 = x * Math.cos(angle) - y * Math.sin(angle);
          var y1 = x * Math.sin(angle) + y * Math.cos(angle);

          rotated.push({ x: x1, y: y1 });
        }

        return rotated;
      };
    }

    // run the placement synchronously
    function sync() {
      //console.log('starting synchronous calculations', Object.keys(window.nfpCache).length);
      // console.log('in sync');
      var c = window.db.getStats();
      // console.log('nfp cached:', c);
      // console.log()
      console.log('About to call placeParts with', parts.length, 'parts and', data.sheets.length, 'sheets');
      ipcRenderer.send('test', [data.sheets, parts, data.config, index]);
      
      var placement = placeParts(data.sheets, parts, data.config, index);
      console.log('placeParts completed, placement result:', placement ? 'success' : 'null');

      placement.index = data.index;
      ipcRenderer.send('background-response', placement);
    }

    // console.time('Total');


    if (pairs.length > 0) {
      console.log('Starting parallel NFP processing for', pairs.length, 'pairs');
      var p = new Parallel(pairs, {
        evalPath: '../build/util/eval.js',
        synchronous: false
      });

      var spawncount = 0;

      p._spawnMapWorker = function (i, cb, done, env, wrk) {
        // hijack the worker call to check progress
        ipcRenderer.send('background-progress', { index: index, progress: 0.5 * (spawncount++ / pairs.length) });
        return Parallel.prototype._spawnMapWorker.call(p, i, cb, done, env, wrk);
      }

      p.require('../../main/util/clipper.js');
      p.require('../../main/util/geometryutil.js');

      console.log('Starting p.map processing...');
      
      // Add timeout for parallel processing
      var parallelTimeout = setTimeout(function() {
        console.error('Parallel processing timeout after 60 seconds, continuing with sync');
        sync();
      }, 60000);
      
      p.map(process).then(function (processed) {
        clearTimeout(parallelTimeout);
        console.log('Parallel processing completed, got', processed.length, 'results');
        function getPart(source) {
          for (let k = 0; k < parts.length; k++) {
            if (parts[k].source == source) {
              return parts[k];
            }
          }
          return null;
        }
        // store processed data in cache
        for (let i = 0; i < processed.length; i++) {
          // returned data only contains outer nfp, we have to account for any holes separately in the synchronous portion
          // this is because the c++ addon which can process interior nfps cannot run in the worker thread
          var A = getPart(processed[i].Asource);
          var B = getPart(processed[i].Bsource);

          var Achildren = [];

          var j;
          if (A.children) {
            for (let j = 0; j < A.children.length; j++) {
              Achildren.push(rotatePolygon(A.children[j], processed[i].Arotation));
            }
          }

          if (Achildren.length > 0) {
            var Brotated = rotatePolygon(B, processed[i].Brotation);
            var bbounds = GeometryUtil.getPolygonBounds(Brotated);
            var cnfp = [];

            for (let j = 0; j < Achildren.length; j++) {
              var cbounds = GeometryUtil.getPolygonBounds(Achildren[j]);
              if (cbounds.width > bbounds.width && cbounds.height > bbounds.height) {
                var n = getInnerNfp(Achildren[j], Brotated, data.config);
                if (n && n.length > 0) {
                  cnfp = cnfp.concat(n);
                }
              }
            }

            processed[i].nfp.children = cnfp;
          }

          var doc = {
            A: processed[i].Asource,
            B: processed[i].Bsource,
            Arotation: processed[i].Arotation,
            Brotation: processed[i].Brotation,
            nfp: processed[i].nfp
          };
          window.db.insert(doc);

        }
        // console.timeEnd('Total');
        // console.log('before sync');
        console.log('About to call sync after parallel processing');
        sync();
      });
    }
    else {
      sync();
    }
  });
};

// returns the square of the length of any merged lines
// filter out any lines less than minlength long
function mergedLength(parts, p, minlength, tolerance) {
  var min2 = minlength * minlength;
  var totalLength = 0;
  var segments = [];

  for (let i = 0; i < p.length; i++) {
    var A1 = p[i];

    if (i + 1 == p.length) {
      A2 = p[0];
    }
    else {
      var A2 = p[i + 1];
    }

    if (!A1.exact || !A2.exact) {
      continue;
    }

    var Ax2 = (A2.x - A1.x) * (A2.x - A1.x);
    var Ay2 = (A2.y - A1.y) * (A2.y - A1.y);

    if (Ax2 + Ay2 < min2) {
      continue;
    }

    var angle = Math.atan2((A2.y - A1.y), (A2.x - A1.x));

    var c = Math.cos(-angle);
    var s = Math.sin(-angle);

    var c2 = Math.cos(angle);
    var s2 = Math.sin(angle);

    var relA2 = { x: A2.x - A1.x, y: A2.y - A1.y };
    var rotA2x = relA2.x * c - relA2.y * s;

    for (let j = 0; j < parts.length; j++) {
      var B = parts[j];
      if (B.length > 1) {
        for (let k = 0; k < B.length; k++) {
          var B1 = B[k];

          if (k + 1 == B.length) {
            var B2 = B[0];
          }
          else {
            var B2 = B[k + 1];
          }

          if (!B1.exact || !B2.exact) {
            continue;
          }
          var Bx2 = (B2.x - B1.x) * (B2.x - B1.x);
          var By2 = (B2.y - B1.y) * (B2.y - B1.y);

          if (Bx2 + By2 < min2) {
            continue;
          }

          // B relative to A1 (our point of rotation)
          var relB1 = { x: B1.x - A1.x, y: B1.y - A1.y };
          var relB2 = { x: B2.x - A1.x, y: B2.y - A1.y };


          // rotate such that A1 and A2 are horizontal
          var rotB1 = { x: relB1.x * c - relB1.y * s, y: relB1.x * s + relB1.y * c };
          var rotB2 = { x: relB2.x * c - relB2.y * s, y: relB2.x * s + relB2.y * c };

          if (!GeometryUtil.almostEqual(rotB1.y, 0, tolerance) || !GeometryUtil.almostEqual(rotB2.y, 0, tolerance)) {
            continue;
          }

          var min1 = Math.min(0, rotA2x);
          var max1 = Math.max(0, rotA2x);

          var min2 = Math.min(rotB1.x, rotB2.x);
          var max2 = Math.max(rotB1.x, rotB2.x);

          // not overlapping
          if (min2 >= max1 || max2 <= min1) {
            continue;
          }

          var len = 0;
          var relC1x = 0;
          var relC2x = 0;

          // A is B
          if (GeometryUtil.almostEqual(min1, min2) && GeometryUtil.almostEqual(max1, max2)) {
            len = max1 - min1;
            relC1x = min1;
            relC2x = max1;
          }
          // A inside B
          else if (min1 > min2 && max1 < max2) {
            len = max1 - min1;
            relC1x = min1;
            relC2x = max1;
          }
          // B inside A
          else if (min2 > min1 && max2 < max1) {
            len = max2 - min2;
            relC1x = min2;
            relC2x = max2;
          }
          else {
            len = Math.max(0, Math.min(max1, max2) - Math.max(min1, min2));
            relC1x = Math.min(max1, max2);
            relC2x = Math.max(min1, min2);
          }

          if (len * len > min2) {
            totalLength += len;

            var relC1 = { x: relC1x * c2, y: relC1x * s2 };
            var relC2 = { x: relC2x * c2, y: relC2x * s2 };

            var C1 = { x: relC1.x + A1.x, y: relC1.y + A1.y };
            var C2 = { x: relC2.x + A1.x, y: relC2.y + A1.y };

            segments.push([C1, C2]);
          }
        }
      }

      if (B.children && B.children.length > 0) {
        var child = mergedLength(B.children, p, minlength, tolerance);
        totalLength += child.totalLength;
        segments = segments.concat(child.segments);
      }
    }
  }

  return { totalLength: totalLength, segments: segments };
}

function shiftPolygon(p, shift) {
  var shifted = [];
  for (let i = 0; i < p.length; i++) {
    shifted.push({ x: p[i].x + shift.x, y: p[i].y + shift.y, exact: p[i].exact });
  }
  if (p.children && p.children.length) {
    shifted.children = [];
    for (let i = 0; i < p.children.length; i++) {
      shifted.children.push(shiftPolygon(p.children[i], shift));
    }
  }

  return shifted;
}
// jsClipper uses X/Y instead of x/y...
function toClipperCoordinates(polygon) {
  var clone = [];
  for (let i = 0; i < polygon.length; i++) {
    clone.push({
      X: polygon[i].x,
      Y: polygon[i].y
    });
  }

  return clone;
};

// returns clipper nfp. Remember that clipper nfp are a list of polygons, not a tree!
function nfpToClipperCoordinates(nfp, config) {
  var clipperNfp = [];

  // children first
  if (nfp.children && nfp.children.length > 0) {
    for (let j = 0; j < nfp.children.length; j++) {
      if (GeometryUtil.polygonArea(nfp.children[j]) < 0) {
        nfp.children[j].reverse();
      }
      var childNfp = toClipperCoordinates(nfp.children[j]);
      ClipperLib.JS.ScaleUpPath(childNfp, config.clipperScale);
      clipperNfp.push(childNfp);
    }
  }

  if (GeometryUtil.polygonArea(nfp) > 0) {
    nfp.reverse();
  }

  var outerNfp = toClipperCoordinates(nfp);

  // clipper js defines holes based on orientation

  ClipperLib.JS.ScaleUpPath(outerNfp, config.clipperScale);
  //var cleaned = ClipperLib.Clipper.CleanPolygon(outerNfp, 0.00001*config.clipperScale);

  clipperNfp.push(outerNfp);
  //var area = Math.abs(ClipperLib.Clipper.Area(cleaned));

  return clipperNfp;
}

// inner nfps can be an array of nfps, outer nfps are always singular
function innerNfpToClipperCoordinates(nfp, config) {
  var clipperNfp = [];
  for (let i = 0; i < nfp.length; i++) {
    var clip = nfpToClipperCoordinates(nfp[i], config);
    clipperNfp = clipperNfp.concat(clip);
  }

  return clipperNfp;
}

function toNestCoordinates(polygon, scale) {
  var clone = [];
  for (let i = 0; i < polygon.length; i++) {
    clone.push({
      x: polygon[i].X / scale,
      y: polygon[i].Y / scale
    });
  }

  return clone;
};

function getHull(polygon) {
	// Convert the polygon points to proper Point objects for HullPolygon
	var points = [];
	for (let i = 0; i < polygon.length; i++) {
		points.push({
			x: polygon[i].x,
			y: polygon[i].y
		});
	}

	var hullpoints = HullPolygon.hull(points);

	// If hull calculation failed, return original polygon
	if (!hullpoints) {
		return polygon;
	}

	return hullpoints;
}

function rotatePolygon(polygon, degrees) {
  var rotated = [];
  var angle = degrees * Math.PI / 180;
  for (let i = 0; i < polygon.length; i++) {
    var x = polygon[i].x;
    var y = polygon[i].y;
    var x1 = x * Math.cos(angle) - y * Math.sin(angle);
    var y1 = x * Math.sin(angle) + y * Math.cos(angle);

    rotated.push({ x: x1, y: y1, exact: polygon[i].exact });
  }

  if (polygon.children && polygon.children.length > 0) {
    rotated.children = [];
    for (let j = 0; j < polygon.children.length; j++) {
      rotated.children.push(rotatePolygon(polygon.children[j], degrees));
    }
  }

  return rotated;
};

function getOuterNfp(A, B, inside) {
  var nfp;

  /*var numpoly = A.length + B.length;
  if(A.children && A.children.length > 0){
    A.children.forEach(function(c){
      numpoly += c.length;
    });
  }
  if(B.children && B.children.length > 0){
    B.children.forEach(function(c){
      numpoly += c.length;
    });
  }*/

  // try the file cache if the calculation will take a long time
  var doc = window.db.find({ A: A.source, B: B.source, Arotation: A.rotation, Brotation: B.rotation });

  if (doc) {
    return doc;
  }

  // Check if we can use the optimized rectangle NFP for exact-fit cases
  if (!inside && GeometryUtil.isRectangle(A) && !A.children) {
    var rectangleNfp = GeometryUtil.noFitPolygonRectangle(A, B);
    if (rectangleNfp && rectangleNfp.length > 0) {
      nfp = rectangleNfp;
      // Save to cache
      window.db.insert({ A: A.source, B: B.source, Arotation: A.rotation, Brotation: B.rotation, nfp: nfp });
      return nfp;
    }
  }

  // not found in cache
  if (inside || (A.children && A.children.length > 0)) {
    //console.log('computing minkowski: ',A.length, B.length);
    if (!A.children) {
      A.children = [];
    }
    if (!B.children) {
      B.children = [];
    }
    //console.log('computing minkowski: ', JSON.stringify(Object.assign({}, {A:Object.assign({},A)},{B:Object.assign({},B)})));
    //console.time('addon');
    nfp = addon.calculateNFP({ A: A, B: B });
    //console.timeEnd('addon');
  }
  else {
    // console.log('minkowski', A.length, B.length, A.source, B.source);
    // console.time('clipper');

    var Ac = toClipperCoordinates(A);
    ClipperLib.JS.ScaleUpPath(Ac, 10000000);
    var Bc = toClipperCoordinates(B);
    ClipperLib.JS.ScaleUpPath(Bc, 10000000);
    for (let i = 0; i < Bc.length; i++) {
      Bc[i].X *= -1;
      Bc[i].Y *= -1;
    }
    var solution = ClipperLib.Clipper.MinkowskiSum(Ac, Bc, true);
    //console.log(solution.length, solution);
    //var clipperNfp = toNestCoordinates(solution[0], 10000000);
    var clipperNfp;

    var largestArea = null;
    for (let i = 0; i < solution.length; i++) {
      var n = toNestCoordinates(solution[i], 10000000);
      var sarea = -GeometryUtil.polygonArea(n);
      if (largestArea === null || largestArea < sarea) {
        clipperNfp = n;
        largestArea = sarea;
      }
    }

    for (let i = 0; i < clipperNfp.length; i++) {
      clipperNfp[i].x += B[0].x;
      clipperNfp[i].y += B[0].y;
    }

    nfp = [clipperNfp];
    //console.log('clipper nfp', JSON.stringify(nfp));
    // console.timeEnd('clipper');
  }

  if (!nfp || nfp.length == 0) {
    //console.log('holy shit', nfp, A, B, JSON.stringify(A), JSON.stringify(B));
    return null
  }

  nfp = nfp.pop();

  if (!nfp || nfp.length == 0) {
    return null;
  }

  if (!inside && typeof A.source !== 'undefined' && typeof B.source !== 'undefined') {
    // insert into db
    doc = {
      A: A.source,
      B: B.source,
      Arotation: A.rotation,
      Brotation: B.rotation,
      nfp: nfp
    };
    window.db.insert(doc);
  }

  return nfp;
}

function getFrame(A) {
  var bounds = GeometryUtil.getPolygonBounds(A);

  // expand bounds by 10%
  bounds.width *= 1.1;
  bounds.height *= 1.1;
  bounds.x -= 0.5 * (bounds.width - (bounds.width / 1.1));
  bounds.y -= 0.5 * (bounds.height - (bounds.height / 1.1));

  var frame = [];
  frame.push({ x: bounds.x, y: bounds.y });
  frame.push({ x: bounds.x + bounds.width, y: bounds.y });
  frame.push({ x: bounds.x + bounds.width, y: bounds.y + bounds.height });
  frame.push({ x: bounds.x, y: bounds.y + bounds.height });

  frame.children = [A];
  frame.source = A.source;
  frame.rotation = 0;

  return frame;
}

function getInnerNfp(A, B, config) {
  if (typeof A.source !== 'undefined' && typeof B.source !== 'undefined') {
    var doc = window.db.find({ A: A.source, B: B.source, Arotation: 0, Brotation: B.rotation }, true);

    if (doc) {
      //console.log('fetch inner', A.source, B.source, doc);
      return doc;
    }
  }

  // Check for exact-fit or near-exact-fit case
  // Only apply this optimization if A has no children (i.e., it's an empty sheet)
  if (GeometryUtil.isRectangle(A) && GeometryUtil.isRectangle(B) && (!A.children || A.children.length === 0)) {
    var ABounds = GeometryUtil.getPolygonBounds(A);
    var BBounds = GeometryUtil.getPolygonBounds(B);

    var widthDiff = Math.abs(ABounds.width - BBounds.width);
    var heightDiff = Math.abs(ABounds.height - BBounds.height);

    // If part is very close to sheet size (within tolerance, accounting for scale)
    var tolerance = Math.max(0.001, Math.max(ABounds.width, ABounds.height) * 0.0001); // Dynamic tolerance
    if (widthDiff < tolerance && heightDiff < tolerance) {
      console.log('Exact-fit detected for empty sheet:', A.source, 'and part:', B.source);
      // For exact-fit, return a single point NFP
      // The NFP point should be where the part's reference point needs to be
      // to place the part at the sheet's top-left corner
      var result = [[{
        x: A[0].x + (ABounds.width - BBounds.width) / 2,
        y: A[0].y + (ABounds.height - BBounds.height) / 2
      }]];

      // Cache the result
      if (typeof A.source !== 'undefined' && typeof B.source !== 'undefined') {
        var doc = {
          A: A.source,
          B: B.source,
          Arotation: 0,
          Brotation: B.rotation,
          nfp: result
        };
        window.db.insert(doc, true);
      }

      return result;
    }
  }

  var frame = getFrame(A);

  var nfp = getOuterNfp(frame, B, true);

  if (!nfp || !nfp.children || nfp.children.length == 0) {
    return null;
  }

  var holes = [];
  if (A.children && A.children.length > 0) {
    for (let i = 0; i < A.children.length; i++) {
      var hnfp = getOuterNfp(A.children[i], B);
      if (hnfp) {
        holes.push(hnfp);
      }
    }
  }

  if (holes.length == 0) {
    return nfp.children;
  }

  var clipperNfp = innerNfpToClipperCoordinates(nfp.children, config);
  var clipperHoles = innerNfpToClipperCoordinates(holes, config);

  var finalNfp = new ClipperLib.Paths();
  var clipper = new ClipperLib.Clipper();

  clipper.AddPaths(clipperHoles, ClipperLib.PolyType.ptClip, true);
  clipper.AddPaths(clipperNfp, ClipperLib.PolyType.ptSubject, true);

  if (!clipper.Execute(ClipperLib.ClipType.ctDifference, finalNfp, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero)) {
    return nfp.children;
  }

  if (finalNfp.length == 0) {
    return null;
  }

  var f = [];
  for (let i = 0; i < finalNfp.length; i++) {
    f.push(toNestCoordinates(finalNfp[i], config.clipperScale));
  }

  if (typeof A.source !== 'undefined' && typeof B.source !== 'undefined') {
    // insert into db
    // console.log('inserting inner: ', A.source, B.source, B.rotation, f);
    var doc = {
      A: A.source,
      B: B.source,
      Arotation: 0,
      Brotation: B.rotation,
      nfp: f
    };
    window.db.insert(doc, true);
  }

  return f;
}

function placeParts(sheets, parts, config, nestindex) {
  if (!sheets) {
    return null;
  }

  console.log('PlaceParts started with', parts.length, 'parts and', sheets.length, 'sheets');

  // Log part and sheet dimensions for debugging
  if (parts.length > 0) {
    var partBounds = GeometryUtil.getPolygonBounds(parts[0]);
    console.log('First part dimensions:', partBounds.width, 'x', partBounds.height);
  }
  if (sheets.length > 0) {
    var sheetBounds = GeometryUtil.getPolygonBounds(sheets[0]);
    console.log('First sheet dimensions:', sheetBounds.width, 'x', sheetBounds.height);
  }
  
  // Check if we have too many parts for efficient processing
  if (parts.length > 50) {
    console.warn('Processing', parts.length, 'parts - this may take a long time');
    
    // Check if all parts are identical (same source)
    var firstSource = parts[0].source;
    var allIdentical = parts.every(function(part) { return part.source === firstSource; });
    
    if (allIdentical) {
      console.log('All parts are identical - consider using batch processing optimization');
    }
  }

  var i, j, k, m, n, part;

  var totalnum = parts.length;
  var totalsheetarea = 0;
  var totalPlacedPartArea = 0; // Track total area of placed parts

  // total length of merged lines
  var totalMerged = 0;

  // rotate paths by given rotation
  var rotated = [];
  for (let i = 0; i < parts.length; i++) {
    var r = rotatePolygon(parts[i], parts[i].rotation);
    r.rotation = parts[i].rotation;
    r.source = parts[i].source;
    r.id = parts[i].id;
    r.filename = parts[i].filename;

    rotated.push(r);
  }

  parts = rotated;

  // Set default holeAreaThreshold if not defined
  if (!config.holeAreaThreshold) {
    config.holeAreaThreshold = 1000; // Default value, adjust as needed
  }

  // Pre-analyze holes in all sheets
  const sheetHoleAnalysis = analyzeSheetHoles(sheets);

  // Analyze all parts to identify those with holes and potential fits
  const { mainParts, holeCandidates } = analyzeParts(parts, sheetHoleAnalysis.averageHoleArea, config);

  // console.log(`Analyzed parts: ${mainParts.length} main parts, ${holeCandidates.length} hole candidates`);

  var allplacements = [];
  var fitness = 0;

  // Now continue with the original placeParts logic, but use our sorted parts

  // Combine main parts and hole candidates back into a single array
  // mainParts first since we want to place them first
  parts = [...mainParts, ...holeCandidates];

  // Continue with the original placeParts logic
  // var binarea = Math.abs(GeometryUtil.polygonArea(self.binPolygon));
  var key, nfp;
  var part;

  while (parts.length > 0) {

    var placed = [];
    var placements = [];

    // open a new sheet
    var sheet = sheets.shift();

    // Check if we have a valid sheet
    if (!sheet) {
      console.log('No more sheets available, but', parts.length, 'parts remaining');
      break; // Exit the loop if no more sheets are available
    }

    var sheetarea = Math.abs(GeometryUtil.polygonArea(sheet));
    totalsheetarea += sheetarea;

    fitness += sheetarea; // add 1 for each new sheet opened (lower fitness is better)

    var clipCache = [];
    console.log('Processing new sheet, current parts remaining:', parts.length);
    for (let i = 0; i < parts.length; i++) {
      // console.time('placement');
      part = parts[i];
      console.log('Attempting to place part', i, 'with source:', part.source);

      // Add timeout for NFP calculation to prevent infinite loops
      var nfpStartTime = Date.now();
      var NFP_TIMEOUT = 30000; // 30 seconds timeout per part

      // inner NFP
      var sheetNfp = null;
      // try all possible rotations until it fits
      // (only do this for the first part of each sheet, to ensure that all parts that can be placed are, even if we have to to open a lot of sheets)
      for (let j = 0; j < config.rotations; j++) {
        // Check timeout
        if (Date.now() - nfpStartTime > NFP_TIMEOUT) {
          console.warn('NFP calculation timeout for part', part.source, 'rotation', j);
          break;
        }
        
        console.log('Getting NFP for part', part.source, 'rotation', j);
        sheetNfp = getInnerNfp(sheet, part, config);
        console.log('NFP result:', sheetNfp ? 'found' : 'null');

        if (sheetNfp) {
          break;
        }

        var r = rotatePolygon(part, 360 / config.rotations);
        r.rotation = part.rotation + (360 / config.rotations);
        r.source = part.source;
        r.id = part.id;
        r.filename = part.filename

        // rotation is not in-place
        part = r;
        parts[i] = r;

        if (part.rotation > 360) {
          part.rotation = part.rotation % 360;
        }
      }
      // part unplaceable, skip
      if (!sheetNfp || sheetNfp.length == 0) {
        continue;
      }

      var position = null;

      if (placed.length == 0) {
        // first placement, put it on the top left corner
        for (let j = 0; j < sheetNfp.length; j++) {
          for (let k = 0; k < sheetNfp[j].length; k++) {
            if (position === null || sheetNfp[j][k].x - part[0].x < position.x || (GeometryUtil.almostEqual(sheetNfp[j][k].x - part[0].x, position.x) && sheetNfp[j][k].y - part[0].y < position.y)) {
              position = {
                x: sheetNfp[j][k].x - part[0].x,
                y: sheetNfp[j][k].y - part[0].y,
                id: part.id,
                rotation: part.rotation,
                source: part.source,
                filename: part.filename
              }
            }
          }
        }
        if (position === null) {
          // console.log(sheetNfp);
        }
        placements.push(position);
        placed.push(part);

        // Track placed part area for utilisation calculation
        totalPlacedPartArea += Math.abs(GeometryUtil.polygonArea(part));

        continue;
      }

      // Check for holes in already placed parts where this part might fit
      var holePositions = [];
      try {
        // Track the best rotation for each hole
        const holeOptimalRotations = new Map(); // Map of "parentIndex_holeIndex" -> best rotation

        for (let j = 0; j < placed.length; j++) {
          if (placed[j].children && placed[j].children.length > 0) {
            for (let k = 0; k < placed[j].children.length; k++) {
              // Check if the hole is large enough for the part
              var childHole = placed[j].children[k];
              var childArea = Math.abs(GeometryUtil.polygonArea(childHole));
              var partArea = Math.abs(GeometryUtil.polygonArea(part));

              // Only consider holes that are larger than the part
              if (childArea > partArea * 1.1) { // 10% buffer for placement
                try {
                  var holePoly = [];
                  // Create proper array structure for the hole polygon
                  for (let p = 0; p < childHole.length; p++) {
                    holePoly.push({
                      x: childHole[p].x,
                      y: childHole[p].y,
                      exact: childHole[p].exact || false
                    });
                  }

                  // Add polygon metadata
                  holePoly.source = placed[j].source + "_hole_" + k;
                  holePoly.rotation = 0;
                  holePoly.children = [];


                  // Get dimensions of the hole and part to match orientations
                  const holeBounds = GeometryUtil.getPolygonBounds(holePoly);
                  const partBounds = GeometryUtil.getPolygonBounds(part);

                  // Determine if the hole is wider than it is tall
                  const holeIsWide = holeBounds.width > holeBounds.height;
                  const partIsWide = partBounds.width > partBounds.height;


                  // Try part with current rotation
                  let bestRotationNfp = null;
                  let bestRotation = part.rotation;
                  let bestFitFill = 0;
                  let rotationPlacements = [];

                  // Try original rotation
                  var holeNfp = getInnerNfp(holePoly, part, config);
                  if (holeNfp && holeNfp.length > 0) {
                    bestRotationNfp = holeNfp;
                    bestFitFill = partArea / childArea;

                    for (let m = 0; m < holeNfp.length; m++) {
                      for (let n = 0; n < holeNfp[m].length; n++) {
                        rotationPlacements.push({
                          x: holeNfp[m][n].x - part[0].x + placements[j].x,
                          y: holeNfp[m][n].y - part[0].y + placements[j].y,
                          rotation: part.rotation,
                          orientationMatched: (holeIsWide === partIsWide),
                          fillRatio: bestFitFill
                        });
                      }
                    }
                  }

                  // Try up to 4 different rotations to find the best fit for this hole
                  const rotationsToTry = [90, 180, 270];
                  for (let rot of rotationsToTry) {
                    let newRotation = (part.rotation + rot) % 360;
                    const rotatedPart = rotatePolygon(part, newRotation);
                    rotatedPart.rotation = newRotation;
                    rotatedPart.source = part.source;
                    rotatedPart.id = part.id;
                    rotatedPart.filename = part.filename;

                    const rotatedBounds = GeometryUtil.getPolygonBounds(rotatedPart);
                    const rotatedIsWide = rotatedBounds.width > rotatedBounds.height;
                    const rotatedNfp = getInnerNfp(holePoly, rotatedPart, config);

                    if (rotatedNfp && rotatedNfp.length > 0) {
                      // Calculate fill ratio for this rotation
                      const rotatedFill = partArea / childArea;

                      // If this rotation has better orientation match or is the first valid one
                      if ((holeIsWide === rotatedIsWide && (bestRotationNfp === null || !(holeIsWide === partIsWide))) ||
                        (bestRotationNfp === null)) {
                        bestRotationNfp = rotatedNfp;
                        bestRotation = newRotation;
                        bestFitFill = rotatedFill;

                        // Clear previous placements for worse rotations
                        rotationPlacements = [];

                        for (let m = 0; m < rotatedNfp.length; m++) {
                          for (let n = 0; n < rotatedNfp[m].length; n++) {
                            rotationPlacements.push({
                              x: rotatedNfp[m][n].x - rotatedPart[0].x + placements[j].x,
                              y: rotatedNfp[m][n].y - rotatedPart[0].y + placements[j].y,
                              rotation: newRotation,
                              orientationMatched: (holeIsWide === rotatedIsWide),
                              fillRatio: bestFitFill
                            });
                          }
                        }
                      }
                    }
                  }

                  // If we found valid placements, add them to the hole positions
                  if (rotationPlacements.length > 0) {
                    const holeKey = `${j}_${k}`;
                    holeOptimalRotations.set(holeKey, bestRotation);

                    // Add all placements with complete data
                    for (let placement of rotationPlacements) {
                      holePositions.push({
                        x: placement.x,
                        y: placement.y,
                        id: part.id,
                        rotation: placement.rotation,
                        source: part.source,
                        filename: part.filename,
                        inHole: true,
                        parentIndex: j,
                        holeIndex: k,
                        orientationMatched: placement.orientationMatched,
                        rotated: placement.rotation !== part.rotation,
                        fillRatio: placement.fillRatio
                      });
                    }
                  }
                } catch (e) {
                  // console.log('Error processing hole:', e);
                  // Continue with next hole
                }
              }
            }
          }
        }
      } catch (e) {
        // console.log('Error in hole detection:', e);
        // Continue with normal placement, ignoring holes
      }

      // Fix hole creation by ensuring proper polygon structure
      var validHolePositions = [];
      if (holePositions && holePositions.length > 0) {
        // Filter hole positions to only include valid ones
        for (let j = 0; j < holePositions.length; j++) {
          try {
            // Get parent and hole info
            var parentIdx = holePositions[j].parentIndex;
            var holeIdx = holePositions[j].holeIndex;
            if (parentIdx >= 0 && parentIdx < placed.length &&
              placed[parentIdx].children &&
              holeIdx >= 0 && holeIdx < placed[parentIdx].children.length) {
              validHolePositions.push(holePositions[j]);
            }
          } catch (e) {
            // console.log('Error validating hole position:', e);
          }
        }
        holePositions = validHolePositions;
        // console.log(`Found ${holePositions.length} valid hole positions for part ${part.source}`);
      }

      var clipperSheetNfp = innerNfpToClipperCoordinates(sheetNfp, config);
      var clipper = new ClipperLib.Clipper();
      var combinedNfp = new ClipperLib.Paths();
      var error = false;

      // check if stored in clip cache
      var clipkey = 's:' + part.source + 'r:' + part.rotation;
      var startindex = 0;
      if (clipCache[clipkey]) {
        var prevNfp = clipCache[clipkey].nfp;
        clipper.AddPaths(prevNfp, ClipperLib.PolyType.ptSubject, true);
        startindex = clipCache[clipkey].index;
      }

      for (let j = startindex; j < placed.length; j++) {
        nfp = getOuterNfp(placed[j], part);
        // minkowski difference failed. very rare but could happen
        if (!nfp) {
          error = true;
          break;
        }
        // shift to placed location
        for (let m = 0; m < nfp.length; m++) {
          nfp[m].x += placements[j].x;
          nfp[m].y += placements[j].y;
        }

        if (nfp.children && nfp.children.length > 0) {
          for (let n = 0; n < nfp.children.length; n++) {
            for (let o = 0; o < nfp.children[n].length; o++) {
              nfp.children[n][o].x += placements[j].x;
              nfp.children[n][o].y += placements[j].y;
            }
          }
        }

        var clipperNfp = nfpToClipperCoordinates(nfp, config);
        clipper.AddPaths(clipperNfp, ClipperLib.PolyType.ptSubject, true);
      }

      if (error || !clipper.Execute(ClipperLib.ClipType.ctUnion, combinedNfp, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero)) {
        // console.log('clipper error', error);
        continue;
      }

      clipCache[clipkey] = {
        nfp: combinedNfp,
        index: placed.length - 1
      };
      // console.log('save cache', placed.length - 1);

      // difference with sheet polygon
      var finalNfp = new ClipperLib.Paths();
      clipper = new ClipperLib.Clipper();
      clipper.AddPaths(combinedNfp, ClipperLib.PolyType.ptClip, true);
      clipper.AddPaths(clipperSheetNfp, ClipperLib.PolyType.ptSubject, true);

      if (!clipper.Execute(ClipperLib.ClipType.ctDifference, finalNfp, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftNonZero)) {
        continue;
      }

      if (!finalNfp || finalNfp.length == 0) {
        continue;
      }

      var f = [];
      for (let j = 0; j < finalNfp.length; j++) {
        // back to normal scale
        f.push(toNestCoordinates(finalNfp[j], config.clipperScale));
      }
      finalNfp = f;

      // choose placement that results in the smallest bounding box/hull etc
      // todo: generalize gravity direction
      var minwidth = null;
      var minarea = null;
      var minx = null;
      var miny = null;
      var nf, area, shiftvector;
      var allpoints = [];
      for (let m = 0; m < placed.length; m++) {
        for (let n = 0; n < placed[m].length; n++) {
          allpoints.push({ x: placed[m][n].x + placements[m].x, y: placed[m][n].y + placements[m].y });
        }
      }

      var allbounds;
      var partbounds;
      var hull = null;
      if (config.placementType == 'gravity' || config.placementType == 'box') {
        allbounds = GeometryUtil.getPolygonBounds(allpoints);

        var partpoints = [];
        for (let m = 0; m < part.length; m++) {
          partpoints.push({ x: part[m].x, y: part[m].y });
        }
        partbounds = GeometryUtil.getPolygonBounds(partpoints);
      }
      else if (config.placementType == 'convexhull' && allpoints.length > 0) {
        // Calculate the hull of all already placed parts once
        hull = getHull(allpoints);
      }

      // Process regular sheet positions
      for (let j = 0; j < finalNfp.length; j++) {
        nf = finalNfp[j];
        for (let k = 0; k < nf.length; k++) {
          shiftvector = {
            x: nf[k].x - part[0].x,
            y: nf[k].y - part[0].y,
            id: part.id,
            source: part.source,
            rotation: part.rotation,
            filename: part.filename,
            inHole: false
          };

          if (config.placementType == 'gravity' || config.placementType == 'box') {
            var rectbounds = GeometryUtil.getPolygonBounds([
              // allbounds points
              { x: allbounds.x, y: allbounds.y },
              { x: allbounds.x + allbounds.width, y: allbounds.y },
              { x: allbounds.x + allbounds.width, y: allbounds.y + allbounds.height },
              { x: allbounds.x, y: allbounds.y + allbounds.height },
              // part points
              { x: partbounds.x + shiftvector.x, y: partbounds.y + shiftvector.y },
              { x: partbounds.x + partbounds.width + shiftvector.x, y: partbounds.y + shiftvector.y },
              { x: partbounds.x + partbounds.width + shiftvector.x, y: partbounds.y + partbounds.height + shiftvector.y },
              { x: partbounds.x + shiftvector.x, y: partbounds.y + partbounds.height + shiftvector.y }
            ]);

            // weigh width more, to help compress in direction of gravity
            if (config.placementType == 'gravity') {
              area = rectbounds.width * 5 + rectbounds.height;
            }
            else {
              area = rectbounds.width * rectbounds.height;
            }
          }
          else if (config.placementType == 'convexhull') {
            // Create points for the part at this candidate position
            var partPoints = [];
            for (let m = 0; m < part.length; m++) {
              partPoints.push({
                x: part[m].x + shiftvector.x,
                y: part[m].y + shiftvector.y
              });
            }

            var combinedHull = null;
            // If this is the first part, the hull is just the part itself
            if (allpoints.length === 0) {
              combinedHull = getHull(partPoints);
            } else {
              // Merge the points of the part with the points of the hull
              // and recalculate the combined hull (more efficient than using all points)
              var hullPoints = hull.concat(partPoints);
              combinedHull = getHull(hullPoints);
            }

            if (!combinedHull) {
              // console.warn("Failed to calculate convex hull");
              continue;
            }

            // Calculate area of the convex hull
            area = Math.abs(GeometryUtil.polygonArea(combinedHull));
            // Store for later use
            shiftvector.hull = combinedHull;
          }

          if (config.mergeLines) {
            // if lines can be merged, subtract savings from area calculation
            var shiftedpart = shiftPolygon(part, shiftvector);
            var shiftedplaced = [];

            for (let m = 0; m < placed.length; m++) {
              shiftedplaced.push(shiftPolygon(placed[m], placements[m]));
            }

            // don't check small lines, cut off at about 1/2 in
            var minlength = 0.5 * config.scale;
            var merged = mergedLength(shiftedplaced, shiftedpart, minlength, 0.1 * config.curveTolerance);
            area -= merged.totalLength * config.timeRatio;
          }

          // Check for better placement
          if (
            minarea === null ||
            (config.placementType == 'gravity' && (
              rectbounds.width < minwidth ||
              (GeometryUtil.almostEqual(rectbounds.width, minwidth) && area < minarea)
            )) ||
            (config.placementType != 'gravity' && area < minarea) ||
            (GeometryUtil.almostEqual(minarea, area) && shiftvector.x < minx)
          ) {
            // Before accepting this position, perform an overlap check
            var isOverlapping = false;
            // Create a shifted version of the part to test
            var testShifted = shiftPolygon(part, shiftvector);
            // Convert to clipper format for intersection test
            var clipperPart = toClipperCoordinates(testShifted);
            ClipperLib.JS.ScaleUpPath(clipperPart, config.clipperScale);

            // Check against all placed parts
            for (let m = 0; m < placed.length; m++) {
              // Convert the placed part to clipper format
              var clipperPlaced = toClipperCoordinates(shiftPolygon(placed[m], placements[m]));
              ClipperLib.JS.ScaleUpPath(clipperPlaced, config.clipperScale);

              // Check for intersection (overlap) between parts
              var clipSolution = new ClipperLib.Paths();
              var clipper = new ClipperLib.Clipper();
              clipper.AddPath(clipperPart, ClipperLib.PolyType.ptSubject, true);
              clipper.AddPath(clipperPlaced, ClipperLib.PolyType.ptClip, true);

              // Execute the intersection
              if (clipper.Execute(ClipperLib.ClipType.ctIntersection, clipSolution,
                ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero)) {

                // If there's any overlap (intersection result not empty)
                if (clipSolution.length > 0) {
                  isOverlapping = true;
                  break;
                }
              }
            }
            // Only accept this position if there's no overlap
            if (!isOverlapping) {
              minarea = area;
              if (config.placementType == 'gravity' || config.placementType == 'box') {
                minwidth = rectbounds.width;
              }
              position = shiftvector;
              minx = shiftvector.x;
              miny = shiftvector.y;
              if (config.mergeLines) {
                position.mergedLength = merged.totalLength;
                position.mergedSegments = merged.segments;
              }
            }
          }
        }
      }

      // Now process potential hole positions using the same placement strategies
      try {
        if (holePositions && holePositions.length > 0) {
          // Count how many parts are already in each hole to encourage distribution
          const holeUtilization = new Map(); // Map of "parentIndex_holeIndex" -> count
          const holeAreaUtilization = new Map(); // Map of "parentIndex_holeIndex" -> used area percentage

          // Track which holes are being used
          for (let m = 0; m < placements.length; m++) {
            if (placements[m].inHole) {
              const holeKey = `${placements[m].parentIndex}_${placements[m].holeIndex}`;
              holeUtilization.set(holeKey, (holeUtilization.get(holeKey) || 0) + 1);

              // Calculate area used in each hole
              if (placed[m]) {
                const partArea = Math.abs(GeometryUtil.polygonArea(placed[m]));
                holeAreaUtilization.set(
                  holeKey,
                  (holeAreaUtilization.get(holeKey) || 0) + partArea
                );
              }
            }
          }

          // Sort hole positions to prioritize:
          // 1. Unused holes first (to ensure we use all holes)
          // 2. Then holes with fewer parts
          // 3. Then orientation-matched placements
          holePositions.sort((a, b) => {
            const aKey = `${a.parentIndex}_${a.holeIndex}`;
            const bKey = `${b.parentIndex}_${b.holeIndex}`;

            const aCount = holeUtilization.get(aKey) || 0;
            const bCount = holeUtilization.get(bKey) || 0;

            // First priority: unused holes get top priority
            if (aCount === 0 && bCount > 0) return -1;
            if (bCount === 0 && aCount > 0) return 1;

            // Second priority: holes with fewer parts
            if (aCount < bCount) return -1;
            if (bCount < aCount) return 1;

            // Third priority: orientation match
            if (a.orientationMatched && !b.orientationMatched) return -1;
            if (!a.orientationMatched && b.orientationMatched) return 1;

            // Fourth priority: better hole fit (higher fill ratio)
            if (a.fillRatio && b.fillRatio) {
              if (a.fillRatio > b.fillRatio) return -1;
              if (b.fillRatio > a.fillRatio) return 1;
            }

            return 0;
          });

          // console.log(`Sorted hole positions. Prioritizing distribution across ${holeUtilization.size} used holes out of ${new Set(holePositions.map(h => `${h.parentIndex}_${h.holeIndex}`)).size} total holes`);

          for (let j = 0; j < holePositions.length; j++) {
            let holeShift = holePositions[j];

            // For debugging the hole's orientation
            const holeKey = `${holeShift.parentIndex}_${holeShift.holeIndex}`;
            const partsInThisHole = holeUtilization.get(holeKey) || 0;

            if (config.placementType == 'gravity' || config.placementType == 'box') {
              var rectbounds = GeometryUtil.getPolygonBounds([
                // allbounds points
                { x: allbounds.x, y: allbounds.y },
                { x: allbounds.x + allbounds.width, y: allbounds.y },
                { x: allbounds.x + allbounds.width, y: allbounds.y + allbounds.height },
                { x: allbounds.x, y: allbounds.y + allbounds.height },
                // part points
                { x: partbounds.x + holeShift.x, y: partbounds.y + holeShift.y },
                { x: partbounds.x + partbounds.width + holeShift.x, y: partbounds.y + holeShift.y },
                { x: partbounds.x + partbounds.width + holeShift.x, y: partbounds.y + partbounds.height + holeShift.y },
                { x: partbounds.x + holeShift.x, y: partbounds.y + partbounds.height + holeShift.y }
              ]);

              // weigh width more, to help compress in direction of gravity
              if (config.placementType == 'gravity') {
                area = rectbounds.width * 5 + rectbounds.height;
              }
              else {
                area = rectbounds.width * rectbounds.height;
              }

              // Apply small bonus for orientation match, but no significant scaling factor
              if (holeShift.orientationMatched) {
                area *= 0.99; // Just a tiny (1%) incentive for good orientation
              }

              // Apply a small bonus for unused holes (just enough to break ties)
              if (partsInThisHole === 0) {
                area *= 0.99; // 1% bonus for prioritizing empty holes
                // console.log(`Small priority bonus for unused hole ${holeKey}`);
              }
            }
            else if (config.placementType == 'convexhull') {
              // For hole placements with convex hull, use the actual area without arbitrary factor
              area = Math.abs(GeometryUtil.polygonArea(hull || []));
              holeShift.hull = hull;

              // Apply tiny orientation matching bonus
              if (holeShift.orientationMatched) {
                area *= 0.99;
              }
            }

            if (config.mergeLines) {
              // if lines can be merged, subtract savings from area calculation
              var shiftedpart = shiftPolygon(part, holeShift);
              var shiftedplaced = [];

              for (let m = 0; m < placed.length; m++) {
                shiftedplaced.push(shiftPolygon(placed[m], placements[m]));
              }

              // don't check small lines, cut off at about 1/2 in
              var minlength = 0.5 * config.scale;
              var merged = mergedLength(shiftedplaced, shiftedpart, minlength, 0.1 * config.curveTolerance);
              area -= merged.totalLength * config.timeRatio;
            }

            // Check if this hole position is better than our current best position
            if (
              minarea === null ||
              (config.placementType == 'gravity' && area < minarea) ||
              (config.placementType != 'gravity' && area < minarea) ||
              (GeometryUtil.almostEqual(minarea, area) && holeShift.inHole)
            ) {
              // For hole positions, we need to verify it's entirely within the parent's hole
              // This is a special case where overlap is allowed, but only inside a hole
              var isValidHolePlacement = true;
              var intersectionArea = 0;
              try {
                // Get the parent part and its specific hole where we're trying to place the current part
                var parentPart = placed[holeShift.parentIndex];
                var hole = parentPart.children[holeShift.holeIndex];
                // Shift the hole based on parent's placement
                var shiftedHole = shiftPolygon(hole, placements[holeShift.parentIndex]);
                // Create a shifted version of the current part based on proposed position
                var shiftedPart = shiftPolygon(part, holeShift);

                // Check if the part is contained within this hole using a different approach
                // We'll do this by reversing the hole (making it a polygon) and checking if
                // the part is fully inside it
                var reversedHole = [];
                for (let h = shiftedHole.length - 1; h >= 0; h--) {
                  reversedHole.push(shiftedHole[h]);
                }

                // Convert both to clipper format
                var clipperHole = toClipperCoordinates(reversedHole);
                var clipperPart = toClipperCoordinates(shiftedPart);
                ClipperLib.JS.ScaleUpPath(clipperHole, config.clipperScale);
                ClipperLib.JS.ScaleUpPath(clipperPart, config.clipperScale);

                // Use INTERSECTION instead of DIFFERENCE
                // If part is entirely contained in hole, intersection should equal the part
                var clipSolution = new ClipperLib.Paths();
                var clipper = new ClipperLib.Clipper();
                clipper.AddPath(clipperPart, ClipperLib.PolyType.ptSubject, true);
                clipper.AddPath(clipperHole, ClipperLib.PolyType.ptClip, true);

                if (clipper.Execute(ClipperLib.ClipType.ctIntersection, clipSolution,
                  ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftEvenOdd)) {

                  // If the intersection has different area than the part itself
                  // then the part is not fully contained in the hole
                  var intersectionArea = 0;
                  for (let p = 0; p < clipSolution.length; p++) {
                    intersectionArea += Math.abs(ClipperLib.Clipper.Area(clipSolution[p]));
                  }

                  var partArea = Math.abs(ClipperLib.Clipper.Area(clipperPart));
                  if (Math.abs(intersectionArea - partArea) > (partArea * 0.01)) { // 1% tolerance
                    isValidHolePlacement = false;
                    // console.log(`Part not fully contained in hole: ${part.source}`);
                  }
                } else {
                  isValidHolePlacement = false;
                }

                // Also check if this part overlaps with any other placed parts
                // (it should only overlap with its parent's hole)
                if (isValidHolePlacement) {
                  // Bonus: Check if this part is placed on another part's contour within the same hole
                  // This incentivizes the algorithm to place parts efficiently inside holes
                  let contourScore = 0;
                  // Find other parts already placed in this hole
                  for (let m = 0; m < placed.length; m++) {
                    if (placements[m].inHole &&
                      placements[m].parentIndex === holeShift.parentIndex &&
                      placements[m].holeIndex === holeShift.holeIndex) {
                      // Found another part in the same hole, check proximity/contour usage
                      const p2 = placements[m];

                      // Calculate Manhattan distance between parts
                      const dx = Math.abs(holeShift.x - p2.x);
                      const dy = Math.abs(holeShift.y - p2.y);

                      // If parts are close to each other (touching or nearly touching)
                      const proximityThreshold = 2.0; // proximity threshold in user units
                      if (dx < proximityThreshold || dy < proximityThreshold) {
                        // This placement uses contour of another part - give it a bonus
                        contourScore += 5.0; // This value can be tuned
                        // console.log(`Found contour alignment in hole between ${part.source} and ${placed[m].source}`);
                      }
                    }
                  }

                  // Treat holes exactly like mini-sheets for better space utilization
                  // This approach will ensure efficient hole packing like we do with sheets
                  if (isValidHolePlacement) {
                    // Prioritize placing larger parts in holes first
                    // Apply a stronger bias for larger parts relative to hole size
                    const holeArea = Math.abs(GeometryUtil.polygonArea(shiftedHole));
                    const partArea = Math.abs(GeometryUtil.polygonArea(shiftedPart));

                    // Calculate how much of the hole this part fills (0-1)
                    const fillRatio = partArea / holeArea;

                    // // Apply stronger benefit for parts that utilize more of the hole space
                    // // but ensure we don't overly bias very large parts
                    // if (fillRatio > 0.6) {
                    // 	// Very large parts (60%+ of hole) get maximum benefit
                    // 	area *= 0.4; // 60% reduction
                    // 	// console.log(`Large part ${part.source} fills ${Math.round(fillRatio*100)}% of hole - applying maximum packing bonus`);
                    // } else if (fillRatio > 0.3) {
                    // 	// Medium parts (30-60% of hole) get significant benefit
                    // 	area *= 0.5; // 50% reduction
                    // 	// console.log(`Medium part ${part.source} fills ${Math.round(fillRatio*100)}% of hole - applying major packing bonus`);
                    // } else if (fillRatio > 0.1) {
                    // 	// Smaller parts (10-30% of hole) get moderate benefit
                    // 	area *= 0.6; // 40% reduction
                    // 	// console.log(`Small part ${part.source} fills ${Math.round(fillRatio*100)}% of hole - applying standard packing bonus`);
                    // }
                    // Now apply standard sheet-like placement optimization for parts already in the hole
                    const partsInSameHole = [];
                    for (let m = 0; m < placed.length; m++) {
                      if (placements[m].inHole &&
                        placements[m].parentIndex === holeShift.parentIndex &&
                        placements[m].holeIndex === holeShift.holeIndex) {
                        partsInSameHole.push({
                          part: placed[m],
                          placement: placements[m]
                        });
                      }
                    }

                    // Apply the same edge alignment logic we use for sheet placement
                    if (partsInSameHole.length > 0) {
                      const shiftedPart = shiftPolygon(part, holeShift);
                      const bbox1 = GeometryUtil.getPolygonBounds(shiftedPart);

                      // Track best alignment metrics to prioritize clean edge alignments
                      let bestAlignment = 0;
                      let alignmentCount = 0;

                      // Examine each part already placed in this hole
                      for (let m = 0; m < partsInSameHole.length; m++) {
                        const otherPart = shiftPolygon(partsInSameHole[m].part, partsInSameHole[m].placement);
                        const bbox2 = GeometryUtil.getPolygonBounds(otherPart);

                        // Edge alignment detection with tighter threshold for precision
                        const edgeThreshold = 2.0;

                        // Check all four edge alignments
                        const leftAligned = Math.abs(bbox1.x - (bbox2.x + bbox2.width)) < edgeThreshold;
                        const rightAligned = Math.abs((bbox1.x + bbox1.width) - bbox2.x) < edgeThreshold;
                        const topAligned = Math.abs(bbox1.y - (bbox2.y + bbox2.height)) < edgeThreshold;
                        const bottomAligned = Math.abs((bbox1.y + bbox1.height) - bbox2.y) < edgeThreshold;

                        if (leftAligned || rightAligned || topAligned || bottomAligned) {
                          // Score based on alignment length (better packing)
                          let alignmentLength = 0;

                          if (leftAligned || rightAligned) {
                            // Calculate vertical overlap
                            const overlapStart = Math.max(bbox1.y, bbox2.y);
                            const overlapEnd = Math.min(bbox1.y + bbox1.height, bbox2.y + bbox2.height);
                            alignmentLength = Math.max(0, overlapEnd - overlapStart);
                          } else {
                            // Calculate horizontal overlap
                            const overlapStart = Math.max(bbox1.x, bbox2.x);
                            const overlapEnd = Math.min(bbox1.x + bbox1.width, bbox2.x + bbox2.width);
                            alignmentLength = Math.max(0, overlapEnd - overlapStart);
                          }

                          if (alignmentLength > bestAlignment) {
                            bestAlignment = alignmentLength;
                          }
                          alignmentCount++;
                        }
                      }
                      // Apply additional score for good edge alignments
                      if (bestAlignment > 0) {
                        // Calculate a multiplier based on alignment quality (0.7-0.9)
                        // Better alignments get lower multipliers (better scores)
                        const qualityMultiplier = Math.max(0.7, 0.9 - (bestAlignment / 100) - (alignmentCount * 0.05));
                        area *= qualityMultiplier;
                        // console.log(`Applied sheet-like alignment strategy in hole with quality ${(1-qualityMultiplier)*100}%`);
                      }
                    }
                  }

                  // Normal overlap check with other parts (excluding the parent)
                  for (let m = 0; m < placed.length; m++) {
                    // Skip check against parent part, as we've already verified hole containment
                    if (m === holeShift.parentIndex) continue;

                    var clipperPlaced = toClipperCoordinates(shiftPolygon(placed[m], placements[m]));
                    ClipperLib.JS.ScaleUpPath(clipperPlaced, config.clipperScale);

                    clipSolution = new ClipperLib.Paths();
                    clipper = new ClipperLib.Clipper();
                    clipper.AddPath(clipperPart, ClipperLib.PolyType.ptSubject, true);
                    clipper.AddPath(clipperPlaced, ClipperLib.PolyType.ptClip, true);

                    if (clipper.Execute(ClipperLib.ClipType.ctIntersection, clipSolution,
                      ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero)) {
                      if (clipSolution.length > 0) {
                        isValidHolePlacement = false;
                        // console.log(`Part overlaps with other part: ${part.source} with ${placed[m].source}`);
                        break;
                      }
                    }
                  }
                }
                if (isValidHolePlacement) {
                  // console.log(`Valid hole placement found for part ${part.source} in hole of ${parentPart.source}`);
                }
              } catch (e) {
                // console.log('Error in hole containment check:', e);
                isValidHolePlacement = false;
              }

              // Only accept this position if placement is valid
              if (isValidHolePlacement) {
                minarea = area;
                if (config.placementType == 'gravity' || config.placementType == 'box') {
                  minwidth = rectbounds.width;
                }
                position = holeShift;
                minx = holeShift.x;
                miny = holeShift.y;

                if (config.mergeLines) {
                  position.mergedLength = merged.totalLength;
                  position.mergedSegments = merged.segments;
                }
              }
            }
          }
        }
      } catch (e) {
        // console.log('Error processing hole positions:', e);
      }

      // Continue with best non-hole position if available
      if (position) {
        // Debug placement with less verbose logging
        if (position.inHole) {
          // console.log(`Placed part ${position.source} in hole of part ${placed[position.parentIndex].source}`);
          // Adjust the part placement specifically for hole placement
          // This prevents the part from being considered as overlapping with its parent
          var parentPart = placed[position.parentIndex];
          // console.log(`Hole placement - Parent: ${parentPart.source}, Child: ${part.source}`);

          // Mark the relationship to prevent overlap checks between them in future placements
          position.parentId = parentPart.id;
        }
        placed.push(part);
        placements.push(position);

        // Track placed part area for utilisation calculation
        totalPlacedPartArea += Math.abs(GeometryUtil.polygonArea(part));

        if (position.mergedLength) {
          totalMerged += position.mergedLength;
        }
      } else {
        // Just log part source without additional details
        // console.log(`No placement for part ${part.source}`);
      }

      // send placement progress signal
      var placednum = placed.length;
      for (let j = 0; j < allplacements.length; j++) {
        placednum += allplacements[j].sheetplacements.length;
      }
      //console.log(placednum, totalnum);
      ipcRenderer.send('background-progress', { index: nestindex, progress: 0.5 + 0.5 * (placednum / totalnum) });
      // console.timeEnd('placement');
    }

    // Add fitness components, protecting against NaN from division by zero
    if (minwidth !== null && minarea !== null && sheetarea > 0) {
      fitness += (minwidth / sheetarea) + minarea;
    } else if (minwidth !== null && minarea !== null) {
      // If sheetarea is 0 or very small, just add the minarea component
      fitness += minarea;
    }

    for (let i = 0; i < placed.length; i++) {
      var index = parts.indexOf(placed[i]);
      if (index >= 0) {
        parts.splice(index, 1);
      }
    }

    if (placements && placements.length > 0) {
      allplacements.push({ sheet: sheet.source, sheetid: sheet.id, sheetplacements: placements });
    }
    else {
      break; // something went wrong
    }

    if (sheets.length == 0) {
      break;
    }
  }

  // there were parts that couldn't be placed
  // scale this value high - we really want to get all the parts in, even at the cost of opening new sheets
  console.log('UNPLACED PARTS', parts.length, 'of', totalnum);
  for (let i = 0; i < parts.length; i++) {
    // console.log(`Fitness before unplaced penalty: ${fitness}`);
    const partArea = Math.abs(GeometryUtil.polygonArea(parts[i]));
    // Protect against division by zero
    const penalty = totalsheetarea > 0 ?
      100000000 * ((partArea * 100) / totalsheetarea) :
      100000000 * partArea; // Use partArea as base penalty when totalsheetarea is 0
    // console.log(`Penalty for unplaced part ${parts[i].source}: ${penalty}`);
    fitness += penalty;
    // console.log(`Fitness after unplaced penalty: ${fitness}`);
  }

  // Enhance fitness calculation to encourage more efficient hole usage
  // This rewards more efficient use of material by placing parts in holes
  for (let i = 0; i < allplacements.length; i++) {
    const placements = allplacements[i].sheetplacements;
    // First pass: identify all parts placed in holes
    const partsInHoles = [];
    for (let j = 0; j < placements.length; j++) {
      if (placements[j].inHole === true) {
        // Find the corresponding part to calculate its area
        const partIndex = j;
        if (partIndex >= 0) {
          // Add this part to our tracked list of parts in holes
          partsInHoles.push({
            index: j,
            parentIndex: placements[j].parentIndex,
            holeIndex: placements[j].holeIndex,
            area: Math.abs(GeometryUtil.polygonArea(placed[partIndex])) * 2
          });
          // Base reward for any part placed in a hole
          // console.log(`Part ${placed[partIndex].source} placed in hole of part ${placed[placements[j].parentIndex].source}`);
          // console.log(`Part area: ${Math.abs(GeometryUtil.polygonArea(placed[partIndex]))}, Hole area: ${Math.abs(GeometryUtil.polygonArea(placed[placements[j].parentIndex]))}`);
          fitness -= (Math.abs(GeometryUtil.polygonArea(placed[partIndex])) / totalsheetarea / 100);
        }
      }
    }
    // Second pass: apply additional fitness rewards for parts placed on contours of other parts within holes
    // This incentivizes the algorithm to stack parts efficiently within holes
    for (let j = 0; j < partsInHoles.length; j++) {
      const part = partsInHoles[j];
      for (let k = 0; k < partsInHoles.length; k++) {
        if (j !== k &&
          part.parentIndex === partsInHoles[k].parentIndex &&
          part.holeIndex === partsInHoles[k].holeIndex) {
          // Calculate distances between parts to see if they're using each other's contours
          const p1 = placements[part.index];
          const p2 = placements[partsInHoles[k].index];

          // Calculate Manhattan distance between parts (simple proximity check)
          const dx = Math.abs(p1.x - p2.x);
          const dy = Math.abs(p1.y - p2.y);

          // If parts are close to each other (touching or nearly touching)
          // within configurable threshold - can be adjusted based on your specific needs
          const proximityThreshold = 2.0; // proximity threshold in user units
          if (dx < proximityThreshold || dy < proximityThreshold) {
            // Award extra fitness for parts efficiently placed near each other in the same hole
            // This encourages the algorithm to place parts on contours of other parts
            fitness -= (part.area / totalsheetarea) * 0.01; // Additional 50% bonus
          }
        }
      }
    }
  }

  // send finish progress signal
  ipcRenderer.send('background-progress', { index: nestindex, progress: -1 });

  console.log('WATCH', allplacements);

  // Use the tracked total placed part area for utilisation calculation
  const utilisation = totalsheetarea > 0 && !isNaN(totalPlacedPartArea) ?
    (totalPlacedPartArea / totalsheetarea) * 100 : 0;
  console.log(`Utilisation of the sheet(s): ${utilisation.toFixed(2)}%`);

  // Ensure fitness is never NaN - this would break the genetic algorithm
  if (isNaN(fitness)) {
    console.warn('Fitness calculation resulted in NaN, using fallback value');
    fitness = 1000000; // High penalty value as fallback
  }

  // Ensure utilisation is never NaN
  let finalUtilisation = utilisation;
  if (isNaN(utilisation)) {
    console.warn('Utilisation calculation resulted in NaN, using 0');
    finalUtilisation = 0;
  }

  return { placements: allplacements, fitness: fitness, area: sheetarea, totalarea: totalsheetarea, mergedLength: totalMerged, utilisation: finalUtilisation };
}

// New helper function to analyze sheet holes
function analyzeSheetHoles(sheets) {
  const allHoles = [];
  let totalHoleArea = 0;

  // Analyze each sheet
  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    if (sheet.children && sheet.children.length > 0) {
      for (let j = 0; j < sheet.children.length; j++) {
        const hole = sheet.children[j];
        const holeArea = Math.abs(GeometryUtil.polygonArea(hole));
        const holeBounds = GeometryUtil.getPolygonBounds(hole);

        const holeInfo = {
          sheetIndex: i,
          holeIndex: j,
          area: holeArea,
          width: holeBounds.width,
          height: holeBounds.height,
          isWide: holeBounds.width > holeBounds.height
        };

        allHoles.push(holeInfo);
        totalHoleArea += holeArea;
      }
    }
  }

  // Calculate statistics about holes
  const averageHoleArea = allHoles.length > 0 ? totalHoleArea / allHoles.length : 0;

  return {
    holes: allHoles,
    totalHoleArea: totalHoleArea,
    averageHoleArea: averageHoleArea,
    count: allHoles.length
  };
}

// New helper function to analyze parts, their holes, and potential fits
function analyzeParts(parts, averageHoleArea, config) {
  const mainParts = [];
  const holeCandidates = [];
  const partsWithHoles = [];

  // First pass: identify parts with holes
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].children && parts[i].children.length > 0) {
      const partHoles = [];
      for (let j = 0; j < parts[i].children.length; j++) {
        const hole = parts[i].children[j];
        const holeArea = Math.abs(GeometryUtil.polygonArea(hole));
        const holeBounds = GeometryUtil.getPolygonBounds(hole);

        partHoles.push({
          holeIndex: j,
          area: holeArea,
          width: holeBounds.width,
          height: holeBounds.height,
          isWide: holeBounds.width > holeBounds.height
        });
      }

      if (partHoles.length > 0) {
        parts[i].analyzedHoles = partHoles;
        partsWithHoles.push(parts[i]);
      }
    }

    // Calculate and store the part's dimensions for later use
    const partBounds = GeometryUtil.getPolygonBounds(parts[i]);
    parts[i].bounds = {
      width: partBounds.width,
      height: partBounds.height,
      area: Math.abs(GeometryUtil.polygonArea(parts[i]))
    };
  }

  // console.log(`Found ${partsWithHoles.length} parts with holes`);

  // Second pass: check which parts fit into other parts' holes
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const partMatches = [];

    // Check if this part fits into holes of other parts
    for (let j = 0; j < partsWithHoles.length; j++) {
      const partWithHoles = partsWithHoles[j];
      if (part.id === partWithHoles.id) continue; // Skip self

      for (let k = 0; k < partWithHoles.analyzedHoles.length; k++) {
        const hole = partWithHoles.analyzedHoles[k];

        // Check if part fits in this hole (with or without rotation)
        const fitsNormally = part.bounds.width < hole.width * 0.98 &&
          part.bounds.height < hole.height * 0.98 &&
          part.bounds.area < hole.area * 0.95;

        const fitsRotated = part.bounds.height < hole.width * 0.98 &&
          part.bounds.width < hole.height * 0.98 &&
          part.bounds.area < hole.area * 0.95;

        if (fitsNormally || fitsRotated) {
          partMatches.push({
            partId: partWithHoles.id,
            holeIndex: k,
            requiresRotation: !fitsNormally && fitsRotated,
            fitRatio: part.bounds.area / hole.area
          });
        }
      }
    }

    // Determine if part is a hole candidate
    const isSmallEnough = part.bounds.area < config.holeAreaThreshold ||
      part.bounds.area < averageHoleArea * 0.7;

    if (partMatches.length > 0 || isSmallEnough) {
      part.holeMatches = partMatches;
      part.isHoleFitCandidate = true;
      holeCandidates.push(part);
    } else {
      mainParts.push(part);
    }
  }

  // Prioritize order of main parts - parts with holes that others fit into go first
  mainParts.sort((a, b) => {
    const aHasMatches = holeCandidates.some(p => p.holeMatches &&
      p.holeMatches.some(match => match.partId === a.id));

    const bHasMatches = holeCandidates.some(p => p.holeMatches &&
      p.holeMatches.some(match => match.partId === b.id));

    // First priority: parts with holes that other parts fit into
    if (aHasMatches && !bHasMatches) return -1;
    if (!aHasMatches && bHasMatches) return 1;

    // Second priority: larger parts first
    return b.bounds.area - a.bounds.area;
  });

  // For hole candidates, prioritize parts that fit into holes of parts in mainParts
  holeCandidates.sort((a, b) => {
    const aFitsInMainPart = a.holeMatches && a.holeMatches.some(match =>
      mainParts.some(mp => mp.id === match.partId));

    const bFitsInMainPart = b.holeMatches && b.holeMatches.some(match =>
      mainParts.some(mp => mp.id === match.partId));

    // Priority to parts that fit in holes of main parts
    if (aFitsInMainPart && !bFitsInMainPart) return -1;
    if (!aFitsInMainPart && bFitsInMainPart) return 1;

    // Then by number of matches
    const aMatchCount = a.holeMatches ? a.holeMatches.length : 0;
    const bMatchCount = b.holeMatches ? b.holeMatches.length : 0;
    if (aMatchCount !== bMatchCount) return bMatchCount - aMatchCount;

    // Then by size (smaller first for hole candidates)
    return a.bounds.area - b.bounds.area;
  });

  return { mainParts, holeCandidates };
}

// clipperjs uses alerts for warnings
function alert(message) {
  console.log('alert: ', message);
}
