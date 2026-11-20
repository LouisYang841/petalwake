import { PRESETS, SETTINGS_KEY, sanitizeSettings } from '../core/settings.js';
import { t, lang, setLang } from './i18n.js';

// Preset keys are the storage names; the labels are sentences like everything else.
const PRESET_LABEL = { 'ultra-low': 'Ultra-low', low: 'Low', medium: 'Medium', high: 'High' };
const MEADOW_LABEL = { minimal: 'Minimal', low: 'Low', medium: 'Medium', high: 'High' };

const fields = [
  ['fps', t('Frame limit'), [[30, '30 fps'], [45, '45 fps'], [60, '60 fps'], [0, t('Unlimited')]]],
  ['meadow', t('Grass and flowers'), ['minimal', 'low', 'medium', 'high'].map(v => [v, t(MEADOW_LABEL[v])])],
  ['particles', t('Particle budget'), [[0.15, '15%'], [0.3, '30%'], [0.6, '60%'], [1, '100%']]],
  ['samples', t('Anti-aliasing (MSAA)'), [[0, t('Off')], [2, '2×'], [4, '4×']]],
  ...[['adaptive', 'Adaptive resolution'], ['bloom', 'Bloom'], ['rays', 'Sun rays'], ['blur', 'Motion blur'],
    ['reflections', 'Water reflections'], ['shadows', 'Rider shadow'], ['clouds', 'Clouds'], ['shore', 'Shore decoration']]
    .map(([key, label]) => [key, t(label), [[true, t('On')], [false, t('Off')]]]),
];

export function createSettingsUI(game, settings) {
  const button = document.createElement('button');
  button.id = 'settings-button'; button.textContent = t('Settings');
  button.setAttribute('aria-haspopup', 'dialog');
  const dialog = document.createElement('dialog');
  dialog.id = 'settings-panel'; dialog.setAttribute('aria-labelledby', 'settings-heading');
  dialog.innerHTML = `<form method="dialog"><header><h2 id="settings-heading">${t('Graphics settings')}</h2><button value="cancel" aria-label="${t('Close settings')}">${t('close')}</button></header>
    <p>${t('Lower resolution, meadow density and particle budgets reduce rendering work. Ultra-low also skips clouds and shore decoration.')}</p>
    <label>${t('Language')} <select id="lang-select"><option value="zh"${lang === 'zh' ? ' selected' : ''}>中文</option><option value="en"${lang === 'en' ? ' selected' : ''}>English</option></select></label>
    <label>${t('Preset')} <select id="graphics-preset"><option value="custom">${t('Custom')}</option>${Object.keys(PRESETS).map(key => `<option value="${key}">${t(PRESET_LABEL[key])}</option>`).join('')}</select></label>
    <label>${t('Render scale')} <span class="render-scale"><input id="render-scale" type="range" min="25" max="100" step="1"><output for="render-scale"></output></span></label>
    <p>${t('100% uses your screen’s native resolution. 50% uses half the width and height, rendering a quarter as many pixels. Adaptive resolution can lower this further.')}</p>
    <div id="graphics-fields"></div>
    <p id="settings-message" role="status">${t('Graphics changes restart the game and are saved on this device.')}</p>
    <footer><button type="button" id="settings-apply">${t('Save & restart')}</button></footer></form>`;
  document.body.append(button, dialog);
  dialog.querySelector('#lang-select').addEventListener('change', (e) => setLang(e.target.value));
  const scale = dialog.querySelector('#render-scale');
  const scaleValue = dialog.querySelector('output');
  const inputs = { renderScale: scale };
  const showScale = () => {
    scaleValue.value = `${scale.value}%`;
    scale.setAttribute('aria-valuetext', scaleValue.value);
  };
  scale.addEventListener('input', () => { showScale(); preset.value = 'custom'; });
  for (const [key, label, options] of fields) {
    const row = document.createElement('label'); row.textContent = label;
    const select = document.createElement('select');
    for (const [value, text] of options) {
      const option = document.createElement('option'); option.value = String(value); option.textContent = text; select.append(option);
    }
    row.append(select); dialog.querySelector('#graphics-fields').append(row); inputs[key] = select;
    select.addEventListener('change', () => { preset.value = 'custom'; });
  }
  const preset = dialog.querySelector('#graphics-preset');
  function fill(value) {
    for (const key in inputs) {
      inputs[key].value = String(value[key]);
    }
    showScale();
    preset.value = Object.keys(PRESETS).find(name => Object.keys(inputs).every(key => PRESETS[name][key] === value[key])) || 'custom';
  }
  fill(settings);
  preset.addEventListener('change', () => { if (PRESETS[preset.value]) fill(PRESETS[preset.value]); });
  let wasPaused = false, wasEnabled = false;
  function clearInput() {
    const input = game.input;
    if (!input) return;
    input.reset?.(); input.keys.clear(); input.pressed.clear();
    input.stickX = input.stickY = 0;
    input.mouseBoost = input.mouseBrake = false;
    input._tap = -1e9;
    game.touch?.reset();
  }
  button.addEventListener('click', () => {
    wasPaused = game.paused; wasEnabled = game.input?.enabled;
    game.paused = true;
    clearInput();
    if (game.input) game.input.enabled = false;
    document.exitPointerLock?.(); dialog.showModal();
  });
  dialog.addEventListener('keydown', e => e.stopPropagation());
  dialog.addEventListener('close', () => {
    game.paused = wasPaused;
    clearInput();
    if (game.input) game.input.enabled = wasEnabled || game.state === 'play';
  });
  dialog.querySelector('#settings-apply').addEventListener('click', () => {
    const value = { renderScale: Number(scale.value) };
    for (const [key, , options] of fields) {
      const raw = inputs[key].value;
      value[key] = typeof options[0][0] === 'boolean' ? raw === 'true' : typeof options[0][0] === 'number' ? Number(raw) : raw;
    }
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(sanitizeSettings(value))); }
    catch { dialog.querySelector('#settings-message').textContent = t('Storage is unavailable. Allow browser storage to save graphics settings.'); return; }
    const url = new URL(location.href);
    for (const key of ['preset', 'q', 'dpr', 'scale', 'noscale']) url.searchParams.delete(key);
    location.assign(url.href);
  });

}
