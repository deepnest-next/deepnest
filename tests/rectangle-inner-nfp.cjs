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
  var fallbackControls = null;
  if (typeof rectangularInnerNfp === 'function') {
    var holeSheet = poly([[1,1],[139,1],[139,199],[1,199]],'stock',-1,0);holeSheet.children=[poly([[2,2],[3,2],[3,3],[2,3]],2,-3,0)];
    var sloped = poly([[1,1],[139,2],[139,199],[1,199]],'stock',-1,0);
    fallbackControls = [rectangularInnerNfp(holeSheet,parts[0],cfg),rectangularInnerNfp(sloped,parts[0],cfg)];
  }
  ({ result, fallbackControls });
`, context);
assert(Number.isFinite(answer.result.fitness), 'fitness must remain finite');
assert.equal(answer.result.placements.length, 1);
assert.equal(answer.result.placements[0].sheetplacements.length, 2, 'both fitting copies must be placed');
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
        const nf=vm.runInContext('rectangularInnerNfp(A,B,cfg)',context);
        assert(nf);
        const xs=container.map(p=>p.x),ys=container.map(p=>p.y);
        for(const p of nf[0]) {
          const dx=p.x-rotated[0].x,dy=p.y-rotated[0].y;
          for(const q of rotated) {
            assert(q.x+dx>=Math.min(...xs)-1e-12 && q.x+dx<=Math.max(...xs)+1e-12);
            assert(q.y+dy>=Math.min(...ys)-1e-12 && q.y+dy<=Math.max(...ys)+1e-12);
          }
        }
      }
    }
  }
  context.A=[{x:0,y:0},{x:10,y:10},{x:10,y:0},{x:0,y:10}];context.B=rectangle(0,0,1,1);
  assert(vm.runInContext('rectangularInnerNfp(A,B,cfg)',context)===null);
}

console.log('PASS: both copies placed, finite fitness, nonrectangular/hole fallback preserved');
