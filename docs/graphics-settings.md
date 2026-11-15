# Graphics settings

Open **Settings** on the title screen or while flying. Choose a preset, optionally
adjust individual settings, then **Save & restart**. Restarting applies allocation
and loading changes consistently; the current flight restarts. Preferences are
saved locally in the browser. The menu pauses flight and releases held controls.

| Preset | Pixel ratio cap | Frame limit | Meadow | Particle budget | MSAA | Effects |
| --- | --- | --- | --- | --- | --- | --- |
| Ultra-low | 0.75 | 30 fps | Minimal | 15% | Off | All optional effects off |
| Low | 1 | 30 fps | Low | 30% | Off | Clouds only |
| Medium | 1.25 | 60 fps | Medium | 60% | 2× | No motion blur or sun rays |
| High | 1.5 | 60 fps | High | 100% | 4× | All effects on |

Touch devices default to Low on their first visit. Desktop defaults to High.
Actual pixel ratio is capped by the display's device pixel ratio. Adaptive
resolution can lower internal rendering resolution further when the device
cannot sustain the selected frame rate.

Individual controls cover pixel ratio (0.5–2), frame limit (30/45/60/unlimited),
meadow density, particle budget, MSAA, adaptive resolution, bloom, sun rays,
motion blur, water reflections, rider shadow, clouds and shore decoration.
MSAA is capped by the GPU's supported sample count. Static baked world shadows
remain part of the world textures.

Disabling bloom and sun rays removes their render targets and passes. Motion
blur off uses the existing single-sample early return while preserving depth for
the rider and particles. Reflections off skips the reflection target and terrain
pass; clouds off skips cloud baking; shore off skips that module and its assets.
Particle budgets reduce both CPU arrays and GPU buffers (Ultra-low: 1,800 flakes
and 1,050 sprites, compared with 12,000 and 7,000 on High).

This does not shrink the main terrain, town or rider downloads, replace WebGL2,
or guarantee a frame rate on any particular phone.

## URL overrides

`?preset=ultra-low|low|medium|high` selects a preset. Existing `?q=`, `?dpr=`,
`?noscale`, `?play` and `?debug` options continue to work; `q` and `dpr` override
the selected preset or saved settings. Query overrides do not overwrite saved
preferences. Saving in the menu removes graphics query overrides so the saved
configuration takes effect. Debug mode continues to disable adaptive resolution.

## Verification

```sh
npm ci
node --test tests/graphics.test.mjs
```

Requires Node.js 22 or newer. Tests cover defaults, malformed/blocked storage,
preference validation, URL precedence, frame pacing at 60/120 Hz, render-target
allocation, rendering-pass counts, depth composition and particle-buffer limits.
The renderer is a test double; these are not GPU benchmarks or browser tests.

For device validation, compare the same flight at High and Ultra-low, use the
browser's performance/GPU tools, check saved settings after reload, and test
opening/closing the menu both during loading and during flight. Check that a
30 fps limit does not cause adaptive resolution to continually decrease.
