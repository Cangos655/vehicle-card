# Vehicle Card

A Home Assistant Lovelace custom card for displaying vehicle status. Works with any brand — fully configurable with your own entities.

![Version](https://img.shields.io/badge/version-1.1.1-blue) ![HA](https://img.shields.io/badge/Home%20Assistant-compatible-brightgreen)

![Vehicle Card Screenshot](screenshot.jpg)

## Features

- 🔋 Battery level with color-coded vertical bar (green / yellow / red)
- 📏 Estimated range — shown below battery percentage
- ⚡ Charge status badge inside the battery tile (Lädt / Verbunden / Bereit)
- ⛽ Fuel level with warning colors (for hybrids / combustion vehicles)
- ❄️ Climate toggle — switchable directly from the card (inside fuel tile, or standalone for EVs)
- 📍 Odometer — displayed as a pill chip in the card header
- 🎨 Custom icon — choose any MDI icon via the visual editor
- 🌙 Dark & modern tile-based design using HA CSS variables

All fields are optional — unconfigured fields are simply hidden.

## Installation

### HACS (empfohlen)

1. HACS öffnen → **Frontend**
2. Drei-Punkte-Menü → **Custom repositories**
3. URL eingeben: `https://github.com/Cangos655/vehicle-card`
4. Kategorie: **Lovelace** → **Add**
5. **Vehicle Card** in der Liste suchen und **Download** klicken
6. Browser neu laden (Strg+Shift+R)

### Manuell

1. `vehicle-card.js` aus dem [neuesten Release](https://github.com/Cangos655/vehicle-card/releases/latest) herunterladen
2. In den HA-Ordner `config/www/` kopieren
3. Als Lovelace-Ressource hinzufügen:
   - **URL:** `/local/vehicle-card.js`
   - **Typ:** JavaScript-Modul
4. Browser neu laden (Strg+Shift+R)

## Configuration

### Visual Editor

The card includes a full GUI editor. All fields including the icon can be configured without YAML.

### YAML

```yaml
type: custom:vehicle-card
name: Mein Auto                          # optional, default: "Fahrzeug"
icon: mdi:car-electric                   # optional, default: 🚗
battery_level: sensor.car_battery        # optional
battery_range: sensor.car_range          # optional
charge_status: sensor.car_charging       # optional
charge_state_charging: "charging"        # optional, default: "charging"
charge_state_plugged: "plugged_in"       # optional, default: "plugged_in"
fuel_level: sensor.car_fuel              # optional
odometer: sensor.car_odometer            # optional
climate: switch.car_climate              # optional
```

## Warning Colors

| Condition | Color |
|---|---|
| Battery ≥ 50% | 🟢 Green |
| Battery 20–50% | 🟡 Yellow |
| Battery < 20% | 🔴 Red |
| Fuel ≥ 30% | Default |
| Fuel 15–30% | 🟡 Yellow |
| Fuel < 15% | 🔴 Red |

## Charge Status Badge

Shown inside the battery tile. Adapts to your entity type:

- **`binary_sensor`**: `on` → "Lädt" (green), `off` → "Bereit" (gray)
- **`sensor`**: mapped via `charge_state_charging` / `charge_state_plugged` config keys; unmapped states are shown as-is

## Layout

- **Pure EV** (no fuel): Battery tile + Climate tile side by side
- **Hybrid / combustion**: Battery tile (with range + charge status) + Fuel tile (with climate toggle)
- **Header**: Car name with custom icon + odometer pill chip

## License

MIT
