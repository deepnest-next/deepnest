/* Run from the Deepnest repository root after npm install: node tests/placement-rotation-retry.cjs
 * A part that fits the empty sheet at its GA rotation but finds no room next to the parts
 * already placed must be tried at the other allowed rotations before it is left unplaced. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.env.DEEPNEST_REPO || path.join(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
const addon = require(path.join(root, 'node_modules/@deepnest/calculate-nfp'));
const context = { Math, Set, addon, navigator: { userAgent: 'chrome', appName: 'Netscape' }, console: { log() {} }, ipcRenderer: { send() {} } };
context.window = context; context.self = context; vm.createContext(context);
function js(file) { vm.runInContext(fs.readFileSync(path.join(root, 'main', file), 'utf8'), context); }
function typescript(file) {
  const src = fs.readFileSync(path.join(root, 'main', file), 'utf8').replace(/^import .*;\s*$/mg, '').replace(/export /g, '');
  vm.runInContext(ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
}
js('util/clipper.js'); js('util/geometryutil.js');
typescript('util/point.ts'); typescript('util/HullPolygon.ts'); typescript('nfpDb.ts');
vm.runInContext(fs.readFileSync(path.join(root, 'main/background.js'), 'utf8').replace(/^import .*;\s*$/mg, ''), context);

const results = vm.runInContext(`
  window.db = new NfpCache();
  var cfg = { clipperScale: 1e7, curveTolerance: 0.3, rotations: 4, placementType: 'gravity', mergeLines: false, scale: 1, timeRatio: 0.5, simplify: false };
  function poly(points, id, source, rotation) {
    var p = points.map(v => ({x:v[0], y:v[1]}));p.id=id;p.source=source;p.rotation=rotation;p.filename='regression';return p;
  }
  var tall = [[0,0],[490,0],[490,990],[0,990]];
  // GA individuals: [0, 0] fits side by side; at [0, 90] the second part is 990 wide.
  // At [0, 270] the retry steps on to 360, which must be reported (and cached) as 0.
  [[0, 0], [0, 90], [90, 0], [90, 90], [0, 270]].map(function (rot) {
    var sheet = poly([[0,0],[1000,0],[1000,1000],[0,1000]], 'sheet', -1, 0);
    var r = placeParts([sheet], [poly(tall, 0, 0, rot[0]), poly(tall, 1, 0, rot[1])], cfg, 0);
    return { rot: rot, placements: r.placements, fitness: r.fitness };
  });
`, context);

for (const { rot, placements, fitness } of results) {
  const placed = placements.flatMap((p) => p.sheetplacements);
  assert.equal(placed.length, 2, `rotations [${rot}]: both parts must be placed, got ${placed.length}`);
  assert(Number.isFinite(fitness), `rotations [${rot}]: fitness must be finite`);
  // Placed at the reported rotation, each part must lie inside the sheet and not overlap the other.
  const boxes = placed.map((p) => {
    assert([0, 90, 180, 270].includes(p.rotation), `rotations [${rot}]: rotation ${p.rotation} is not an allowed step`);
    const r = (p.rotation * Math.PI) / 180;
    const pts = [[0, 0], [490, 0], [490, 990], [0, 990]].map(([x, y]) => [
      x * Math.cos(r) - y * Math.sin(r) + p.x,
      x * Math.sin(r) + y * Math.cos(r) + p.y,
    ]);
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    const box = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
    assert(box.x0 > -1e-6 && box.y0 > -1e-6 && box.x1 < 1000 + 1e-6 && box.y1 < 1000 + 1e-6, `rotations [${rot}]: part outside the sheet`);
    return box;
  });
  const [a, b] = boxes;
  const overlap = Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));
  assert(overlap < 1e-6, `rotations [${rot}]: parts overlap`);
}
console.log('PASS: a part with no room at its GA rotation is placed at another allowed rotation');
