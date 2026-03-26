const CARD_VERSION = "1.0.9";

// ─── Editor Schema ────────────────────────────────────────────────────────────
const EDITOR_SCHEMA = [
  { name: 'name',          label: 'Name (optional)',               selector: { text: {} } },
  { name: 'battery_level', label: '🔋 Akkustand (Sensor %)',       selector: { entity: {} } },
  { name: 'battery_range', label: '📏 Reichweite (Sensor km)',     selector: { entity: {} } },
  { name: 'charge_status', label: '⚡ Ladestatus (Sensor/Binary)', selector: { entity: {} } },
  { name: 'fuel_level',    label: '⛽ Tankstand (Sensor %)',       selector: { entity: {} } },
  { name: 'odometer',      label: '📍 Kilometerstand (Sensor)',    selector: { entity: {} } },
  { name: 'climate',       label: '❄️ Klimaanlage (Switch)',       selector: { entity: { domain: 'switch' } } },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function _getState(hass, entityId) {
  if (!entityId || !hass.states[entityId]) return null;
  return hass.states[entityId];
}

function _stateVal(hass, entityId) {
  const s = _getState(hass, entityId);
  if (!s) return null;
  if (s.state === 'unavailable') return '—';
  if (s.state === 'unknown') return '?';
  return s.state;
}

function _batteryColor(pct) {
  if (pct === null || pct === '—' || pct === '?') return 'var(--secondary-text-color, #8e8e93)';
  const n = parseFloat(pct);
  if (isNaN(n)) return 'var(--secondary-text-color, #8e8e93)';
  if (n < 20) return '#ff3b30';
  if (n < 50) return '#ffd60a';
  return '#34c759';
}

function _fuelBarColor(pct) {
  if (pct === null || pct === '—' || pct === '?') return 'rgba(120,120,128,0.3)';
  const n = parseFloat(pct);
  if (isNaN(n)) return 'rgba(120,120,128,0.3)';
  if (n < 15) return '#ff3b30';
  if (n < 30) return '#ffd60a';
  return '#34c759';
}

function _fuelTextColor(pct) {
  if (pct === null || pct === '—' || pct === '?') return 'var(--secondary-text-color, #8e8e93)';
  const n = parseFloat(pct);
  if (isNaN(n)) return 'var(--secondary-text-color, #8e8e93)';
  if (n < 15) return '#ff3b30';
  if (n < 30) return '#ffd60a';
  return 'var(--primary-text-color, #1c1c1e)';
}

// ─── Editor ──────────────────────────────────────────────────────────────────
class VehicleCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config      = {};
    this._hass        = null;
    this._initialized = false;
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
  }

  setConfig(config) {
    this._config = config || {};
    if (this._form) this._form.data = this._config;
    if (!this._initialized) this._initialize();
  }

  connectedCallback() {
    if (!this._initialized) this._initialize();
  }

  _initialize() {
    this._initialized = true;
    const form = document.createElement('ha-form');
    form.schema       = EDITOR_SCHEMA;
    form.data         = this._config;
    form.hass         = this._hass;
    form.computeLabel = s => s.label || s.name;
    form.addEventListener('value-changed', e => {
      this._config = e.detail.value;
      this.dispatchEvent(new CustomEvent('config-changed', {
        detail:  { config: this._config },
        bubbles: true, composed: true,
      }));
    });
    this._form = form;
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(form);
  }
}
customElements.define('vehicle-card-editor', VehicleCardEditor);

// ─── Card ────────────────────────────────────────────────────────────────────
class VehicleCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass   = null;
    this._config = {};
  }

  static getConfigElement() {
    return document.createElement('vehicle-card-editor');
  }
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = config;
    if (this._hass) this._render();
  }

  getCardSize() { return 3; }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _moreInfo(entityId) {
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      detail: { entityId }, bubbles: true, composed: true,
    }));
  }

  _chargeStatusBadge(inTile = false) {
    const c = this._config, hass = this._hass;
    if (!c.charge_status) return '';
    const entity = _getState(hass, c.charge_status);
    let text = '—', cls = 'badge-default';
    if (entity) {
      const raw = entity.state;
      const stCharging = c.charge_state_charging || 'charging';
      const stPlugged  = c.charge_state_plugged  || 'plugged_in';
      if (raw === stCharging || raw === 'on') {
        text = 'Lädt'; cls = 'badge-charging';
      } else if (raw === stPlugged) {
        text = 'Verbunden'; cls = 'badge-plugged';
      } else if (raw === 'off') {
        text = 'Bereit'; cls = 'badge-default';
      } else if (raw === 'unavailable') {
        text = '—'; cls = 'badge-default';
      } else {
        text = raw; cls = 'badge-default';
      }
    }
    const el = inTile ? 'charge-tile-badge' : 'header-badge';
    return `<div class="${el} ${cls}" data-entity="${c.charge_status}">${text}</div>`;
  }

  _odometerPillHtml() {
    const c = this._config, hass = this._hass;
    if (!c.odometer) return '';
    const val  = _stateVal(hass, c.odometer);
    const unit = _getState(hass, c.odometer)?.attributes?.unit_of_measurement || 'km';
    const num  = parseFloat(val);
    const valid = val !== null && val !== '—' && val !== '?';
    const disp  = !valid ? (val || '—') : isNaN(num) ? val : num.toLocaleString('de-DE');
    return `
      <div class="header-pill clickable" data-entity="${c.odometer}">
        <span class="pill-icon">📍</span>
        <span class="pill-num">${disp}</span>
        <span class="pill-unit">${unit}</span>
      </div>`;
  }

  _batteryTileHtml() {
    const c = this._config, hass = this._hass;
    if (!c.battery_level) return '';
    const pct    = _stateVal(hass, c.battery_level);
    const numPct = parseFloat(pct) || 0;
    const valid  = pct !== null && pct !== '—' && pct !== '?';
    const barH   = valid ? Math.min(100, Math.max(0, numPct)).toFixed(1) : 0;
    const color  = _batteryColor(pct);
    const numStr = valid ? pct : (pct || '—');

    let rangeHtml = '';
    if (c.battery_range) {
      const range     = _stateVal(hass, c.battery_range);
      const rangeUnit = _getState(hass, c.battery_range)?.attributes?.unit_of_measurement || 'km';
      const rv        = (range !== null && range !== '—' && range !== '?');
      rangeHtml = `<div class="stat-sub" data-entity="${c.battery_range}">${rv ? range + '\u202f' + rangeUnit : (range || '—')}</div>`;
    }

    const chargeBadge = this._chargeStatusBadge(true);

    return `
      <div class="tile tile-vbar clickable" data-entity="${c.battery_level}">
        <div class="vbar-wrap">
          <div class="vbar-fill" style="height:${barH}%;background:${color}"></div>
        </div>
        <div class="stat-content">
          <div class="stat-lbl">Akku</div>
          <div class="stat-num-row">
            <span class="stat-num" style="color:${color}">${numStr}</span><span class="stat-unit-inline" style="color:${color}">%</span>
          </div>
          <div class="tile-bottom">
            ${rangeHtml}
            ${chargeBadge}
          </div>
        </div>
      </div>`;
  }

  _fuelTileHtml() {
    const c = this._config, hass = this._hass;
    if (!c.fuel_level) return '';
    const val    = _stateVal(hass, c.fuel_level);
    const numVal = parseFloat(val) || 0;
    const valid  = val !== null && val !== '—' && val !== '?';
    const barH   = valid ? Math.min(100, Math.max(0, numVal)).toFixed(1) : 0;
    const barClr = _fuelBarColor(val);
    const txtClr = _fuelTextColor(val);
    const numStr = valid ? val : (val || '—');

    let climateHtml = '';
    if (c.climate) {
      const entity = _getState(hass, c.climate);
      const isOn   = entity?.state === 'on';
      climateHtml = `
        <div class="climate-pill ${isOn ? 'on' : 'off'}" data-toggle="${c.climate}">
          <span class="climate-dot"></span>
          <span>${isOn ? 'AN' : 'AUS'}</span>
        </div>`;
    }

    return `
      <div class="tile tile-vbar clickable" data-entity="${c.fuel_level}">
        <div class="vbar-wrap">
          <div class="vbar-fill" style="height:${barH}%;background:${barClr}"></div>
        </div>
        <div class="stat-content">
          <div class="stat-lbl">Tank</div>
          <div class="stat-num-row">
            <span class="stat-num" style="color:${txtClr}">${numStr}</span><span class="stat-unit-inline" style="color:${txtClr}">%</span>
          </div>
          ${climateHtml}
        </div>
      </div>`;
  }

  _odometerTileHtml() {
    const c = this._config, hass = this._hass;
    if (!c.odometer) return '';
    const val   = _stateVal(hass, c.odometer);
    const unit  = _getState(hass, c.odometer)?.attributes?.unit_of_measurement || 'km';
    const num   = parseFloat(val);
    const valid = val !== null && val !== '—' && val !== '?';
    const disp  = !valid ? (val || '—') : isNaN(num) ? val : num.toLocaleString('de-DE');
    return `
      <div class="tile tile-simple clickable" data-entity="${c.odometer}">
        <div class="stat-content stat-pad">
          <div class="stat-lbl">km-Stand</div>
          <div>
            <div class="stat-num stat-num-sm">${disp}</div>
            <div class="stat-unit">${unit}</div>
          </div>
        </div>
      </div>`;
  }

  _render() {
    if (!this._config || !this._hass) return;
    const c = this._config;

    const hasAnyField = ['battery_level','battery_range','charge_status','fuel_level',
      'odometer','climate'].some(k => c[k]);

    const badge   = this._odometerPillHtml();
    const battery = this._batteryTileHtml();
    const fuel    = this._fuelTileHtml();
    const tiles   = [battery, fuel].filter(Boolean).join('');

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .card {
          background: var(--card-background-color, #fff);
          border-radius: 20px;
          padding: 18px 18px 16px;
          font-family: var(--paper-font-body1_-_font-family, system-ui, sans-serif);
          color: var(--primary-text-color, #1c1c1e);
        }

        /* ── HEADER ── */
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          padding: 0 2px;
        }
        .header-title { display: flex; align-items: center; gap: 7px; }
        .header-title-icon {
          width: 26px; height: 26px;
          background: var(--secondary-background-color, #f2f2f7);
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
        }
        .header-title-text { font-size: 15px; font-weight: 600; letter-spacing: -0.2px; }

        /* header odometer pill */
        .header-pill {
          display: flex; align-items: center; gap: 5px;
          background: var(--secondary-background-color, #f2f2f7);
          border-radius: 10px; padding: 5px 9px;
          cursor: pointer; transition: opacity 0.15s;
        }
        .header-pill:hover  { opacity: 0.7; }
        .header-pill:active { opacity: 0.5; }
        .pill-icon { font-size: 11px; }
        .pill-num  { font-size: 13px; font-weight: 700; letter-spacing: -0.2px; }
        .pill-unit { font-size: 10px; color: var(--secondary-text-color, #8e8e93); }

        /* charge status badge inside battery tile */
        .charge-tile-badge {
          display: inline-flex; align-items: center;
          border-radius: 8px; padding: 3px 7px;
          font-size: 10px; font-weight: 600; letter-spacing: 0.3px;
          margin-top: 5px; cursor: pointer;
          transition: opacity 0.15s;
        }
        .charge-tile-badge:hover  { opacity: 0.75; }
        .charge-tile-badge:active { opacity: 0.5; }
        .badge-charging { background: rgba(52,199,89,0.12); color: #34c759; }
        .badge-plugged  { background: rgba(52,199,89,0.08); color: #34c759; }
        .badge-default  {
          background: rgba(120,120,128,0.12);
          color: var(--secondary-text-color, #8e8e93);
        }

        /* ── GRID ── */
        .card-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        /* ── TILE BASE ── */
        .tile {
          background: var(--secondary-background-color, rgba(120,120,128,0.08));
          border: 1px solid var(--divider-color, rgba(128,128,128,0.12));
          border-radius: 16px;
          overflow: hidden;
          transition: opacity 0.15s, transform 0.12s;
        }
        .tile.clickable { cursor: pointer; }
        .tile.clickable:hover  { opacity: 0.82; }
        .tile.clickable:active { transform: scale(0.97); }

        /* ── VBAR TILE (battery, fuel) ── */
        .tile-vbar {
          display: flex;
          align-items: stretch;
          padding: 14px 14px 14px 12px;
          gap: 12px;
          min-height: 110px;
        }
        .vbar-wrap {
          width: 10px; flex-shrink: 0;
          background: rgba(120,120,128,0.15);
          border-radius: 5px;
          position: relative; overflow: hidden;
          align-self: stretch;
        }
        .vbar-fill {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          border-radius: 5px;
          transition: height 0.5s cubic-bezier(.4,0,.2,1);
        }

        /* ── SIMPLE TILE (climate, odometer) ── */
        .tile-simple { min-height: 110px; display: flex; }
        .stat-pad { padding: 14px; }

        /* ── SHARED STAT CONTENT ── */
        .stat-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .stat-lbl {
          font-size: 10px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.6px;
          color: var(--secondary-text-color, #8e8e93);
        }
        .stat-num {
          font-size: 36px; font-weight: 800;
          letter-spacing: -1.5px; line-height: 1;
        }
        .stat-num-sm {
          font-size: 24px; font-weight: 800;
          letter-spacing: -1px; line-height: 1;
        }
        .stat-unit {
          font-size: 11px;
          color: var(--secondary-text-color, #8e8e93);
          margin-top: 1px;
        }
        .stat-num-row {
          display: flex;
          align-items: baseline;
          gap: 1px;
          line-height: 1;
        }
        .stat-unit-inline {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.5px;
          align-self: flex-end;
          margin-bottom: 1px;
        }
        .tile-bottom {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .stat-sub {
          display: inline-block;
          font-size: 11px;
          color: var(--secondary-text-color, #8e8e93);
          border-radius: 4px;
          padding: 1px 3px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .stat-sub:hover { background: rgba(120,120,128,0.1); }

        /* ── CLIMATE PILL ── */
        .climate-pill {
          display: inline-flex; align-items: center; gap: 6px;
          border-radius: 20px; padding: 5px 10px;
          font-size: 13px; font-weight: 700; letter-spacing: 0.3px;
          cursor: pointer; transition: opacity 0.15s;
          border: 1px solid transparent;
        }
        .climate-pill:hover  { opacity: 0.75; }
        .climate-pill:active { opacity: 0.5; }
        .climate-pill.on  {
          background: rgba(52,199,89,0.12); color: #34c759;
          border-color: rgba(52,199,89,0.25);
        }
        .climate-pill.off {
          background: var(--secondary-background-color, rgba(120,120,128,0.08));
          color: var(--secondary-text-color, #8e8e93);
          border-color: var(--divider-color, rgba(128,128,128,0.12));
        }
        .climate-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: currentColor;
          flex-shrink: 0;
        }

        /* ── EMPTY STATE ── */
        .empty-state {
          text-align: center;
          padding: 24px 20px;
          color: var(--secondary-text-color, #8e8e93);
          font-size: 13px;
        }
      </style>

      <div class="card">
        <div class="card-header">
          <div class="header-title">
            <div class="header-title-icon">🚗</div>
            <div class="header-title-text">${c.name || 'Fahrzeug'}</div>
          </div>
          ${badge}
        </div>
        ${hasAnyField
          ? `<div class="card-grid">${tiles}</div>`
          : '<div class="empty-state">Keine Entitäten konfiguriert</div>'
        }
      </div>
    `;

    this._attachListeners();
  }

  _attachListeners() {
    // odometer header pill + charge tile badge → more-info
    this.shadowRoot.querySelectorAll('.header-pill[data-entity], .charge-tile-badge[data-entity]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        this._moreInfo(el.dataset.entity);
      });
    });

    // tiles → more-info (skip clicks on data-toggle pill, stat-sub, or charge-tile-badge)
    this.shadowRoot.querySelectorAll('.tile[data-entity]').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('[data-toggle]') || e.target.closest('.stat-sub[data-entity]') || e.target.closest('.charge-tile-badge')) return;
        this._moreInfo(el.dataset.entity);
      });
    });

    // range sub-label → more-info on range entity
    this.shadowRoot.querySelectorAll('.stat-sub[data-entity]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        this._moreInfo(el.dataset.entity);
      });
    });

    // climate toggle pill
    this.shadowRoot.querySelectorAll('[data-toggle]').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        this._hass.callService('homeassistant', 'toggle', { entity_id: el.dataset.toggle });
      });
    });
  }
}
customElements.define('vehicle-card', VehicleCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'vehicle-card',
  name: 'Vehicle Card',
  description: 'Fahrzeugstatus Card für Home Assistant',
  preview: false,
});

console.info(`%c VEHICLE-CARD %c v${CARD_VERSION} `, 'background:#007aff;color:#fff;font-weight:700;', 'background:#1c1c1e;color:#007aff;font-weight:700;');
