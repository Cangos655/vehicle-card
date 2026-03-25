# Vehicle Card – Design Spec

**Date:** 2026-03-25
**Status:** Draft

---

## Overview

A Home Assistant Lovelace custom card for displaying vehicle status. Supports both electric and conventional vehicles. Fully configurable with any HA entities — no brand-specific integration required. Style: dark & modern, consistent with the SolarIndex card aesthetic.

---

## Features

All fields are optional. Fields not configured are completely hidden — no empty placeholders shown.

| Config Key | Entity Type | Description |
|---|---|---|
| `battery_level` | sensor (%) | Charge level, shown as color-coded horizontal progress bar + % text |
| `battery_range` | sensor (km) | Estimated range in km, shown next to battery bar |
| `charge_status` | sensor or binary_sensor | Charging state badge in header |
| `fuel_level` | sensor (%) | Fuel level % text with warning colors |
| `doors` | list of binary_sensor entity IDs | One or more door/window sensors |
| `odometer` | sensor (km) | Total mileage |
| `climate` | switch or input_boolean | Climate on/off toggle |

**Minimum viable config:** At least one field should be configured. If zero fields are configured, the card renders only the name/title with a hint: *"Keine Entitäten konfiguriert"*.

---

## Layout

```
┌─────────────────────────────────┐
│  🚗  Mein Auto    [Ladend 78%]  │  ← name (config string) + charge_status badge
├─────────────────────────────────┤
│  ████████░░  78%     248 km     │  ← battery bar + range (same row)
│  ⛽ Tankstand: 45%              │  ← fuel level
│  ❄️ Klimaanlage:  ● AN          │  ← climate toggle (HA toggle element)
├─────────────────────────────────┤
│  🚪 Türen: alle zu  📍 12.450km │  ← doors summary + odometer
└─────────────────────────────────┘
```

**Name / Title:** The `name` config key is a plain string (e.g. `name: Mein Auto`). Default: `"Fahrzeug"`. Not derived from any entity.

---

## Charge Status Badge

Shown in the header row, right-aligned. Text and color derived from entity state:

**For `binary_sensor`:**
- `on` → "Lädt" (blue)
- `off` → "Bereit" (gray) — binary_sensor cannot distinguish plugged-not-charging from disconnected

**For `sensor`:** configurable string mapping:
```yaml
charge_state_charging: "charging"   # default → badge text "Lädt", blue
charge_state_plugged: "plugged_in"  # default → badge text "Verbunden", green
# any other state → shown as-is (raw state string), gray badge
```

**Priority:** If a sensor state matches both `charge_state_charging` and `charge_state_plugged` (misconfiguration), `charging` takes precedence (blue badge).

**Summary of badge colors:**
- Charging (mapped) → blue
- Plugged / not charging (mapped, sensor only) → green
- binary_sensor off / unmapped state → gray

**Note:** The badge shows only text labels, no percentage. The `[Ladend 78%]` in the layout sketch is illustrative only.

---

## Doors

Configured as a **list** of binary_sensor entity IDs:
```yaml
doors:
  - binary_sensor.car_door_front_left
  - binary_sensor.car_door_front_right
  - binary_sensor.car_trunk
```

**Display logic:**
- All closed → "🚪 alle zu" (green)
- One or more open → "🚪 2 offen" (red) — clicking opens more-info of the **first open** door entity
- Clicking when all closed → opens more-info of the first configured door entity

---

## Warning Colors

| Condition | Color |
|---|---|
| battery < 20% | red |
| battery 20–50% | orange |
| battery ≥ 50% | green |
| fuel < 15% | red |
| fuel 15–30% | orange |
| fuel ≥ 30% | default (no highlight) |
| any door open | count label red |

---

## Interaction

### Click Behavior

| Element | Action |
|---|---|
| battery bar / % | `hass-more-info` on `battery_level` entity |
| range value | `hass-more-info` on `battery_range` entity |
| fuel value | `hass-more-info` on `fuel_level` entity |
| doors summary | `hass-more-info` on first open door (or first configured door if all closed) |
| odometer value | `hass-more-info` on `odometer` entity |
| charge status badge | `hass-more-info` on `charge_status` entity |
| climate toggle | `homeassistant.toggle` service call (no dialog) |
| climate label text | `hass-more-info` on `climate` entity |

---

## Unavailable / Unknown States

| State | Display |
|---|---|
| `unavailable` | Show `—` (dash) in place of value, no color warning |
| `unknown` | Show `?` in place of value |
| Entity not in `hass.states` | Same as `unavailable` |
| Charge status state not in mapping | Show raw state string, gray badge |

**Doors with partial unavailability:** Unavailable door sensors are excluded from the open/closed count. Example: 3 doors configured, 1 unavailable, 1 open → display "1 offen" (not "1 of 2"). If all configured doors are unavailable → show "—" (click on "—" is a no-op).

**Fuel level unavailable/unknown:** Same rules as battery — `unavailable` → "—", `unknown` → "?".

The card never crashes on missing entities — all entity lookups are guarded.

---

## Responsive / Mobile

The card uses a fixed single-column layout. The battery bar stretches to full card width. No horizontal overflow. Minimum card width: follows HA default card sizing (~280px).

---

## Auto-Discovery

`discoverVehicleEntities()` scans all entities in `hass.states` and suggests matches based on substrings in the entity ID:

| Config Key | Matched substrings (case-insensitive) |
|---|---|
| `battery_level` | `battery`, `soc`, `ladezustand` |
| `battery_range` | `range`, `reichweite` |
| `charge_status` | `charg`, `charging`, `laden` |
| `fuel_level` | `fuel`, `tank`, `kraftstoff` |
| `doors` | `door`, `tür`, `window`, `fenster`, `trunk` |
| `odometer` | `odometer`, `mileage`, `kilometerstand` |
| `climate` | `climate`, `klima`, `_ac`, `preconditioning` |

Discovery is used only to **pre-fill** the editor — the user confirms or adjusts before saving.

**Conflict behavior:** Auto-discovery always **replaces** the current editor values (including any existing `doors` list). It does not append or merge. Discovery is triggered only on first open (empty config) or by an explicit "Auto-erkennen" button in the editor.

---

## Configuration Schema (full example)

```yaml
type: custom:vehicle-card
name: Mein Auto
battery_level: sensor.car_battery
battery_range: sensor.car_range
charge_status: sensor.car_charging_status
charge_state_charging: "charging"
charge_state_plugged: "plugged_in"
fuel_level: sensor.car_fuel
doors:
  - binary_sensor.car_door_front_left
  - binary_sensor.car_door_front_right
  - binary_sensor.car_trunk
odometer: sensor.car_odometer
climate: switch.car_climate
```

---

## Architecture

**Single file:** `vehicle-card.js`

**Classes:**
- `VehicleCard` — main card element, renders all HTML, handles clicks and service calls
- `VehicleCardEditor` — visual editor with `ha-entity-picker` for each field
- `discoverVehicleEntities(hass)` — standalone function, returns suggested entity IDs

**Required HA lifecycle methods on `VehicleCard`:**
- `setConfig(config)` — validates config, throws `Error` with descriptive message if invalid (e.g. `doors` is not an array). Stores config reference.
- `getCardSize()` — returns `3` (approx. height hint for dashboard layout)
- `static getConfigElement()` — returns `document.createElement('vehicle-card-editor')` (wires up visual editor)
- `static getStubConfig()` — returns `{}` (empty object); the editor's auto-discovery fills in suggestions when the card is first added

**Doors editor:** The editor renders a dynamic list for `doors`. Each entry has an `ha-entity-picker` + remove button. An "Add door" button appends a new empty picker. The list maps directly to the `doors` array in config.

**`setConfig()` validation rules:**
- `doors` present but not an array → throw `"doors must be a list of entity IDs"`
- All other fields: no strict validation (any string is accepted as entity ID)

**Version constant:** `CARD_VERSION = "1.0.0"`

**Registration:**
```js
customElements.define('vehicle-card', VehicleCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'vehicle-card',
  name: 'Vehicle Card',
  description: 'Fahrzeugstatus Card für Home Assistant'
});
```

---

## File Location

`vehicle-card/vehicle-card.js` — standalone repo, not related to SolarIndex card.
