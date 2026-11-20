// The journal: a treasure counter in the HUD, a card when something is found, and a page (J) that
// lists what has been found with its lore, and what has not as a hint of where to look.
// Builds its own DOM so the page only needs the stylesheet (src/ui/journal.css).
import { t, tn } from './i18n.js';

const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const css = (c) => `rgb(${c.map((v) => Math.round(Math.min(1, Math.max(0, v)) ** (1 / 2.2) * 255)).join(' ')})`;

export class Journal {
  constructor(places, game) {
    this.places = places;
    this.game = game;
    this.open = false;
    this.cardT = 0;

    // ---- HUD counter, under the seeds
    const tl = document.querySelector('#hud .hud-tl');
    this.counter = el('div', 'treasures', '<span class="treasures-gem"></span><span class="treasures-n"></span><span class="treasures-of"></span><kbd>J</kbd>');
    if (tl) tl.insertBefore(this.counter, tl.querySelector('.place'));
    this.counter.hidden = places.total === 0;

    // ---- the card shown when a treasure is taken
    this.card = el('div', 'treasure-card', `<p class="tc-kicker">${t('treasure found')}</p><h2 class="tc-name"></h2><p class="tc-lore"></p><p class="tc-place"></p>`);
    document.body.appendChild(this.card);

    // ---- the journal page
    this.page = el('div', 'journal', `<div class="journal-inner"><header><p class="j-kicker">${t("the rider's journal")}</p><h2>${t('Treasures of the island')}</h2><p class="j-sum"></p></header><div class="j-list"></div><footer><kbd>J</kbd> ${t('close')}</footer></div>`);
    this.page.hidden = true;
    document.body.appendChild(this.page);
    this.page.addEventListener('click', () => this.toggle(false));

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (e.code === 'KeyJ' && (this.open || this.canOpen())) this.toggle();
      else if (e.code === 'Escape' && this.open) this.toggle(false);
    });
    this.refresh();
  }

  /** The journal waits for play to begin, and for the title screen to have finished fading out. */
  canOpen() {
    if (this.game.state !== 'play') return false;
    const title = document.getElementById('title');
    return !title || getComputedStyle(title).visibility === 'hidden';
  }

  refresh() {
    const n = this.places.count, total = this.places.total;
    this.counter.querySelector('.treasures-n').textContent = n;
    this.counter.querySelector('.treasures-of').textContent = t('/ {total} treasures', { total });
    this.counter.title = t('Treasures {n}/{total}', { n, total });
    if (this.open) this._fill();
  }

  _fill() {
    const list = this.page.querySelector('.j-list');
    const n = this.places.count, total = this.places.total;
    this.page.querySelector('.j-sum').textContent = n === total ? t('all {total} found', { total }) : t('{n} of {total} found', { n, total });
    list.innerHTML = this.places.list.filter((p) => p.treasure).map((p) => {
      const tr = p.treasure;
      if (tr.found) {
        return `<article class="j-entry found" style="--tint:${css(tr.tint)}"><span class="j-gem"></span><div><h3>${esc(tn(tr.def.name))}</h3><p class="j-where">${esc(tn(p.def.name))}</p><p class="j-lore">${esc(tn(tr.def.lore))}</p></div></article>`;
      }
      return `<article class="j-entry"><span class="j-gem"></span><div><h3>${p.visited ? esc(tn(p.def.name)) : esc(t('Not yet found'))}</h3><p class="j-lore">${esc(t(p.def.hint || 'Somewhere on the island.'))}</p></div></article>`;
    }).join('');
  }

  /** Open or close the page. The world holds still while it is open. */
  toggle(on = !this.open) {
    if (on === this.open) return;
    this.open = on;
    if (on) {
      this._fill();
      this.page.hidden = false;
      void this.page.offsetWidth;             // lay it out transparent first, so the fade runs
      this.page.classList.add('show');
    } else {
      this.page.classList.remove('show');
      setTimeout(() => { if (!this.open) this.page.hidden = true; }, 400);
      this.game.input?.pressed?.clear();      // keys tapped while reading are not flying orders
    }
    this.game.paused = on;
  }

  /** The rider has come into a place for the first time this flight. */
  arrive(pl) {
    this.game.toast?.(tn(pl.def.name));
  }

  found(pl) {
    const tr = pl.treasure;
    this.card.querySelector('.tc-name').textContent = tn(tr.def.name);
    this.card.querySelector('.tc-lore').textContent = tn(tr.def.lore || '');
    this.card.querySelector('.tc-place').textContent = tn(pl.def.name || '');
    this.card.style.setProperty('--tint', css(tr.tint));
    this.card.classList.add('show');
    this.cardT = 8;
    this.refresh();
    this.counter.classList.remove('bump');
    void this.counter.offsetWidth;
    this.counter.classList.add('bump');
    if (this.places.count === this.places.total) setTimeout(() => this.game.toast?.(t('every treasure found — the island has no secrets left')), 8600);
  }

  update(dt) {
    if (this.cardT > 0 && (this.cardT -= dt) <= 0) this.card.classList.remove('show');
  }
}
