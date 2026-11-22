/* Run from the Deepnest repository root after npm install: node tests/nfp-cache-rotation-key.cjs
 * The NFP cache keys an entry by the rotations of both parts. The key was parseInt(rotation):
 * a retry that wraps past 360 with a non-integer step leaves e.g. 3.4e-13, which parseInt reads
 * as 3, the key of the real angle 3.6 (100 rotations), so the NFP of another rotation came back. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.env.DEEPNEST_REPO || path.join(__dirname, '..');
const ts = require(path.join(root, 'node_modules/typescript'));
const context = {};
vm.createContext(context);
for (const file of ['util/point.ts', 'nfpDb.ts']) {
  const src = fs.readFileSync(path.join(root, 'main', file), 'utf8').replace(/^import .*;\s*$/mg, '').replace(/export /g, '');
  vm.runInContext(ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
}
const db = vm.runInContext('new NfpCache()', context);
const nfp = (x) => [{ x: x, y: 0 }, { x: x + 1, y: 0 }, { x: x, y: 1 }];
const doc = (Brotation, n) => ({ A: 1, B: 2, Arotation: 0, Brotation, nfp: n });
const firstX = (r) => { const hit = db.find(doc(r)); return hit ? hit[0].x : null; };

// The angles a part goes through with 100 rotations: steps of 3.6, wrapped like placeParts does.
const step = 360 / 100;
let wrapped = 1 * step;
for (let i = 0; i < 99; i++) { wrapped += step; if (wrapped >= 360) wrapped %= 360; }
assert(wrapped > 0 && wrapped < 1e-9, `expected a tiny rest after the full turn, got ${wrapped}`);

db.insert(doc(step, nfp(36))); // the NFP at 3.6 degrees
assert.equal(firstX(wrapped), null, `rotation ${wrapped} must not get the NFP of ${step}`);
db.insert(doc(0, nfp(0)));
assert.equal(firstX(wrapped), 0, 'the rest after a full turn is rotation 0');
assert.equal(firstX(360), 0, 'a full turn is rotation 0');
assert.equal(firstX(step), 36, 'the real angle keeps its own entry');
// The same angle reached by adding steps or by multiplying differs in the last digits.
let added = 0, k = 0;
do { added += 360 / 7; k++; } while (k * (360 / 7) === added && k < 7);
assert.notEqual(k * (360 / 7), added, 'expected adding and multiplying to differ for some step of 360/7');
db.insert(doc(k * (360 / 7), nfp(7)));
assert.equal(firstX(added), 7, 'float noise must not split an angle into two entries');
// Rotations arrive as numbers or strings.
assert.equal(firstX('3.6'), 36, 'string rotation');
// Angles less than a degree apart are different rotations.
db.insert(doc(90.5, nfp(905)));
assert.equal(firstX(90), null, '90 must not get the NFP of 90.5');
console.log('PASS: NFP cache keys tell rotations apart and treat a full turn as 0');
