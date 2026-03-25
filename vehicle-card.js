const CARD_VERSION = "1.0.0";

// ─── Auto-Discovery ──────────────────────────────────────────────────────────
function discoverVehicleEntities(hass) {
  // stub — returns empty object for now
  return {};
}

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
  if (pct === null || pct === '—' || pct === '?') return '';
  const n = parseFloat(pct);
  if (isNaN(n)) return '';
  if (n < 20) return 'red';
  if (n < 50) return 'orange';
  return 'green';
}

function _fuelColor(pct) {
  if (pct === null || pct === '—' || pct === '?') return '';
  const n = parseFloat(pct);
  if (isNaN(n)) return '';
  if (n < 15) return 'red';
  if (n < 30) return 'orange';
  return '';
}

// ─── Editor ──────────────────────────────────────────────────────────────────
class VehicleCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; }
  connectedCallback() { this.innerHTML = '<p>Editor loading...</p>'; }
}
customElements.define('vehicle-card-editor', VehicleCardEditor);

// ─── Card ────────────────────────────────────────────────────────────────────
class VehicleCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement('vehicle-card-editor');
  }
  static getStubConfig() {
    return {};
  }
  setConfig(config) {
    if (config.doors !== undefined && !Array.isArray(config.doors)) {
      throw new Error('vehicle-card: doors must be a list of entity IDs');
    }
    this._config = config;
  }
  getCardSize() { return 3; }
  set hass(hass) {
    this._hass = hass;
    this._render();
  }
  _getStyles() {
    return `
    <style>
      ha-card { background: var(--card-background-color); border-radius: 12px; overflow: hidden; }
      .vc-card { padding: 16px; font-family: var(--primary-font-family); color: var(--primary-text-color); }
      .vc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
      .vc-name { font-size: 1.1em; font-weight: 600; }
      .vc-badge { font-size: 0.75em; font-weight: 600; padding: 3px 10px; border-radius: 20px; letter-spacing: 0.03em; }
      .vc-badge.charging { background: #1a73e840; color: #64b5f6; }
      .vc-badge.plugged   { background: #1b5e2040; color: #81c784; }
      .vc-badge.default   { background: #ffffff18; color: var(--secondary-text-color); }
      .vc-body { display: flex; flex-direction: column; gap: 10px; }
      .vc-row { display: flex; align-items: center; gap: 10px; cursor: pointer; border-radius: 8px; padding: 4px 6px; transition: background 0.15s; }
      .vc-row:hover { background: #ffffff0d; }
      .vc-row.no-click { cursor: default; }
      .vc-row.no-click:hover { background: transparent; }
      .vc-label { font-size: 0.82em; color: var(--secondary-text-color); min-width: 80px; }
      .vc-value { font-size: 0.95em; font-weight: 500; }
      .vc-value.red    { color: #ef5350; }
      .vc-value.orange { color: #ffa726; }
      .vc-value.green  { color: #66bb6a; }
      .vc-divider { border: none; border-top: 1px solid #ffffff12; margin: 4px 0; }
      .vc-bar-wrap { flex: 1; height: 6px; background: #ffffff1a; border-radius: 3px; overflow: hidden; min-width: 60px; }
      .vc-bar { height: 100%; border-radius: 3px; transition: width 0.4s; }
      .vc-footer { display: flex; justify-content: space-between; margin-top: 4px; }
      .vc-toggle-row { display: flex; align-items: center; gap: 10px; padding: 4px 6px; }
      .vc-toggle-label { font-size: 0.82em; color: var(--secondary-text-color); }
      .vc-toggle-status { font-size: 0.9em; font-weight: 500; cursor: pointer; padding: 2px 8px; border-radius: 6px; border: 1px solid #ffffff22; }
      .vc-toggle-status.on  { color: #66bb6a; border-color: #66bb6a44; }
      .vc-toggle-status.off { color: var(--secondary-text-color); }
    </style>
  `;
  }
  _renderHeader() {
    const cfg = this._config;
    const hass = this._hass;
    const name = cfg.name || 'Fahrzeug';
    let badgeHtml = '';

    if (cfg.charge_status) {
      const val = _stateVal(hass, cfg.charge_status);
      let text = val;
      let cls = 'default';

      const stCharging = cfg.charge_state_charging || 'charging';
      const stPlugged  = cfg.charge_state_plugged  || 'plugged_in';

      const entity = _getState(hass, cfg.charge_status);
      if (entity) {
        const raw = entity.state;
        if (raw === 'on' && entity.attributes.device_class === 'battery_charging') {
          text = 'Lädt'; cls = 'charging';
        } else if (raw === stCharging) {
          text = 'Lädt'; cls = 'charging';
        } else if (raw === stPlugged) {
          text = 'Verbunden'; cls = 'plugged';
        } else if (raw === 'on') {
          text = 'Lädt'; cls = 'charging';
        } else if (raw === 'off') {
          text = 'Bereit'; cls = 'default';
        }
      }
      badgeHtml = `<span class="vc-badge ${cls}" data-entity="${cfg.charge_status}">${text}</span>`;
    }

    return `
      <div class="vc-header">
        <span class="vc-name">🚗 ${name}</span>
        ${badgeHtml}
      </div>`;
  }

  _renderBattery() {
  const cfg = this._config;
  const hass = this._hass;
  if (!cfg.battery_level && !cfg.battery_range) return '';

  const pct   = _stateVal(hass, cfg.battery_level);
  const range = _stateVal(hass, cfg.battery_range);
  const color = _batteryColor(pct);
  const numPct = parseFloat(pct) || 0;
  const barWidth = (pct === '—' || pct === '?' || pct === null) ? 0 : Math.min(100, Math.max(0, numPct));

  const barColorMap = { red: '#ef5350', orange: '#ffa726', green: '#66bb6a' };
  const barColor = barColorMap[color] || '#90a4ae';

  let html = '<div class="vc-row">';

  if (cfg.battery_level) {
    html += `
      <span class="vc-label">🔋 Akku</span>
      <div class="vc-bar-wrap" data-entity="${cfg.battery_level}">
        <div class="vc-bar" style="width:${barWidth}%;background:${barColor}"></div>
      </div>
      <span class="vc-value ${color}" data-entity="${cfg.battery_level}">${pct !== null ? pct + '%' : '—'}</span>`;
  }

  if (cfg.battery_range) {
    const rangeUnit = _getState(hass, cfg.battery_range)?.attributes?.unit_of_measurement || 'km';
    html += `<span class="vc-value" style="margin-left:auto" data-entity="${cfg.battery_range}">${range !== null ? range + ' ' + rangeUnit : '—'}</span>`;
  }

  html += '</div>';
  return html;
}

  _renderFuel() {
  const cfg = this._config;
  if (!cfg.fuel_level) return '';
  const val = _stateVal(this._hass, cfg.fuel_level);
  const color = _fuelColor(val);
  const unit = _getState(this._hass, cfg.fuel_level)?.attributes?.unit_of_measurement || '%';
  const display = val !== null ? val + unit : '—';
  return `
    <div class="vc-row" data-entity="${cfg.fuel_level}">
      <span class="vc-label">⛽ Tank</span>
      <span class="vc-value ${color}">${display}</span>
    </div>`;
}

  _attachListeners() {
    this.querySelectorAll('[data-entity]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const entityId = el.dataset.entity;
        if (!entityId) return;
        this.dispatchEvent(new CustomEvent('hass-more-info', {
          detail: { entityId },
          bubbles: true,
          composed: true,
        }));
      });
    });
  }

  _render() {
    if (!this._config || !this._hass) return;
    this.innerHTML = `
      <ha-card>
        ${this._getStyles()}
        <div class="vc-card">
          ${this._renderHeader()}
        </div>
      </ha-card>`;
    this._attachListeners();
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
