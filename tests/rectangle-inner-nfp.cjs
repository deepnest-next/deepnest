/* Run from the Deepnest repository root after npm install: node tests/rectangle-inner-nfp.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.env.DEEPNEST_REPO || process.cwd();
const deps = process.env.DEEPNEST_DEPS || root;
const ts = require(path.join(deps, 'node_modules/typescript'));
const addon = require(path.join(deps, 'node_modules/@deepnest/calculate-nfp'));
const context = { Math, Set, addon, navigator: { userAgent: 'chrome', appName: 'Netscape' }, console: { log() {} }, ipcRenderer: { send() {} } };
context.window = context; context.self = context; vm.createContext(context);
function js(file) { vm.runInContext(fs.readFileSync(path.join(root, 'main', file), 'utf8'), context); }
function typescript(file) {
  const src = fs.readFileSync(path.join(root, 'main', file), 'utf8').replace(/^import .*;\s*$/mg, '').replace(/export /g, '');
  vm.runInContext(ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
}
js('util/clipper.js'); js('util/geometryutil.js');
typescript('util/point.ts'); typescript('util/HullPolygon.ts'); typescript('nfpDb.ts');
const bg = fs.readFileSync(process.env.DEEPNEST_BACKGROUND || path.join(root, 'main/background.js'), 'utf8').replace(/^import .*;\s*$/mg, '');
vm.runInContext(bg, context);
const answer = vm.runInContext(`
  window.db = new NfpCache();
  var cfg = { clipperScale: 1e7, curveTolerance: 0.3, rotations: 4, placementType: 'gravity', mergeLines: false, scale: 1, timeRatio: 0.5, simplify: false };
  function poly(points, id, source, rotation) {
    var p = points.map(v => ({x:v[0], y:v[1]}));p.id=id;p.source=source;p.rotation=rotation;p.filename='regression';return p;
  }
  var points = [[-0.113,-0.113],[-0.113,11.04654],[25.85345,11.04654],[25.85345,-0.113]];
  var sheet = poly([[1,1],[139,1],[139,199],[1,199]],'stock',-1,0);
  var parts = [poly(points,0,0,90),poly(points,1,0,270)];
  var result = placeParts([sheet],parts,cfg,0);
  // A sheet nothing fits on (10x10 offcut) listed first must be skipped, not end the layout.
  var offcut = poly([[0,0],[10,0],[10,10],[0,10]],'offcut',-2,0);
  var bigSheet = poly([[1,1],[139,1],[139,199],[1,199]],'stock',-1,0);
  var skipped = placeParts([offcut,bigSheet],[poly(points,0,0,90),poly(points,1,0,270)],cfg,0);
  var fallbackControls = null;
  if (typeof rectangularInnerNfp === 'function') {
    var holeSheet = poly([[1,1],[139,1],[139,199],[1,199]],'stock',-1,0);holeSheet.children=[poly([[2,2],[3,2],[3,3],[2,3]],2,-3,0)];
    var sloped = poly([[1,1],[139,2],[139,199],[1,199]],'stock',-1,0);
    fallbackControls = [rectangularInnerNfp(holeSheet,parts[0],cfg),rectangularInnerNfp(sloped,parts[0],cfg)];
  }
  // #137: exact fits and rows of touching parts, [sheet w, h, part w, h, copies, rotation].
  function exactFit(c) {
    window.db = new NfpCache();
    var copies = [];
    for (var n = 0; n < c[4]; n++) copies.push(poly([[0,0],[c[2],0],[c[2],c[3]],[0,c[3]]], n, n, c[5]));
    var r = placeParts([poly([[0,0],[c[0],0],[c[0],c[1]],[0,c[1]]],'stock',-1,0)], copies, cfg, 0);
    if (!r.placements.length) return 0;
    // How far any placed part sticks out of the sheet, relative to the allowed half tolerance.
    var sheetBox = poly([[0,0],[c[0],0],[c[0],c[1]],[0,c[1]]],'stock',-1,0);
    var worst = 0;
    r.placements[0].sheetplacements.forEach(function (pl) {
      var b = GeometryUtil.getPolygonBounds(rotatePolygon(copies[pl.id], pl.rotation));
      var out = Math.max(-(b.x + pl.x), -(b.y + pl.y), b.x + pl.x + b.width - c[0], b.y + pl.y + b.height - c[1]);
      worst = Math.max(worst, out / (sheetTolerance(sheetBox) / 2));
    });
    exactOverhang = Math.max(exactOverhang, worst);
    return r.placements[0].sheetplacements.length;
  }
  var exactOverhang = 0;
  var exactCases = [[1000,1000,1000,1000,1,0],[1000,1000,1000,1000,1,90],[1000,1000,500,1000,2,0],
    [1000,1000,1000,500,2,90],[1000,110,100,100,10,0],[2834.645669291339,2834.645669291339,1417.3228346456694,2834.645669291339,2,0],
    [2834.6456693,2834.6456693,2834.645752,2834.645752,1,0]];
  var exact = exactCases.map(c => [c, exactFit(c)]);
  // Clearly too big must still not fit, also with a coarse curve tolerance:
  // the sheet tolerance must not grow with user settings.
  cfg.curveTolerance = 100;
  var tooBig = exactFit([1000,1000,1000.01,1000,1,0]) + exactFit([1000,1000,1000.002,1000,1,0]);
  cfg.curveTolerance = 0.3;
  // A needle whose tip pokes 0.5 out of a 1000 sheet: tiny area outside, but 500x deeper than
  // the tolerance. A part 1e-7 of the sheet size too big (float32 import) is accepted.
  var sheet1000 = poly([[0,0],[1000,0],[1000,1000],[0,1000]],'stock',-1,0);
  var needleOut = hasMaterialOutsideSheet(poly([[900,100],[1000.5,100.02],[900,100.04]],0,0,0), sheet1000, cfg);
  var float32In = !hasMaterialOutsideSheet(poly([[0,0],[1000.0001,0],[1000.0001,1000.0001],[0,1000.0001]],0,0,0), sheet1000, cfg);
  // The same for a hole in the sheet; a part whose own hole encloses the sheet's hole is inside.
  var holed1000 = poly([[0,0],[1000,0],[1000,1000],[0,1000]],'stock',-1,0);
  holed1000.children = [poly([[400,400],[600,400],[600,600],[400,600]],'hole',-2,0)];
  var holeNeedle = hasMaterialOutsideSheet(poly([[300,500],[400.5,500.02],[300,500.04]],0,0,0), holed1000, cfg);
  var holeFloat32 = !hasMaterialOutsideSheet(poly([[0,0],[400.0001,0],[400.0001,1000],[0,1000]],0,0,0), holed1000, cfg);
  var ring = poly([[300,300],[700,300],[700,700],[300,700]],0,0,0); ring.children = [poly([[350,350],[650,350],[650,650],[350,650]],0,0,0)];
  var ringIn = !hasMaterialOutsideSheet(ring, holed1000, cfg);
  // Exact fits on non-rectangular sheets and sheets with holes (native inner NFP): the plain
  // inner NFP has zero area there, so only those parts may use the tolerance band.
  // [sheet, holes, parts, at most this share of the sheet tolerance outside, placement type].
  function within(part, s, d) {
    var paths = [outerPathToClipperCoordinates(s, cfg)].concat(childPathsToClipperCoordinates(s, cfg));
    var grownSheet = new ClipperLib.Paths(), offset = new ClipperLib.ClipperOffset(), out = new ClipperLib.Paths();
    offset.AddPaths(paths, ClipperLib.JoinType.jtMiter, ClipperLib.EndType.etClosedPolygon);
    offset.Execute(grownSheet, d * cfg.clipperScale);
    var clipper = new ClipperLib.Clipper();
    clipper.AddPath(outerPathToClipperCoordinates(part, cfg), ClipperLib.PolyType.ptSubject, true);
    clipper.AddPaths(grownSheet, ClipperLib.PolyType.ptClip, true);
    clipper.Execute(ClipperLib.ClipType.ctDifference, out, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
    return !hasNonZeroClipperArea(out);
  }
  function nativeFit(c) {
    window.db = new NfpCache();
    var s = poly(c[0],'stock',-1,0);
    if (c[1]) s.children = c[1].map(function (h, i) { return poly(h,'hole'+i,-2-i,0); });
    var copies = c[2].map(function (p, i) { return poly(p,i,i,0); });
    cfg.placementType = c[4] || 'gravity';
    var r = placeParts([s], copies, cfg, 0);
    cfg.placementType = 'gravity';
    if (!r.placements.length) return [0, true];
    var inside = r.placements[0].sheetplacements.every(function (pl) {
      return within(shiftPolygon(rotatePolygon(copies[pl.id], pl.rotation), pl), s, c[3] * sheetTolerance(s));
    });
    return [r.placements[0].sheetplacements.length, inside];
  }
  function rect(x, y, w, h) { return [[x,y],[x+w,y],[x+w,y+h],[x,y+h]]; }
  function scaled(pts, f) { return pts.map(function (v) { return [f(v[0]), f(v[1])]; }); }
  var L = [[0,0],[1000,0],[1000,400],[400,400],[400,1000],[0,1000]];
  var square = rect(0,0,1000,1000), hole = [rect(600,100,300,800)];
  // 1 mm in SVG units, and what the float32 import makes of a size (#137).
  var mm = 72 / 25.4, f32 = function (v) { return Math.fround(v * mm); };
  var irregular = [
    [L, null, [L], 0.51],                                         // L part on an identical L sheet
    [L, null, [rect(0,0,1000,400), rect(0,0,400,600)], 0.51],     // two rectangles tiling the L
    [square, hole, [rect(0,0,600,1000)], 0.51],                   // filling the strip next to a hole
    [L, null, [rect(0,0,200,600), rect(0,0,200,600)], 0.51],      // a row of two filling the 400 leg
    [square, hole, [rect(0,0,200,1000), rect(0,0,200,1000), rect(0,0,200,1000)], 0.51], // a row of three next to the hole
    [scaled(L, function (v) { return v * mm; }), null, [scaled(L, f32)], 0.51],           // float32: a hair too big
    [scaled(square, function (v) { return v * mm; }), [scaled(rect(400,100,500,800), function (v) { return v * mm; })], [scaled(rect(0,0,400,1000), f32)], 0.51],
    // Parts with room stay off the tolerance band (only native NFP rounding, 2e-6 of 1000 here).
    [L, null, [rect(0,0,500,300), rect(0,0,300,300)], 0.01],
    [square, hole, [rect(0,0,500,900), rect(0,0,50,50)], 0.01],
    // Without the plain inner NFP these put the last part into the band although it has room.
    [L, null, [rect(0,0,400,1000), rect(0,0,600,200)], 0.01, 'box'],
    [L, null, [rect(0,0,100,200), rect(0,0,200,1000), rect(0,0,350,380)], 0.01],
    [L, null, [rect(0,0,240,290), rect(0,0,310,440), rect(0,0,100,100), rect(0,0,160,370)], 0.01, 'convexhull'],
    [L.slice().reverse(), null, [L], 0.51]                                 // the sheet's orientation does not matter
  ].map(nativeFit);
  // Too big by twice the tolerance (2e-6 of the sheet): never placed.
  var irregularTooBig = [
    nativeFit([L, null, [scaled(L, function (v) { return v * (1 + 2e-6); })], 1])[0],
    nativeFit([square, hole, [rect(0,0,600.002,1000)], 1])[0]
  ];
  ({ result, skipped, fallbackControls, exact, tooBig, needleOut, float32In, holeNeedle, holeFloat32, ringIn, exactOverhang, irregular, irregularTooBig });
`, context);
for (const [c, placed] of answer.exact) assert.equal(placed, c[4], `#137 exact fit ${c.join(' ')}: ${placed}/${c[4]} placed`);
assert(answer.exactOverhang <= 1 + 1e-6, `#137 exact fits may stick out by at most half the sheet tolerance, got ${answer.exactOverhang}x`);
assert.deepEqual(Array.from(answer.irregular, r => r[0]), [1, 2, 1, 2, 3, 1, 1, 2, 2, 2, 3, 4, 1], '#137 exact fits on non-rectangular sheets and sheets with holes: parts placed per case');
answer.irregular.forEach((r, i) => assert(r[1], `#137 irregular case ${i}: a part sticks out of the sheet further than allowed`));
assert.deepEqual([...answer.irregularTooBig], [0, 0], 'a part 2e-6 of the sheet too big must not be placed on an irregular sheet or one with holes');
assert(answer.needleOut, 'a needle poking 0.5 out of the sheet is outside, however small its area');
assert(answer.float32In, 'a part 1e-7 of the sheet size too big (float32 import) is inside');
assert(answer.holeNeedle, 'a needle poking 0.5 into a hole of the sheet is outside');
assert(answer.holeFloat32, 'a part reaching 1e-7 of the sheet size into a hole (float32 import) is inside');
assert(answer.ringIn, 'a part whose own hole encloses a hole of the sheet is inside');
assert.equal(answer.tooBig, 0, 'a part 0.002 (2e-6) or 0.01 wider than a 1000 sheet must not be placed, whatever the curve tolerance');
assert(Number.isFinite(answer.result.fitness), 'fitness must remain finite');
assert.equal(answer.result.placements.length, 1);
assert.equal(answer.result.placements[0].sheetplacements.length, 2, 'both fitting copies must be placed');
assert.equal(answer.skipped.placements.length, 1, 'parts must land on the sheet after the offcut');
assert.equal(answer.skipped.placements[0].sheet, -1);
assert.equal(answer.skipped.placements[0].sheetplacements.length, 2);
assert(Number.isFinite(answer.skipped.fitness), 'skipping a sheet must keep fitness finite');
assert(Math.abs(answer.skipped.fitness - answer.result.fitness) < 1e-6, 'an unused offcut must not change fitness');
if (answer.fallbackControls) assert(answer.fallbackControls.every(v => v === null));
if (vm.runInContext("typeof rectangularInnerNfp === 'function'", context)) {
  let seed=20261006;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32};
  const rectangle=(x,y,w,h)=>[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];
  for(let n=0;n<1000;n++) {
    const A=rectangle(random()*100-50,random()*100-50,100+random()*100,100+random()*100);
    const B=rectangle(random()*20-10,random()*20-10,5+random()*30,5+random()*30);
    for(const angle of [0,90,180,270]) {
      const r=angle*Math.PI/180;
      const rotated=B.map(p=>({x:p.x*Math.cos(r)-p.y*Math.sin(r),y:p.x*Math.sin(r)+p.y*Math.cos(r)}));
      for(const container of [A,[...A].reverse()]) {
        context.A=container;context.B=rotated;
        const slack=vm.runInContext('sheetTolerance(A)/2',context);
        const nf=vm.runInContext('rectangularInnerNfp(A,B,cfg)',context);
        assert(nf);
        const xs=container.map(p=>p.x),ys=container.map(p=>p.y);
        for(const p of nf[0]) {
          const dx=p.x-rotated[0].x,dy=p.y-rotated[0].y;
          for(const q of rotated) {
            // The far edges may overhang by half the sheet tolerance (#137).
            assert(q.x+dx>=Math.min(...xs)-1e-12 && q.x+dx<=Math.max(...xs)+slack+1e-12);
            assert(q.y+dy>=Math.min(...ys)-1e-12 && q.y+dy<=Math.max(...ys)+slack+1e-12);
          }
        }
      }
    }
  }
  context.A=[{x:0,y:0},{x:10,y:10},{x:10,y:0},{x:0,y:10}];context.B=rectangle(0,0,1,1);
  assert(vm.runInContext('rectangularInnerNfp(A,B,cfg)',context)===null);
}

console.log('PASS: both copies placed, exact fits placed (#137) within half the tolerance, exact fits on non-rectangular sheets and sheets with holes placed, unusable first sheet skipped, finite fitness, nonrectangular/hole fallback preserved');
