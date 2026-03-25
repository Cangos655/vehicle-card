# Vehicle Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-file Home Assistant Lovelace custom card (`vehicle-card.js`) that displays vehicle status (battery, range, charge, fuel, doors, odometer, climate) with dark styling, full entity configurability, and a visual editor.

**Architecture:** Single JS file with `VehicleCard` (main card), `VehicleCardEditor` (GUI editor), and `discoverVehicleEntities()`. Follows the same pattern as the SolarIndex card in this project.

**Tech Stack:** Vanilla JS, HA LitElement-compatible custom element (no build step), HA `ha-entity-picker` in editor

---

## File Structure

- **Create:** `vehicle-card/vehicle-card.js` — entire card implementation
- **Spec:** `vehicle-card/docs/superpowers/specs/2026-03-25-vehicle-card-design.md`

---

## Task 1: Skeleton & Registration

**Files:**
- Create: `vehicle-card.js`

- [ ] **Step 1: Write the file skeleton**

```js
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
```

- [ ] **Step 2: Add the file to HA www folder for manual testing**

Copy `vehicle-card.js` to your HA `config/www/` folder and add to Lovelace resources:
```yaml
resources:
  - url: /local/vehicle-card.js
    type: module
```
Then add a card with `type: custom:vehicle-card` to verify it renders without errors.

- [ ] **Step 3: Commit**

```bash
git add vehicle-card.js
git commit -m "feat: initial vehicle-card skeleton with registration"
```

---

## Task 2: Styles

**Files:**
- Modify: `vehicle-card.js` — add `_getStyles()` method

- [ ] **Step 1: Add `_getStyles()` returning a `<style>` string**

```js
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
```

- [ ] **Step 2: Use `_getStyles()` in `_render()`**

```js
_render() {
  if (!this._config) return;
  this.innerHTML = `<ha-card>${this._getStyles()}<div class="vc-card">Vehicle Card</div></ha-card>`;
}
```

- [ ] **Step 3: Commit**

```bash
git add vehicle-card.js
git commit -m "feat: add vehicle card styles"
```

---

## Task 3: Helper Utilities

**Files:**
- Modify: `vehicle-card.js` — add helper functions before the class definitions

- [ ] **Step 1: Add `_getState()`, `_formatValue()`, `_batteryColor()`, `_fuelColor()`**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add vehicle-card.js
git commit -m "feat: add vehicle card helper utilities"
```

---

## Task 4: Header (name + charge badge)

**Files:**
- Modify: `vehicle-card.js` — add `_renderHeader()` and use in `_render()`

- [ ] **Step 1: Add `_renderHeader()`**

```js
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
```

- [ ] **Step 2: Wire into `_render()` and test**

```js
_render() {
  if (!this._config) return;
  const body = `
    <ha-card>
      ${this._getStyles()}
      <div class="vc-card">
        ${this._renderHeader()}
      </div>
    </ha-card>`;
  this.innerHTML = body;
  this._attachListeners();
}
```

- [ ] **Step 3: Add `_attachListeners()` stub**

```js
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
```

- [ ] **Step 4: Commit**

```bash
git add vehicle-card.js
git commit -m "feat: add header with charge status badge and click handler"
```

---

## Task 5: Battery Bar + Range

**Files:**
- Modify: `vehicle-card.js` — add `_renderBattery()`

- [ ] **Step 1: Add `_renderBattery()`**

```js
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
```

- [ ] **Step 2: Add to `_render()` body and test**

- [ ] **Step 3: Commit**

```bash
git add vehicle-card.js
git commit -m "feat: add battery bar and range row"
```

---

## Task 6: Fuel Level

**Files:**
- Modify: `vehicle-card.js` — add `_renderFuel()`

- [ ] **Step 1: Add `_renderFuel()`**

```js
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
```

- [ ] **Step 2: Add to `_render()` and test**

- [ ] **Step 3: Commit**

```bash
git add vehicle-card.js
git commit -m "feat: add fuel level row"
```

---

## Task 7: Climate Toggle

**Files:**
- Modify: `vehicle-card.js` — add `_renderClimate()`

- [ ] **Step 1: Add `_renderClimate()`**

```js
_renderClimate() {
  const cfg = this._config;
  if (!cfg.climate) return '';
  const entity = _getState(this._hass, cfg.climate);
  const isOn = entity?.state === 'on';
  const statusText = isOn ? 'AN' : 'AUS';
  const statusCls  = isOn ? 'on' : 'off';
  return `
    <div class="vc-toggle-row">
      <span class="vc-toggle-label" data-entity="${cfg.climate}">❄️ Klimaanlage</span>
      <span class="vc-toggle-status ${statusCls}" data-toggle="${cfg.climate}">${statusText}</span>
    </div>`;
}
```

- [ ] **Step 2: Add toggle handler in `_attachListeners()`**

```js
// inside _attachListeners(), after the more-info block:
this.querySelectorAll('[data-toggle]').forEach(el => {
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    const entityId = el.dataset.toggle;
    this._hass.callService('homeassistant', 'toggle', { entity_id: entityId });
  });
});
```

- [ ] **Step 3: Add to `_render()` and test toggle works**

- [ ] **Step 4: Commit**

```bash
git add vehicle-card.js
git commit -m "feat: add climate toggle row with direct toggle action"
```

---

## Task 8: Doors

**Files:**
- Modify: `vehicle-card.js` — add `_renderDoors()`

- [ ] **Step 1: Add `_renderDoors()`**

```js
_renderDoors() {
  const cfg = this._config;
  if (!cfg.doors || cfg.doors.length === 0) return '';

  const available = cfg.doors.filter(id => {
    const s = _getState(this._hass, id);
    return s && s.state !== 'unavailable' && s.state !== 'unknown';
  });

  if (available.length === 0) {
    return `<div class="vc-row no-click"><span class="vc-label">🚪 Türen</span><span class="vc-value">—</span></div>`;
  }

  const openDoors = available.filter(id => this._hass.states[id].state === 'on');
  const openCount = openDoors.length;
  const clickTarget = openCount > 0 ? openDoors[0] : cfg.doors[0];

  const color = openCount > 0 ? 'red' : 'green';
  const text  = openCount > 0 ? `${openCount} offen` : 'alle zu';

  return `
    <div class="vc-row" data-entity="${clickTarget}">
      <span class="vc-label">🚪 Türen</span>
      <span class="vc-value ${color}">${text}</span>
    </div>`;
}
```

- [ ] **Step 2: Add to `_render()` footer section and test with multiple door entities**

- [ ] **Step 3: Commit**

```bash
git add vehicle-card.js
git commit -m "feat: add doors row with open count and warning"
```

---

## Task 9: Odometer

**Files:**
- Modify: `vehicle-card.js` — add `_renderOdometer()`

- [ ] **Step 1: Add `_renderOdometer()`**

```js
_renderOdometer() {
  const cfg = this._config;
  if (!cfg.odometer) return '';
  const val = _stateVal(this._hass, cfg.odometer);
  const unit = _getState(this._hass, cfg.odometer)?.attributes?.unit_of_measurement || 'km';
  const num = parseFloat(val);
  const display = val === '—' || val === '?' || val === null
    ? val || '—'
    : isNaN(num) ? val : num.toLocaleString('de-DE') + ' ' + unit;
  return `
    <div class="vc-row" data-entity="${cfg.odometer}">
      <span class="vc-label">📍 km-Stand</span>
      <span class="vc-value">${display}</span>
    </div>`;
}
```

- [ ] **Step 2: Add to `_render()` and test**

- [ ] **Step 3: Commit**

```bash
git add vehicle-card.js
git commit -m "feat: add odometer row"
```

---

## Task 10: Final `_render()` assembly

**Files:**
- Modify: `vehicle-card.js` — assemble all rows with dividers

- [ ] **Step 1: Replace `_render()` with full assembly**

```js
_render() {
  if (!this._config || !this._hass) return;

  const topRows    = [this._renderBattery(), this._renderFuel(), this._renderClimate()].filter(Boolean);
  const bottomRows = [this._renderDoors(), this._renderOdometer()].filter(Boolean);

  const topHtml    = topRows.join('');
  const bottomHtml = bottomRows.length ? `<hr class="vc-divider">${bottomRows.join('')}` : '';

  this.innerHTML = `
    <ha-card>
      ${this._getStyles()}
      <div class="vc-card">
        ${this._renderHeader()}
        <div class="vc-body">
          ${topHtml}
          ${bottomHtml}
        </div>
      </div>
    </ha-card>`;

  this._attachListeners();
}
```

- [ ] **Step 2: Test with a config that has all fields, then one with only battery, then empty config**

- [ ] **Step 3: Commit**

```bash
git add vehicle-card.js
git commit -m "feat: assemble full vehicle card render with all rows"
```

---

## Task 11: Empty Config Fallback

- [ ] **Step 1: Add empty-config message to `_render()`**

```js
// At the top of _render(), after the null check:
const hasAnyField = ['battery_level','battery_range','charge_status','fuel_level',
  'doors','odometer','climate'].some(k => this._config[k]);

if (!hasAnyField) {
  this.innerHTML = `
    <ha-card>
      ${this._getStyles()}
      <div class="vc-card">
        <div class="vc-header"><span class="vc-name">🚗 ${this._config.name || 'Fahrzeug'}</span></div>
        <p style="color:var(--secondary-text-color);font-size:0.85em;padding:8px 6px">
          Keine Entitäten konfiguriert
        </p>
      </div>
    </ha-card>`;
  return;
}
```

- [ ] **Step 2: Test with empty config `type: custom:vehicle-card`**

- [ ] **Step 3: Commit**

```bash
git add vehicle-card.js
git commit -m "feat: add empty config fallback message"
```

---

## Task 12: Auto-Discovery

**Files:**
- Modify: `vehicle-card.js` — implement `discoverVehicleEntities(hass)`

- [ ] **Step 1: Implement `discoverVehicleEntities()`**

```js
function discoverVehicleEntities(hass) {
  const patterns = {
    battery_level:  ['battery', 'soc', 'ladezustand'],
    battery_range:  ['range', 'reichweite'],
    charge_status:  ['charg', 'charging', 'laden'],
    fuel_level:     ['fuel', 'tank', 'kraftstoff'],
    doors:          ['door', 'tür', 'window', 'fenster', 'trunk'],
    odometer:       ['odometer', 'mileage', 'kilometerstand'],
    climate:        ['climate', 'klima', '_ac', 'preconditioning'],
  };

  const result = {};
  const ids = Object.keys(hass.states);

  for (const [field, keywords] of Object.entries(patterns)) {
    const matches = ids.filter(id =>
      keywords.some(kw => id.toLowerCase().includes(kw))
    );
    if (field === 'doors') {
      if (matches.length) result.doors = matches;
    } else {
      if (matches.length) result[field] = matches[0];
    }
  }

  return result;
}
```

- [ ] **Step 2: Commit**

```bash
git add vehicle-card.js
git commit -m "feat: implement auto-discovery for vehicle entities"
```

---

## Task 13: Visual Editor

**Files:**
- Modify: `vehicle-card.js` — implement `VehicleCardEditor`

- [ ] **Step 1: Implement full editor**

```js
class VehicleCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    if (this._hass) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    // Auto-discover on first open if config is empty
    if (this._config && !this._config._discovered) {
      const discovered = discoverVehicleEntities(hass);
      if (Object.keys(discovered).length > 0) {
        this._config = { ...this._config, ...discovered, _discovered: true };
      }
    }
    this._render();
  }

  _render() {
    if (!this._hass || !this._config) return;
    const cfg = this._config;

    const singleFields = [
      { key: 'battery_level', label: '🔋 Akkustand (Sensor %)' },
      { key: 'battery_range', label: '📏 Reichweite (Sensor km)' },
      { key: 'charge_status', label: '⚡ Ladestatus (Sensor/Binary)' },
      { key: 'fuel_level',    label: '⛽ Tankstand (Sensor %)' },
      { key: 'odometer',      label: '📍 Kilometerstand (Sensor)' },
      { key: 'climate',       label: '❄️ Klimaanlage (Switch)' },
    ];

    const doorsList = Array.isArray(cfg.doors) ? cfg.doors : [];

    this.innerHTML = `
      <style>
        .vc-editor { padding: 8px; display: flex; flex-direction: column; gap: 10px; }
        .vc-editor label { font-size: 0.85em; color: var(--secondary-text-color); display: block; margin-bottom: 2px; }
        .vc-door-row { display: flex; align-items: center; gap: 6px; }
        .vc-door-row ha-entity-picker { flex: 1; }
        .vc-remove-btn { cursor: pointer; color: var(--error-color); font-size: 1.1em; padding: 0 4px; }
        .vc-add-btn { cursor: pointer; color: var(--primary-color); font-size: 0.85em; padding: 4px; }
      </style>
      <div class="vc-editor">
        <ha-textfield label="Name (optional, z.B. Mein Auto)" .value="${cfg.name || ''}" data-field="name"></ha-textfield>
        ${singleFields.map(f => `
          <div>
            <label>${f.label}</label>
            <ha-entity-picker
              .hass="${this._hass ? 'set' : ''}"
              .value="${cfg[f.key] || ''}"
              data-field="${f.key}"
              allow-custom-entity>
            </ha-entity-picker>
          </div>`).join('')}
        <div>
          <label>🚪 Türen / Fenster (mehrere möglich)</label>
          <div id="doors-list">
            ${doorsList.map((id, i) => `
              <div class="vc-door-row" data-door-index="${i}">
                <ha-entity-picker .value="${id}" data-field="door-${i}" allow-custom-entity></ha-entity-picker>
                <span class="vc-remove-btn" data-remove-door="${i}">✕</span>
              </div>`).join('')}
          </div>
          <div class="vc-add-btn" id="add-door">+ Tür hinzufügen</div>
        </div>
      </div>`;

    // Wire up ha-entity-picker and textfield changes
    this.querySelectorAll('ha-entity-picker, ha-textfield').forEach(el => {
      el.hass = this._hass;
      el.addEventListener('value-changed', (e) => {
        const field = el.dataset.field;
        if (!field) return;
        const val = e.detail.value;
        if (field === 'name') {
          this._config = { ...this._config, name: val };
        } else if (field.startsWith('door-')) {
          const idx = parseInt(field.split('-')[1]);
          const doors = [...(this._config.doors || [])];
          doors[idx] = val;
          this._config = { ...this._config, doors };
        } else {
          this._config = { ...this._config, [field]: val };
        }
        this._fireChange();
      });
    });

    // Add door
    this.querySelector('#add-door')?.addEventListener('click', () => {
      const doors = [...(this._config.doors || []), ''];
      this._config = { ...this._config, doors };
      this._render();
    });

    // Remove door
    this.querySelectorAll('[data-remove-door]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.removeDoor);
        const doors = (this._config.doors || []).filter((_, i) => i !== idx);
        this._config = { ...this._config, doors };
        this._render();
        this._fireChange();
      });
    });
  }

  _fireChange() {
    const cfg = { ...this._config };
    delete cfg._discovered;
    if (cfg.doors && cfg.doors.length === 0) delete cfg.doors;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: cfg }, bubbles: true, composed: true }));
  }
}
```

- [ ] **Step 2: Test editor opens, entity pickers work, doors add/remove works**

- [ ] **Step 3: Commit**

```bash
git add vehicle-card.js
git commit -m "feat: implement full visual editor with entity pickers and door list"
```

---

## Task 14: Final Polish & Version Tag

- [ ] **Step 1: Test all combinations manually**
  - All fields configured
  - Only battery + climate
  - Empty config
  - Entity unavailable
  - Door open + door closed

- [ ] **Step 2: Add `.gitignore` and `README.md` stub**

```bash
echo "*.DS_Store" > .gitignore
git add .gitignore
```

- [ ] **Step 3: Final commit and tag**

```bash
git add vehicle-card.js
git commit -m "feat: vehicle-card v1.0.0 complete"
git tag v1.0.0
```
