// Validated, versioned preferences. URL overrides never overwrite saved preferences.
export const SETTINGS_KEY = 'petalwake.graphics.v1';
export const PRESETS = {
  'ultra-low': { dpr: 0.75, fps: 30, meadow: 'minimal', particles: 0.15, samples: 0, bloom: false, rays: false, blur: false, reflections: false, shadows: false, clouds: false, shore: false, adaptive: true },
  low: { dpr: 1, fps: 30, meadow: 'low', particles: 0.3, samples: 0, bloom: false, rays: false, blur: false, reflections: false, shadows: false, clouds: true, shore: false, adaptive: true },
  medium: { dpr: 1.25, fps: 60, meadow: 'medium', particles: 0.6, samples: 2, bloom: true, rays: false, blur: false, reflections: true, shadows: true, clouds: true, shore: true, adaptive: true },
  high: { dpr: 1.5, fps: 60, meadow: 'high', particles: 1, samples: 4, bloom: true, rays: true, blur: true, reflections: true, shadows: true, clouds: true, shore: true, adaptive: true },
};
const choices = {
  dpr: [0.5, 0.75, 1, 1.25, 1.5, 2], fps: [30, 45, 60, 0],
  meadow: ['minimal', 'low', 'medium', 'high'], particles: [0.15, 0.3, 0.6, 1], samples: [0, 2, 4],
};
export function sanitizeSettings(value, mobile = false) {
  const base = PRESETS[mobile ? 'low' : 'high'];
  const result = { ...base };
  if (!value || typeof value !== 'object') return result;
  for (const key of Object.keys(base)) {
    const valid = key === 'dpr' ? Number.isFinite(value[key]) && value[key] >= 0.5 && value[key] <= 2
      : choices[key] ? choices[key].includes(value[key]) : typeof value[key] === 'boolean';
    if (valid) result[key] = value[key];
  }
  return result;
}
export function loadSettings(storage, params = new URLSearchParams(), mobile = false) {
  let saved;
  try { saved = JSON.parse(storage?.getItem(SETTINGS_KEY)); } catch { /* storage can be unavailable */ }
  const settings = params.has('preset') && Object.hasOwn(PRESETS, params.get('preset'))
    ? { ...PRESETS[params.get('preset')] } : sanitizeSettings(saved, mobile);
  if (['minimal', 'low', 'medium', 'high'].includes(params.get('q'))) settings.meadow = params.get('q');
  const dpr = Number(params.get('dpr'));
  if (params.has('dpr') && Number.isFinite(dpr) && dpr >= 0.5 && dpr <= 2) settings.dpr = dpr;
  if (params.has('noscale') || params.has('debug')) settings.adaptive = false;
  return settings;
}

// Fractional deadlines avoid turning a 45 fps limit on a 60 Hz display into 30 fps.
export function frameDue(now, deadline, fps) {
  if (!fps) return { due: true, deadline: now };
  const interval = 1000 / fps;
  if (now + 0.1 < deadline) return { due: false, deadline };
  return { due: true, deadline: now - deadline > interval ? now + interval : deadline + interval };
}
