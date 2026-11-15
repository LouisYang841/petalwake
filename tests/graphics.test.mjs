import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, SETTINGS_KEY, sanitizeSettings, loadSettings, frameDue } from '../src/core/settings.js';
import { Pipeline } from '../src/core/pipeline.js';
import { WindFX } from '../src/fx/windfx.js';
import * as THREE from 'three';

test('mobile defaults low; desktop preserves original high quality', () => {
  assert.deepEqual(loadSettings(null), PRESETS.high);
  assert.deepEqual(loadSettings(null, new URLSearchParams('preset=constructor')), PRESETS.high);
  assert.equal(sanitizeSettings({ dpr: 0.8 }).dpr, 0.8);
  assert.deepEqual(loadSettings(null, new URLSearchParams(), true), PRESETS.low);
});
test('corrupt, missing and unavailable storage fall back safely', () => {
  for (const getItem of [() => '{', () => 'null', () => { throw Error('blocked'); }]) {
    assert.deepEqual(loadSettings({ getItem }), PRESETS.high);
  }
  assert.deepEqual(sanitizeSettings({ dpr: Infinity, fps: -1, meadow: 'bad', bloom: 'false', samples: 16 }), PRESETS.high);
});
test('saved preferences survive; valid URL overrides take precedence without writing storage', () => {
  const storage = { getItem: key => { assert.equal(key, SETTINGS_KEY); return JSON.stringify(PRESETS.medium); } };
  assert.deepEqual(loadSettings(storage), PRESETS.medium);
  const s = loadSettings(storage, new URLSearchParams('preset=ultra-low&q=medium&dpr=0.8&noscale'));
  assert.equal(s.meadow, 'medium'); assert.equal(s.dpr, 0.8); assert.equal(s.adaptive, false); assert.equal(s.fps, 30);
  assert.equal(loadSettings(storage, new URLSearchParams('dpr=-5&q=unknown')).dpr, 1.25);
});
test('frame limits hold their rate on 60Hz and 120Hz displays, including fractional 45fps', () => {
  for (const hz of [60, 120]) for (const fps of [30, 45, 60, 0]) {
    let deadline = 0, count = 0;
    for (let i = 0; i < hz * 10; i++) {
      const result = frameDue(i * 1000 / hz, deadline, fps); deadline = result.deadline;
      if (result.due) count++;
    }
    assert.ok(Math.abs(count - (fps || hz) * 10) <= 1, `${hz}Hz, ${fps}fps: ${count}`);
  }
});
function renderer() {
  return { capabilities: { reversedDepthBuffer: false, maxSamples: 4 }, targets: [], calls: 0,
    setRenderTarget(rt) { this.targets.push(rt); }, render() { this.calls++; } };
}
test('ultra-low removes bloom/ray targets and rendering passes, retains depth composition', () => {
  const r = renderer(), low = new Pipeline(r, PRESETS['ultra-low']); low.setSize(800, 600, 0.75);
  assert.equal(low.sceneRT.width, 600); assert.equal(low.sceneRT.samples, 0); assert.equal(low.compRT.samples, 0);
  assert.equal(low.bloom.length, 0); assert.equal(low.bloomUp.length, 0); assert.equal(low.raysRT, null);
  assert.equal(low.params.blur, 0); assert.equal(low.blurMat.depthWrite, true); assert.ok(low.uDepth.value);
  low.render(new THREE.Scene(), new THREE.PerspectiveCamera(), 1 / 30);
  assert.equal(r.calls, 3); assert.equal(low.finalMat.uniforms.tBloom.value, low.black);
  assert.equal(low.finalMat.uniforms.tRays.value, low.black);
  const highRenderer = renderer(), high = new Pipeline(highRenderer, PRESETS.high); high.setSize(800, 600, 1.5);
  high.render(new THREE.Scene(), new THREE.PerspectiveCamera(), 1 / 60);
  assert.ok(highRenderer.calls > 10); assert.equal(high.sceneRT.samples, 4);
  assert.ok(high.sceneRT.width * high.sceneRT.height > low.sceneRT.width * low.sceneRT.height);
  low.dispose(); high.dispose();
});
test('MSAA respects the device sample limit and particle budgets reduce allocations', () => {
  const r = renderer(); r.capabilities.maxSamples = 2;
  const pipeline = new Pipeline(r, PRESETS.high); pipeline.setSize(800, 600, 1); assert.equal(pipeline.sceneRT.samples, 2);
  const fx = new WindFX({}, {}, pipeline.uDepth, 0.15);
  assert.equal(fx.flakes.max, 1800); assert.equal(fx.sprites.max, 1050);
  pipeline.dispose();
});
