# ha-tbaro-card

Barometric gauge card for Home Assistant — clean, customizable, SVG-based.

![TBaro Card](https://img.shields.io/github/v/release/trollix/ha-tbaro-card)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/trollix/ha-tbaro-card)](https://github.com/trollix/ha-tbaro-card/releases)
![GitHub Release Date](https://img.shields.io/github/release-date/trollix/ha-tbaro-card)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg?style=flat)](https://github.com/custom-components/hacs)

Barometric gauge card for Home Assistant — clean, customizable, SVG-based.

![preview](https://github.com/trollix/ha-tbaro-card/blob/main/img_tbaro_en.png?raw=true)

---

## Features

| Feature | Details |
|---------|---------|
| Gauge types | 270° (fer à cheval) **or** 180° (demi‑cercle) via `angle:` |
| Units | `hpa` *(default)* or `mm` or `in` — auto‑detects the sensor’s unit and converts if needed |
| Segments | Colour ranges fully customisable |
| Needle | SVG, width adaptable, optional hub in 180° mode |
| Icons | Sun / Partly / Rain / Storm (inline SVG, no external calls) |
| i18n | English & French JSON translations; falls back to HA UI language |
| Border | 1 px outline optional (`show_border: true`) |
| HACS | Repository compliant & versioned releases |

---

## Installation

### Option 1: via HACS (recommended)

Install via HACS

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=trollix&repository=ha-tbaro-card)

1. In Home Assistant, go to **HACS > Frontend > Custom Repositories**
2. Add your repository: `https://github.com/trollix/ha-tbaro-card`
3. Select **Lovelace** as category
4. Click **Install** on `ha-tbaro-card`

### Option 2: manual

1. Copy `dist/ha-tbaro-card.js` into your `www` folder
2. Add to `configuration.yaml` or your Lovelace resources:

```yaml
resources:
  - url: /local/ha-tbaro-card.js
    type: module
```

---

## Options

### `angle`

- `270` (par défaut) : Affichage en fer à cheval (135° à 405°)
- `180` : Affichage en demi-cercle (180° à 360°)

L’option `angle: 180` adapte dynamiquement :

- la position et la taille de l’aiguille (plus courte, recentrée)
- la suppression du point central
- le recentrage de l’icône météo au cœur de la gauge
- la disposition des textes et étiquettes

### `unit`

- `hpa` (par défaut) : Affichage en hectoPascal (hpa)
- `mm` : Affichage en mmHg (mm)
- `in` : Affichage en inHg (in)

---

## Lovelace usage

```yaml
type: custom:ha-tbaro-card
entity: sensor.pressure_outdoor
show_weather_icon: true
show_weather_text: true
show_pressure: true
angle: 180          # 180 or 270 (optional, default 270)
unit: mm            # hpa or mm (optional, default hpa)
show_border: true
stroke_width: 20
size: 300
needle_color: '#000000'
tick_color: '#000080'
segments:
  - from: 950
    to: 980
    color: '#3399ff'
  - from: 980
    to: 1000
    color: '#4CAF50'
  - from: 1000
    to: 1020
    color: '#FFD700'
  - from: 1020
    to: 1050
    color: '#FF4500'
```

---

## Localization

Translations are stored in `locales/`:

- `locales/en.json`
- `locales/fr.json`
- `locales/ru.json`
- `locales/es.json`

By default, the card uses the current Home Assistant UI language.
You can override it explicitly using the `language` option:

```yaml
type: custom:ha-tbaro-card
entity: sensor.local_pressure
language: fr  # or en
```

---

## Preview

### Card (en)

#### Baro-en (hPa - hpa)

![HA-TBARO-CARD](https://github.com/trollix/ha-tbaro-card/blob/main/img_tbaro_en_hpa.png?raw=true "Ha TBaro Card")

#### Form-en (hPa - hpa)

![HA-TBARO-CARD](https://github.com/trollix/ha-tbaro-card/blob/main/img_form_en_hpa.png?raw=true "Ha TBaro Card")

#### Baro-en (mmHg - mm)

![HA-TBARO-CARD](https://github.com/trollix/ha-tbaro-card/blob/main/img_tbaro_en.png_mm?raw=true "Ha TBaro Card")

#### Form-en (mmHg - mm)

![HA-TBARO-CARD](https://github.com/trollix/ha-tbaro-card/blob/main/img_form_en_mm.png?raw=true "Ha TBaro Card")

### Card (fr)

#### Baro-fr

![HA-TBARO-CARD](https://github.com/trollix/ha-tbaro-card/blob/main/img_tbaro_fr.png?raw=true "Ha TBaro Card")

#### form-fr

![HA-TBARO-CARD](https://github.com/trollix/ha-tbaro-card/blob/main/img_form_fr.png?raw=true "Ha TBaro Card")

#### Baro-fr (mmHg - mm)

![HA-TBARO-CARD](https://github.com/trollix/ha-tbaro-card/blob/main/img_tbaro_fr_mm.png?raw=true "Ha TBaro Card")

#### form-fr (mmHg - mm)

![HA-TBARO-CARD](https://github.com/trollix/ha-tbaro-card/blob/main/img_form_fr_mm.png?raw=true "Ha TBaro Card")

---

## Development

```bash
git clone https://github.com/trollix/ha-tbaro-card.git
cd ha-tbaro-card
npm i
npm run build      # rollup – generates /dist/ha-tbaro-card.js
```

### Release checklist

- Bump version in `package.json` & `hacs.json`
- `npm run build` → commit generated file
- `git tag vX.Y.Z && git push --tags`
- Create GitHub Release attaching **ha-tbaro-card.js**

### Thanks for Localization

- ru: [Psytoshgen](https://github.com/Psytoshgen "Psytoshgen")
- de: [hendrik001973](https://github.com/hendrik001973 "hendrik001973")
- it: [LeonardoGandini](https://github.com/LeonardoGandini "LeonardoGandini")

---

## Licence

[MIT](LICENSE)  ·  Made by [@trollix](https://github.com/trollix)
