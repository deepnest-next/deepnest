'use strict';
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
	window.db = require('./nfpDb.js');

	ipcRenderer.on('background-start', (event, data) => {
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

		console.log('pairs: ', pairs.length);

		var process = function (pair) {

			var A = rotatePolygon(pair.A, pair.Arotation);
			var B = rotatePolygon(pair.B, pair.Brotation);

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
			console.log('in sync');
			var c = window.db.getStats();
			console.log('nfp cached:', c);
			console.log()
			ipcRenderer.send('test', [data.sheets, parts, data.config, index]);
			var placement = placeParts(data.sheets, parts, data.config, index);

			placement.index = data.index;
			ipcRenderer.send('background-response', placement);
		}

		console.time('Total');


		if (pairs.length > 0) {
			var p = new Parallel(pairs, {
				evalPath: 'util/eval.js',
				synchronous: false
			});

			var spawncount = 0;

			p._spawnMapWorker = function (i, cb, done, env, wrk) {
				// hijack the worker call to check progress
				ipcRenderer.send('background-progress', { index: index, progress: 0.5 * (spawncount++ / pairs.length) });
				return Parallel.prototype._spawnMapWorker.call(p, i, cb, done, env, wrk);
			}

			p.require('clipper.js');
			p.require('geometryutil.js');

			p.map(process).then(function (processed) {
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
				console.timeEnd('Total');
				console.log('before sync');
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
	// convert to hulljs format
	/*var hull = new ConvexHullGrahamScan();
	for(let i=0; i<polygon.length; i++){
		hull.addPoint(polygon[i].x, polygon[i].y);
	}

	return hull.getHull();*/
	var points = [];
	for (let i = 0; i < polygon.length; i++) {
		points.push([polygon[i].x, polygon[i].y]);
	}
	var hullpoints = d3.polygonHull(points);

	if (!hullpoints) {
		return polygon;
	}

	var hull = [];
	for (let i = 0; i < hullpoints.length; i++) {
		hull.push({ x: hullpoints[i][0], y: hullpoints[i][1] });
	}

	return hull;
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

	// not found in cache
	if (inside || (A.children && A.children.length > 0)) {
		//console.log('computing minkowski: ',A.length, B.length);
		//console.time('addon');
		nfp = addon.calculateNFP({ A: A, B: B });
		//console.timeEnd('addon');
	}
	else {
		console.log('minkowski', A.length, B.length, A.source, B.source);
		console.time('clipper');

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
		console.timeEnd('clipper');
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
		console.log('inserting inner: ', A.source, B.source, B.rotation, f);
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

// Function to place parts within holes efficiently, treating holes similar to sheets
function placePartsInHole(hole, holePlacedParts, holePlacements, placedPos, part, config) {
    // Create a combined NFP for all parts already placed in the hole
    // This is similar to how we place parts on sheets but limited to the hole area
    
    // First, check if the part can fit in the hole at all (quick boundary check)
    var holeBounds = GeometryUtil.getPolygonBounds(hole);
    var shiftedHoleBounds = {
        x: holeBounds.x + placedPos.x,
        y: holeBounds.y + placedPos.y,
        width: holeBounds.width,
        height: holeBounds.height
    };
    
    var bestPosition = null;
    var bestRotatedPart = null;
    var bestArea = Number.MAX_VALUE;

    // Try all rotations
    for (let r = 0; r < config.rotations; r++) {
        var rotationToApply = (r * 360) / config.rotations;
        var rotatedPart = rotatePolygon(part, rotationToApply);
        rotatedPart.rotation = (part.rotation + rotationToApply) % 360;
        rotatedPart.source = part.source;
        rotatedPart.id = part.id;
        rotatedPart.filename = part.filename;
        
        var partBounds = GeometryUtil.getPolygonBounds(rotatedPart);
        
        // Skip if part is clearly too big for this hole
        if (partBounds.width > holeBounds.width || partBounds.height > holeBounds.height) {
            continue;
        }
        
        // Create a "sheet" from the hole for NFP calculations
        var holeSheet = shiftPolygon(hole, placedPos);
        
        // If no parts are placed in the hole yet, place at top-left corner
        if (holePlacedParts.length === 0) {
            var shiftVector = {
                x: shiftedHoleBounds.x - partBounds.x + 1, // 1 = small margin
                y: shiftedHoleBounds.y - partBounds.y + 1  // 1 = small margin
            };
            
            var shiftedPart = shiftPolygon(rotatedPart, shiftVector);
            
            // Check if part fits entirely in the hole
            var fits = true;
            for (let pt = 0; pt < shiftedPart.length; pt++) {
                if (!GeometryUtil.pointInPolygon(shiftedPart[pt], holeSheet)) {
                    fits = false;
                    break;
                }
            }
            
            if (fits) {
                var position = {
                    x: shiftVector.x,
                    y: shiftVector.y,
                    id: rotatedPart.id,
                    source: rotatedPart.source,
                    rotation: rotatedPart.rotation,
                    filename: rotatedPart.filename,
                    placedInHole: true
                };
                
                return {
                    fits: true,
                    position: position,
                    part: rotatedPart
                };
            }
            continue;
        }
        
        // If there are already parts in the hole, we need to find valid placement positions
        // Create polygons for parts already placed in the hole
        var placedPolygons = [];
        for (let i = 0; i < holePlacedParts.length; i++) {
            var placedPart = holePlacedParts[i];
            var placement = holePlacements[i];
            var shiftedPlacedPart = shiftPolygon(placedPart, placement);
            placedPolygons.push(shiftedPlacedPart);
        }
        
        // Use clipper to find valid placement areas
        var clipper = new ClipperLib.Clipper();
        var combinedNfp = new ClipperLib.Paths();
        
        // Add NFPs for each placed part
        for (let i = 0; i < holePlacedParts.length; i++) {
            var nfp = getOuterNfp(holePlacedParts[i], rotatedPart);
            if (!nfp) {
                continue; // Skip if NFP calculation failed
            }
            
            // Shift NFP to the placed part location
            for (let m = 0; m < nfp.length; m++) {
                nfp[m].x += holePlacements[i].x;
                nfp[m].y += holePlacements[i].y;
            }
            
            if (nfp.children && nfp.children.length > 0) {
                for (let n = 0; n < nfp.children.length; n++) {
                    for (let o = 0; o < nfp.children[n].length; o++) {
                        nfp.children[n][o].x += holePlacements[i].x;
                        nfp.children[n][o].y += holePlacements[i].y;
                    }
                }
            }
            
            var clipperNfp = nfpToClipperCoordinates(nfp, config);
            clipper.AddPaths(clipperNfp, ClipperLib.PolyType.ptSubject, true);
        }
        
        // Union all NFPs
        if (!clipper.Execute(ClipperLib.ClipType.ctUnion, combinedNfp, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero)) {
            continue;
        }
        
        // Create clipper paths for the hole
        var clipperHole = [];
        var holeClipper = toClipperCoordinates(holeSheet);
        ClipperLib.JS.ScaleUpPath(holeClipper, config.clipperScale);
        clipperHole.push(holeClipper);
        
        // Find valid placement area by subtracting NFPs from the hole
        var finalNfp = new ClipperLib.Paths();
        clipper = new ClipperLib.Clipper();
        
        clipper.AddPaths(combinedNfp, ClipperLib.PolyType.ptClip, true);
        clipper.AddPaths(clipperHole, ClipperLib.PolyType.ptSubject, true);
        
        if (!clipper.Execute(ClipperLib.ClipType.ctDifference, finalNfp, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftNonZero)) {
            continue;
        }
        
        if (!finalNfp || finalNfp.length === 0) {
            continue;
        }
        
        // Convert back to normal coordinates
        var validPlacementAreas = [];
        for (let j = 0; j < finalNfp.length; j++) {
            validPlacementAreas.push(toNestCoordinates(finalNfp[j], config.clipperScale));
        }
        
        // Find the best placement position within valid areas
        for (let j = 0; j < validPlacementAreas.length; j++) {
            var area = validPlacementAreas[j];
            
            for (let k = 0; k < area.length; k++) {
                var shiftVector = {
                    x: area[k].x - rotatedPart[0].x,
                    y: area[k].y - rotatedPart[0].y
                };
                
                var shiftedPart = shiftPolygon(rotatedPart, shiftVector);
                
                // Check if the part fits entirely within the hole
                var fits = true;
                for (let pt = 0; pt < shiftedPart.length; pt++) {
                    if (!GeometryUtil.pointInPolygon(shiftedPart[pt], holeSheet)) {
                        fits = false;
                        break;
                    }
                }
                
                if (!fits) continue;
                
                // Calculate placement score - prefer positions close to existing parts and hole edges
                var partBounds = GeometryUtil.getPolygonBounds(shiftedPart);
                
                // Gravity-based placement score (prefer top-left)
                var score = partBounds.x + partBounds.y;
                
                if (score < bestArea) {
                    bestArea = score;
                    bestPosition = {
                        x: shiftVector.x,
                        y: shiftVector.y,
                        id: rotatedPart.id,
                        source: rotatedPart.source,
                        rotation: rotatedPart.rotation,
                        filename: rotatedPart.filename,
                        placedInHole: true
                    };
                    bestRotatedPart = rotatedPart;
                }
            }
        }
    }
    
    if (bestPosition) {
        return {
            fits: true,
            position: bestPosition,
            part: bestRotatedPart
        };
    }
    
    return { fits: false };
}

function placeParts(sheets, parts, config, nestindex) {

	if (!sheets) {
		return null;
	}

	var i, j, k, m, n, part;

	var totalnum = parts.length;
	var totalsheetarea = 0;

	// total length of merged lines
	var totalMerged = 0;
	// Count of parts placed in holes - used for fitness calculation
	var partsPlacedInHoles = 0;

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

	var allplacements = [];
	var fitness = 0;

	var key, nfp;
	var part;

	while (parts.length > 0) {

		var placed = [];
		var placements = [];

		// open a new sheet
		var sheet = sheets.shift();
		var sheetarea = Math.abs(GeometryUtil.polygonArea(sheet));
		totalsheetarea += sheetarea;
		
		// Get sheet dimensions for big part comparison
		var sheetBounds = GeometryUtil.getPolygonBounds(sheet);
		var sheetWidth = sheetBounds.width;
		var sheetHeight = sheetBounds.height;

		fitness += sheetarea; // add 1 for each new sheet opened (lower fitness is better)

		var clipCache = [];
		
		// Sort parts by priority:
		// 1. Big parts (width or height > 50% of sheet)
		// 2. Parts with holes
		// 3. Everything else
		var prioritizedParts = [];
		var partsWithHoles = [];
		var normalParts = [];
		
		for (let i = 0; i < parts.length; i++) {
			var partBounds = GeometryUtil.getPolygonBounds(parts[i]);
			
			// Check if it's a big part
			if (partBounds.width > 0.5 * sheetWidth || partBounds.height > 0.5 * sheetHeight) {
				prioritizedParts.push(parts[i]);
			}
			// Check if it has holes
			else if (parts[i].children && parts[i].children.length > 0) {
				partsWithHoles.push(parts[i]);
			}
			// Normal parts
			else {
				normalParts.push(parts[i]);
			}
		}
		
		// Combine all parts in priority order
		var sortedParts = prioritizedParts.concat(partsWithHoles).concat(normalParts);
		
		// Process parts in their new sorted order
		for (let i = 0; i < sortedParts.length; i++) {
			// Use unique timer names to avoid "Timer already exists" error
			const timerName = `placement_${i}`;
			console.time(timerName);
			
			try {
				part = sortedParts[i];
				
				// Before placing on the sheet, check if this part can fit into any hole of already placed parts
				var fitsInHole = false;
				var holePosition = null;
				var holePart = null;

				if (placed.length > 0) {
					// Track parts placed in holes for each parent part with holes
					var partsInHoles = {};
					
					// Look at all placed parts with holes
					for (let j = 0; j < placed.length; j++) {
						if (!placed[j].children || placed[j].children.length === 0) {
							continue;
						}
						
						var placedPos = placements[j];
						var placedPartId = placed[j].id;
						
						// Initialize tracking for this part's holes if needed
						if (!partsInHoles[placedPartId]) {
							partsInHoles[placedPartId] = {
								holeParts: [],
								holePlacements: []
							};
						}
						
						// Find parts that have already been placed in this part's holes
						for (let p = 0; p < placed.length; p++) {
							if (p === j) continue; // Skip the part itself
							
							var placement = placements[p];
							if (placement.placedInHole && placement.holeParentId === placedPartId) {
								partsInHoles[placedPartId].holeParts.push(placed[p]);
								partsInHoles[placedPartId].holePlacements.push({
									x: placement.x - placedPos.x,
									y: placement.y - placedPos.y,
								});
							}
						}
						
						// Try all holes in this part
						for (let k = 0; k < placed[j].children.length; k++) {
							var hole = placed[j].children[k];
							
							// Try to place the part in this hole
							var result = placePartsInHole(
								hole,
								partsInHoles[placedPartId].holeParts,
								partsInHoles[placedPartId].holePlacements,
								placedPos,
								part,
								config
							);
							
							if (result.fits) {
								fitsInHole = true;
								result.position.holeParentId = placedPartId;
								holePosition = result.position;
								holePart = result.part;
								break;
							}
						}
						
						if (fitsInHole) break;
					}
				}
				
				// If the part fits in a hole, place it there and continue
				if (fitsInHole && holePosition && holePart) {
					placements.push(holePosition);
					placed.push(holePart);
					
						// Increment counter for parts placed in holes
					partsPlacedInHoles++;
					
					// Update sortedParts with the rotated part
					sortedParts[i] = holePart;
					
					// Remove from original parts array
					for (let j = 0; j < parts.length; j++) {
						if (parts[j].id === holePart.id && parts[j].source === holePart.source) {
							parts.splice(j, 1);
							break;
						}
					}
					
					continue;
				}

				// inner NFP
				var sheetNfp = null;
				// try all possible rotations until it fits
				// (only do this for the first part of each sheet, to ensure that all parts that can be placed are, even if we have to to open a lot of sheets)
				for (let j = 0; j < config.rotations; j++) {
					sheetNfp = getInnerNfp(sheet, part, config);

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
					sortedParts[i] = r;

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
						console.log(sheetNfp);
					}
					placements.push(position);
					placed.push(part);

					// Remove from original parts array
					for (let j = 0; j < parts.length; j++) {
						if (parts[j].id === part.id && parts[j].source === part.source) {
							parts.splice(j, 1);
							break;
						}
					}

					continue;
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
					console.log('clipper error', error);
					continue;
				}

				clipCache[clipkey] = {
					nfp: combinedNfp,
					index: placed.length - 1
				};

				console.log('save cache', placed.length - 1);

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
				
				for (let j = 0; j < finalNfp.length; j++) {
					nf = finalNfp[j];
					
					for (let k = 0; k < nf.length; k++) {
						shiftvector = {
							x: nf[k].x - part[0].x,
							y: nf[k].y - part[0].y,
							id: part.id,
							source: part.source,
							rotation: part.rotation,
							filename: part.filename
						};

						// Check if the placement would cause overlap with other parts
						var hasOverlap = false;
						// Create shifted part for overlap test
						var shiftedPart = shiftPolygon(part, shiftvector);
						
						for (let m = 0; m < placed.length; m++) {
							var placedPart = placed[m];
							var placedPos = placements[m];
							
							// Skip if the placed part has no children (holes)
							if (!placedPart.children || placedPart.children.length === 0) {
								continue;
							}
							
							// Create a shifted copy of the placed part for overlap testing
							var shiftedPlacedPart = shiftPolygon(placedPart, placedPos);
							
							// Check if the part being placed falls entirely inside any hole of an already placed part
							var fallsInHole = false;
							for (let n = 0; n < shiftedPlacedPart.children.length; n++) {
								var hole = shiftedPlacedPart.children[n];
								
								// Check if part is inside this hole
								if (GeometryUtil.pointInPolygon({ x: shiftedPart[0].x, y: shiftedPart[0].y }, hole)) {
									// Further check if entire part is inside hole (simplified check)
									var partBBox = GeometryUtil.getPolygonBounds(shiftedPart);
									var holeBBox = GeometryUtil.getPolygonBounds(hole);
									
									// Very simplified check - if part's bounds are contained within hole's bounds
									if (partBBox.x >= holeBBox.x && 
										partBBox.y >= holeBBox.y && 
										partBBox.x + partBBox.width <= holeBBox.x + holeBBox.width && 
										partBBox.y + partBBox.height <= holeBBox.y + holeBBox.height) {
										fallsInHole = true;
										break;
									}
								}
							}
							
							if (fallsInHole) {
								continue; // This placement is valid as part falls in a hole
							}
							
							// We need to check if parts overlap
							// We'll use ClipperLib for this check to be consistent with the rest of the code
							var c = new ClipperLib.Clipper();
							var part1 = toClipperCoordinates(shiftedPart);
							var part2 = toClipperCoordinates(shiftedPlacedPart);
							
							ClipperLib.JS.ScaleUpPath(part1, config.clipperScale);
							ClipperLib.JS.ScaleUpPath(part2, config.clipperScale);
							
							var solution = new ClipperLib.Paths();
							c.AddPaths([part1], ClipperLib.PolyType.ptSubject, true);
							c.AddPaths([part2], ClipperLib.PolyType.ptClip, true);
							
							c.Execute(ClipperLib.ClipType.ctIntersection, solution, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
							
							if (solution.length > 0) {
								hasOverlap = true;
								break;
							}
						}

						// Skip this position if overlap was detected
						if (hasOverlap) {
							continue;
						}

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
							
							var combinedHull;
							
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
								console.warn("Failed to calculate convex hull");
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

						if (
						minarea === null ||
						(config.placementType == 'gravity' && (
							rectbounds.width < minwidth ||
							(GeometryUtil.almostEqual(rectbounds.width, minwidth) && area < minarea)
						)) ||
						(config.placementType != 'gravity' && area < minarea) ||
						(GeometryUtil.almostEqual(minarea, area) && shiftvector.x < minx)
						) {
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

				if (position) {
					placed.push(part);
					placements.push(position);
					if (position.mergedLength) {
						totalMerged += position.mergedLength;
					}
					
					// Remove from original parts array
					for (let j = 0; j < parts.length; j++) {
						if (parts[j].id === part.id && parts[j].source === part.source) {
							parts.splice(j, 1);
							break;
						}
					}
				}

				// send placement progress signal
				var placednum = placed.length;
				for (let j = 0; j < allplacements.length; j++) {
					placednum += allplacements[j].sheetplacements.length;
				}
				ipcRenderer.send('background-progress', { index: nestindex, progress: 0.5 + 0.5 * (placednum / totalnum) });
				
			} catch (err) {
				console.error('Error during placement:', err);
				// Continue with the next part instead of crashing
			}
			
			console.timeEnd(timerName);
		}

		fitness += (minwidth / sheetarea) + minarea;

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
	for (let i = 0; i < parts.length; i++) {
		fitness += 100000000 * (Math.abs(GeometryUtil.polygonArea(parts[i])) / totalsheetarea);
	}
	
	// Apply a fitness bonus for parts placed in holes
	// This provides a positive influence on the fitness even if not mathematically precise
	// The more parts placed in holes, the better the fitness (lower value)
	if (partsPlacedInHoles > 0) {
		// Calculate hole utilization bonus as a percentage of total fitness
		// More parts in holes = greater reduction in fitness
		var holeUtilizationBonus = fitness * (0.05 * partsPlacedInHoles);
		fitness -= holeUtilizationBonus;
		
		console.log(`Placed ${partsPlacedInHoles} parts in holes, applying fitness bonus of ${holeUtilizationBonus}`);
	}
	
	// send finish progerss signal
	ipcRenderer.send('background-progress', { index: nestindex, progress: -1 });

	//console.log('WATCH', allplacements);

	return { placements: allplacements, fitness: fitness, area: sheetarea, mergedLength: totalMerged, partsInHoles: partsPlacedInHoles };
}

// clipperjs uses alerts for warnings
function alert(message) {
	console.log('alert: ', message);
}
