/* Run from the Deepnest repository root after npm install: node tests/hpgl.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.env.DEEPNEST_REPO || process.cwd();
const deps = process.env.DEEPNEST_DEPS || root;
const ts = require(path.join(deps, 'node_modules/typescript'));

const src = fs.readFileSync(path.join(root, 'main/ui/utils/hpgl.ts'), 'utf8');
const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const mod = { exports: {} };
vm.runInNewContext(out, { module: mod, exports: mod.exports });
const { generateHpgl, HPGL_UNITS_PER_INCH } = mod.exports;

assert.equal(HPGL_UNITS_PER_INCH, 1016);

// open path
assert.equal(
  generateHpgl([{ points: [{ x: 0, y: 0 }, { x: 1, y: 0 }], closed: false }]),
  'IN;\nSP1;\nPU0,0;\nPD1016,0;\nPU;\nSP0;\n'
);

// closed path returns to its start
assert.equal(
  generateHpgl([{ points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }], closed: true }]),
  'IN;\nSP1;\nPU0,0;\nPD1016,0,1016,1016,0,0;\nPU;\nSP0;\n'
);

// rounding to integers
assert.equal(
  generateHpgl([{ points: [{ x: 0.0004, y: 0.0006 }, { x: 0.5, y: 0.5 }], closed: false }]),
  'IN;\nSP1;\nPU0,1;\nPD508,508;\nPU;\nSP0;\n'
);

// custom unitsPerInch and pen
assert.equal(
  generateHpgl([{ points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], closed: false }], { unitsPerInch: 2560, pen: 2 }),
  'IN;\nSP2;\nPU0,0;\nPD2560,2560;\nPU;\nSP0;\n'
);

// paths with fewer than 2 points are skipped
assert.equal(
  generateHpgl([{ points: [], closed: false }, { points: [{ x: 1, y: 1 }], closed: true }]),
  'IN;\nSP1;\nSP0;\n'
);

// 120 points -> PD chunks of 50, 50 and 19 (first point goes to PU)
const many = Array.from({ length: 120 }, (_, i) => ({ x: i, y: 0 }));
const pd = generateHpgl([{ points: many, closed: false }]).split('\n').filter((l) => l.startsWith('PD'));
assert.deepEqual(pd.map((l) => l.slice(2, -1).split(',').length / 2), [50, 50, 19]);

console.log('hpgl tests passed');
