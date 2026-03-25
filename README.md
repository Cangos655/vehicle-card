# Vehicle Card

A Home Assistant Lovelace custom card for displaying vehicle status. Works with any brand — fully configurable with your own entities.

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![HA](https://img.shields.io/badge/Home%20Assistant-compatible-brightgreen)

## Features

- 🔋 Battery level with color-coded progress bar (green / orange / red)
- 📏 Estimated range
- ⚡ Charge status badge (supports `binary_sensor` and `sensor`)
- ⛽ Fuel level with warning colors (for hybrids / combustion)
- 🚪 Doors & windows open/closed summary
- 📍 Odometer (formatted for German locale)
- ❄️ Climate toggle — switchable directly from the card
- 🎨 Dark & modern design using HA CSS variables
- 🔍 Auto-discovery of vehicle entities
- ⚙️ Visual editor with entity pickers and dynamic door list

All fields are optional — unconfigured fields are simply hidden.

## Installation

### Manual

1. Download `vehicle-card.js` from the [latest release](https://github.com/Cangos655/vehicle-card/releases/latest)
2. Copy it to your HA `config/www/` folder
3. Add it as a Lovelace resource:
   - **URL:** `/local/vehicle-card.js`
   - **Type:** JavaScript module
4. Reload your browser (Ctrl+Shift+R)

## Configuration

### Visual Editor

The card includes a full GUI editor with entity pickers for all fields. When you add the card for the first time, it auto-discovers matching entities from your HA instance.

### YAML

```yaml
type: custom:vehicle-card
name: Mein Auto                          # optional, default: "Fahrzeug"
battery_level: sensor.car_battery        # optional
battery_range: sensor.car_range          # optional
charge_status: sensor.car_charging       # optional
charge_state_charging: "charging"        # optional, default: "charging"
charge_state_plugged: "plugged_in"       # optional, default: "plugged_in"
fuel_level: sensor.car_fuel             # optional
doors:                                   # optional, list of binary_sensors
  - binary_sensor.car_door_front_left
  - binary_sensor.car_door_front_right
  - binary_sensor.car_trunk
odometer: sensor.car_odometer           # optional
climate: switch.car_climate             # optional
```

## Warning Colors

| Condition | Color |
|---|---|
| Battery ≥ 50% | 🟢 Green |
| Battery 20–50% | 🟠 Orange |
| Battery < 20% | 🔴 Red |
| Fuel ≥ 30% | Default |
| Fuel 15–30% | 🟠 Orange |
| Fuel < 15% | 🔴 Red |
| All doors closed | 🟢 Green |
| Any door open | 🔴 Red + count |

## Charge Status Badge

The badge in the header adapts to your entity type:

- **`binary_sensor`**: `on` → "Lädt" (blue), `off` → "Bereit" (gray)
- **`sensor`**: mapped via `charge_state_charging` / `charge_state_plugged` config keys; unmapped states are shown as-is

## License

MIT
