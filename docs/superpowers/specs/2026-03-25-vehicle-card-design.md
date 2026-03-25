# Vehicle Card – Design Spec

**Date:** 2026-03-25
**Status:** Approved

---

## Overview

A Home Assistant Lovelace custom card for displaying vehicle status. Supports both electric and conventional vehicles. Fully configurable with any HA entities — no brand-specific integration required. Style: dark & modern, consistent with the SolarIndex card aesthetic.

---

## Features

### Displayed Data (all fields optional)

| Field | Entity Type | Description |
|---|---|---|
| `battery_level` | sensor (%) | Battery/charge level with color-coded bar |
| `battery_range` | sensor (km) | Estimated range |
| `charge_status` | sensor / binary_sensor | Charging state (charging / plugged_in / disconnected) |
| `fuel_level` | sensor (%) | Fuel level for hybrids/combustion vehicles |
| `doors` | binary_sensor | Door/window open/closed state |
| `odometer` | sensor (km) | Total mileage |
| `climate` | switch | Climate on/off toggle (direct toggle, no more-info) |

Fields not configured are hidden — no empty placeholders.

---

## Layout

```
┌─────────────────────────────────┐
│  🚗  Mein Auto    [Ladend 78%]  │  ← Header: name + charge_status badge
├─────────────────────────────────┤
│  ████████░░  78%   248 km       │  ← battery bar + range
│  ⛽ Tankstand: 45%              │  ← fuel level (hidden if not configured)
│  ❄️ Klimaanlage:  [AN / AUS]    │  ← climate toggle switch
├─────────────────────────────────┤
│  🚪 Türen: zu     📍 12.450 km  │  ← doors status + odometer
└─────────────────────────────────┘
```

---

## Interaction

### Click Behavior

- **All sensor values** (battery, range, fuel, doors, odometer) → fire `hass-more-info` event to open HA detail dialog
- **Charge status badge** → fire `hass-more-info` on charge_status entity
- **Climate toggle** → call `homeassistant.toggle` directly (no dialog)

### Warning Colors

| Condition | Color |
|---|---|
| battery < 20% | red |
| battery 20–50% | orange |
| battery ≥ 50% | green |
| fuel < 15% | red |
| doors open | icon + count red, badge "X offen" |

---

## Configuration

### YAML Schema

```yaml
type: custom:vehicle-card
name: Mein Auto                    # optional, default: "Fahrzeug"
battery_level: sensor.car_battery  # optional
battery_range: sensor.car_range    # optional
charge_status: sensor.car_charging # optional
charge_state_charging: "charging"  # optional, default: "charging"
charge_state_plugged: "plugged_in" # optional, default: "plugged_in"
fuel_level: sensor.car_fuel        # optional
doors: binary_sensor.car_doors     # optional
odometer: sensor.car_odometer      # optional
climate: switch.car_climate        # optional
```

### Visual Editor

Full GUI editor with entity pickers for all fields. Auto-discovery suggests entities whose IDs contain keywords: `battery`, `range`, `charg`, `fuel`, `door`, `odometer`, `climate`.

---

## Architecture

**Single file:** `vehicle-card.js`

**Classes:**
- `VehicleCard` — main card, renders HTML, handles clicks and toggles
- `VehicleCardEditor` — visual editor using `ha-form` and entity pickers
- `discoverVehicleEntities()` — shared auto-discovery function

**Version constant:** `CARD_VERSION = "1.0.0"`

**Registration:**
```js
customElements.define('vehicle-card', VehicleCard);
window.customCards = window.customCards || [];
window.customCards.push({ type: 'vehicle-card', name: 'Vehicle Card', ... });
```

---

## Style

- Dark background matching HA dark theme (`var(--card-background-color)`)
- Accent colors: blue for charging, green/orange/red for battery states
- Font and spacing consistent with SolarIndex card
- No vehicle image
- Rounded corners, subtle border/shadow

---

## File Location

`vehicle-card/vehicle-card.js`

Not a copy of SolarIndex card — standalone repo and file.
