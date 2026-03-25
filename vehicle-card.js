const CARD_VERSION = "1.0.0";

// ─── Auto-Discovery ──────────────────────────────────────────────────────────
function discoverVehicleEntities(hass) {
  // stub — returns empty object for now
  return {};
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
  _render() {
    if (!this._config) return;
    this.innerHTML = `<ha-card><div class="vc-card">Vehicle Card v${CARD_VERSION}</div></ha-card>`;
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
