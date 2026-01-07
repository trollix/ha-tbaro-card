// ha-tbaro-card.ts

import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';

import './ha-tbaro-card-editor';

// Import des icônes SVG comme chaînes via rollup-plugin-string
// @ts-ignore
import weatherStyles from './styles.js';
import sunIcon from './icons/sun.svg';
import rainIcon from './icons/rain.svg';
import partlyIcon from './icons/partly.svg';
import stormIcon from './icons/storm.svg';

import fr from '../locales/fr.json';
import en from '../locales/en.json';
import ru from '../locales/ru.json';
import es from '../locales/es.json';
import de from '../locales/de.json';
import it from '../locales/it.json';

// Print Version to Console
import { version, name } from '../package.json'
export const printVersionToConsole = () => console.info(
    `%c  ${name.toUpperCase()}  %c  Version ${version}  `,
    'color: white; font-weight: bold; background: crimson',
    'color: #000; font-weight: bold; background: #ddd',
);
printVersionToConsole();

interface Segment {
  from: number;
  to: number;
  color: string;
}

interface BaroCardConfig {
  entity: string;
  title?: string;
  language?: string;
  unit?: 'hpa' | 'mm' | 'in';
  needle_color?: string;
  tick_color?: string;
  show_weather_icon?: boolean;
  show_weather_text?: boolean;
  show_pressure?: boolean;
  stroke_width?: number;
  size?: number;
  icon_size?: number;
  icon_offset_x?: number;
  icon_offset_y?: number;
  angle?: 180 | 270;
  border?: 'none' | 'outer' | 'inner' | 'both';
  segments?: Segment[];
}

@customElement('ha-tbaro-card')
export class HaTbaroCard extends LitElement {
  @property({ attribute: false }) hass: any;
  @property({ type: Object }) config!: BaroCardConfig;

  private _translations: Record<string, string> = {};
  private static _localeMap: Record<string, Record<string, string>> = { fr, en, ru, es, de, it };

  static styles = [
    css`
      :host { display: block; }
      svg { display: block; margin: auto; }
      .label {
        text-anchor: middle;
        fill: #000;
        font-family: sans-serif;
      }
    `,
    weatherStyles
  ];

  setConfig(config: BaroCardConfig) {

    if (!config.entity) throw new Error("Entity is required");

    //const lang = config.language || this.hass?.locale?.language || 'en';
    //this._translations = HaTbaroCard._localeMap[lang] || HaTbaroCard._localeMap['en'];

    const lang = (config.language || this.hass?.locale?.language || 'en').toLowerCase();
    if (!HaTbaroCard._localeMap[lang]) {
      console.warn(`No translation for "${lang}", fallback to English`);
      this._translations = HaTbaroCard._localeMap['en'];
    } else {
      this._translations = HaTbaroCard._localeMap[lang];
    }


    this.config = {
      needle_color:   'var(--primary-color)',        // aiguille
      tick_color:     'var(--primary-text-color)',   // graduations & point
      show_weather_icon: true,
      show_weather_text: true,
      show_pressure: true,
      stroke_width: 20,
      icon_size: 50,
      icon_offset_x: 0,
      icon_offset_y: 0,
      border: 'outer',   // valeur par défaut
      size: 300,
      angle: 270,
      unit: 'hpa',
      segments: [
        { from: 950, to: 980, color: '#3399ff' },
        { from: 980, to: 1000, color: '#4CAF50' },
        { from: 1000, to: 1020, color: '#FFD700' },
        { from: 1020, to: 1050, color: '#FF4500' }
      ],
      ...config
    };
  }


  // Makes the "Edit in visual editor" button appear
static async getConfigElement() {
  // The element is defined in ha-tbaro-card-editor.ts
  return document.createElement('ha-tbaro-card-editor');
}

// Optional: default config when user adds the card from the UI
static getStubConfig() {
  return {
    type: 'custom:ha-tbaro-card',
    entity: 'sensor.pressure',
    angle: 270,
    unit: 'hpa',
    show_border: false,
  };
}


  private static readonly HPA_TO_MM  = 0.75006156;
  private static readonly HPA_TO_IN  = 0.02953;        // 1 hPa = 0.02953 inHg
  private static readonly MM_TO_HPA  = 1 / HaTbaroCard.HPA_TO_MM;
  private static readonly IN_TO_HPA  = 1 / HaTbaroCard.HPA_TO_IN;


  /** multiplicateur pour aller DE la valeur brute VERS hPa */
  private static readonly UNIT_TO_HPA: Record<string, number> = {
    hpa:   1,
    mbar:  1,
    mm:    HaTbaroCard.MM_TO_HPA,   // ≈ 1.333223684
    mmhg:  HaTbaroCard.MM_TO_HPA,   // accepte « mmHg »
    in:   HaTbaroCard.IN_TO_HPA,       // ← alias court
    inhg: HaTbaroCard.IN_TO_HPA,       // ← alias complet
  };


  private get rawHpa(): number {
    const s = this.hass.states[this.config.entity];
    const val = s ? parseFloat(s.state) : 1013.25;

    const key = (s?.attributes?.unit_of_measurement || 'hPa')
                  .toLowerCase().replace(/[^a-z]/g, '');

    const factor = HaTbaroCard.UNIT_TO_HPA[key] ?? 1;   // défaut : déjà hPa
    return val * factor;
  }


  get pressure(): number {
    if (this.config.unit === 'mm')
      return this.rawHpa * HaTbaroCard.HPA_TO_MM; // hPa → mm
    if (this.config.unit === 'in')                // hPa → in
      return this.rawHpa * HaTbaroCard.HPA_TO_IN;
    return this.rawHpa;                           // hPa direct
  }


  polar(cx: number, cy: number, r: number, angle: number) {
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    };
  }

  describeArc(cx: number, cy: number, r: number, start: number, end: number) {
    const s = this.polar(cx, cy, r, start);
    const e = this.polar(cx, cy, r, end);
    const largeArc = end - start > Math.PI ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  }

  getIcon2(id: string) {
    const svgMap: Record<string, string> = {
      sun: sunIcon,
      rain: rainIcon,
      partly: partlyIcon,
      storm: stormIcon,
    };
  
    const src = svgMap[id];
    if (!src) return nothing;
  
    return html`
      <div class="icon">
        <img class="weather-img-svg" src="${src}" loading="lazy" />
      </div>
    `;
  }
  
  // pour créer un lien <img en HTML à partit d'une image en svg
  getIcon(id: string) {
    const svgMap: Record<string, string> = {
      sun: sunIcon,
      rain: rainIcon,
      partly: partlyIcon,
      storm: stormIcon,
    };

    const raw = svgMap[id];
    if (!raw) return nothing;

    const encoded = encodeURIComponent(raw)
      .replace(/'/g, '%27')
      .replace(/"/g, '%22');
    const dataUrl = `data:image/svg+xml,${encoded}`;

    return html`
      <img class="weather-img-svg" src="${dataUrl}" loading="lazy" width="32" height="32" style="display:block; margin: -30px auto 5px auto;" />
    `;
  }

  getIconDataUrl(id: string): string | undefined {
    const svgMap: Record<string, string> = {
      sun: sunIcon,
      rain: rainIcon,
      partly: partlyIcon,
      storm: stormIcon,
    };
    const raw = svgMap[id];
    if (!raw) return undefined;
    return `data:image/svg+xml,${encodeURIComponent(raw).replace(/'/g, '%27').replace(/"/g, '%22')}`;
  }

  private getWeatherInfo(): { key: string; icon: string } {
    const hpa = this.rawHpa;                    // seuils fixes
    if (hpa < 980)  return { key: 'storm',  icon: 'storm'  };
    if (hpa < 1000) return { key: 'rain',   icon: 'rain'   };
    if (hpa < 1020) return { key: 'partly', icon: 'partly' };
    return               { key: 'sun',    icon: 'sun'    };
  }

  /** Retourne le nom mdi correspondant à weather.key */
  private getMdiIcon(id: string): string {
    const map: Record<string, string> = {
      sun:    'mdi:weather-sunny',
      partly: 'mdi:weather-partly-cloudy',
      rain:   'mdi:weather-rainy',
      storm:  'mdi:weather-lightning',
    };
    return map[id] ?? 'mdi:weather-cloudy';
  }


  private _showMoreInfo(entityId: string) {
    this.dispatchEvent(
      new CustomEvent('hass-more-info', {
        bubbles: true,
        composed: true,
        detail: { entityId },
      }),
    );
  }

private _onClick = () => {
  if (this.config?.entity) this._showMoreInfo(this.config.entity);
};

private _onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (this.config?.entity) this._showMoreInfo(this.config.entity);
  }
};


render() {

  if (!this.config) return html``;

  const pressure = this.pressure;
  const {
    title,
    needle_color,
    tick_color,
    size,
    icon_size = 50,
    icon_offset_x = 0,
    icon_offset_y = 0,
    segments,
    angle: gaugeAngle = 270,  // ← ici l’angle
    border = 'outer',
  } = this.config;

  const stroke_width = this.config.stroke_width ?? 20;
  const cx = 150, r = 110, cy = 150;
  const minP = 950, maxP = 1050;

  // Gestion de l'angle dynamique
  const startAngle = gaugeAngle === 180 ? Math.PI : Math.PI * 0.75;
  const endAngle = gaugeAngle === 180 ? Math.PI * 2 : Math.PI * 2.25;

  const hpaValue = this.rawHpa; // pour l’angle et getWeatherInfo
  const valueAngle = startAngle
    + ((hpaValue - minP) / (maxP - minP)) * (endAngle - startAngle);


  // Position dynamique des éléments verticaux
  // const weatherYOffset = gaugeAngle === 180 ? -90 : 0;
  
  let iconX = cx - 25 + icon_offset_x;
  const iconYOffset = gaugeAngle === 180 ? -90 : 0;
  let iconY = (gaugeAngle === 180 ? cy+12 : cy+5 ) + iconYOffset + icon_offset_y;
  const labelY = (gaugeAngle === 180 ? cy - 25 : cy + 60);
  const pressureY = (gaugeAngle === 180 ? cy + 0 : cy + 85);

      // gestiopn de la locale
  const lang = this.config.language || this.hass?.locale?.language || 'en';
  if (!Object.keys(this._translations).length || !this._translations[lang]) {
    this._translations = HaTbaroCard._localeMap[lang] || HaTbaroCard._localeMap['en'];
  }

  // ——— météo et localisation ———
  const weather = this.getWeatherInfo(); // passe du hPa pur
  const label = this._translations[weather.key] || weather.key;

  // Arcs colorés
  const arcs = segments!.map(seg => {
    const aStart = startAngle + ((seg.from - minP) / (maxP - minP)) * (endAngle - startAngle);
    const aEnd = startAngle + ((seg.to - minP) / (maxP - minP)) * (endAngle - startAngle);
    return svg`<path d="${this.describeArc(cx, cy, r, aStart, aEnd)}" stroke="${seg.color}" stroke-width="${stroke_width}" fill="none" />`;
  });

  // Ticks
  // valeurs fixes en hPa utilisées pour la position angulaire
  const ticksHpa = [950, 960, 970, 980, 990, 1000, 1010, 1020, 1030, 1040, 1050];

  // rendu des traits
  const ticks_old = ticksHpa.map(p => {
    const a  = startAngle + ((p - minP) / (maxP - minP)) * (endAngle - startAngle);
    const p1 = this.polar(cx, cy, r + 16, a);
    const p2 = this.polar(cx, cy, r - 24, a);
    return svg`<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${tick_color}" stroke-width="2" />`;
  });

  //const tickWidth = this.config.tick_width ?? Math.max(1, Math.round(stroke_width * 0.10));
  const TICK_WIDTH = 1;//stroke_width * 0.08;
  const TICK_LEN_OUT = 1;   // pixels hors de l’arc
  const TICK_LEN_IN  = 2;   // pixels vers l’intérieur

  const ticks = ticksHpa.map(p => {
    const a  = startAngle + ((p - minP) / (maxP - minP)) * (endAngle - startAngle);

    /* rayon extérieur = arc + moitié du trait + dépassement */
    const rOuter = r + stroke_width / 2 + TICK_LEN_OUT;

    /* rayon intérieur = arc – moitié du trait – petit retrait */
    const rInner = r - stroke_width / 2 - TICK_LEN_IN;

    const p1 = this.polar(cx, cy, rOuter, a);   // extrémité extérieure
    const p2 = this.polar(cx, cy, rInner, a);   // extrémité intérieure

    return svg`
      <line x1="${p1.x}" y1="${p1.y}"
            x2="${p2.x}" y2="${p2.y}"
            stroke="${tick_color}" stroke-width="${TICK_WIDTH}" />
    `;
  });



    // Labels
    // on étiquette un repère sur deux pour garder de l’espace
    const labelHpa = [960, 980, 1000, 1020, 1040];

    // Labels convertis
    const labels = labelHpa.map(p => {
      const display =
        this.config.unit === 'mm'
          ? (p * HaTbaroCard.HPA_TO_MM).toFixed(0)
          : this.config.unit === 'in'
              ? (p * HaTbaroCard.HPA_TO_IN).toFixed(2)
              : p.toString();

      const a  = startAngle + ((p - minP) / (maxP - minP)) * (endAngle - startAngle);
      const pt = this.polar(cx, cy, r - 36, a);
      return svg`<text x="${pt.x}" y="${pt.y}" font-size="0.9em" font-weight="bolder" class="label">${display}</text>`;
    });


    // Aiguille
    const needle = (() => {

    //const needleLength = gaugeAngle === 180 ? r - 60 : r - 35;
    //const baseLength = gaugeAngle === 180 ? 30 : 16;
  
    //const cy_needle =  cy;
    //const tip = this.polar(cx, cy_needle, needleLength, valueAngle);
    //const base = this.polar(cx, cy_needle, baseLength, valueAngle);

    const needleLength = gaugeAngle === 180 ? r - 5 : r - 35;
    const baseLength = gaugeAngle === 180 ? 80 : 16;
    const tip = this.polar(cx, cy, needleLength, valueAngle);
    const base = this.polar(cx, cy, baseLength, valueAngle);
    const sideAngle = valueAngle + Math.PI / 2;
    const offset = gaugeAngle === 180 ? 7 : 5; // grosseur de l'aiguille
    const baseL = { x: base.x + Math.cos(sideAngle) * offset, y: base.y + Math.sin(sideAngle) * offset };
    const baseR = { x: base.x - Math.cos(sideAngle) * offset, y: base.y - Math.sin(sideAngle) * offset };
    const dot = gaugeAngle === 180 ? nothing : svg`<circle cx="${cx}" cy="${cy}" r="10" fill="${tick_color}" />`;
    
    return svg`
      <polygon points="${tip.x},${tip.y} ${baseL.x},${baseL.y} ${baseR.x},${baseR.y}" fill="${needle_color}" />
      ${dot}
      `;
  })();


  // à ajouter avant ${arcs} si on veut un border 1px autour de la gauge:
  // <circle cx="${cx}" cy="${cy}" r="${r + stroke_width / 2}" fill="none" stroke="#000" stroke-width="1" />

  //const label = pressure > 1020 ? 'Soleil radieux' : pressure < 980 ? 'Tempête' : pressure < 1000 ? 'Pluie probable' : 'Ciel dégagé';

  // début création border fer à cheval
  const borderRadius = r + stroke_width / 2 + 0.5;
  const outerR = r + stroke_width / 2 + 0.5;        // ≈ 0.5 px de marge
  const innerR = r - stroke_width / 2 - 0.5;

  const borderOuter = svg`<path d="${this.describeArc(cx, cy, outerR, startAngle, endAngle)}" stroke="#000" stroke-width="1" fill="none" />`;
  const borderInner = svg`<path d="${this.describeArc(cx, cy, innerR, startAngle, endAngle)}" stroke="#000" stroke-width="1" fill="none" />`;

  const borderArc = svg`<path d="${this.describeArc(cx, cy, borderRadius, startAngle, endAngle)}" stroke="#000" stroke-width="1" fill="none" />`;

  //  <image href="${this.getIconDataUrl(weather.icon)}" x="${iconX}" y="${iconY}" width="50" height="50" />
  const svgIcon = (this.config.show_weather_icon 
        ? svg`<image href="${this.getIconDataUrl(weather.icon)}" x="${iconX}" y="${iconY}" width="${icon_size}" height="${icon_size}" />`
        : '');

  const weatherLabel = (this.config.show_weather_text
        ? svg`<text x="${cx}" y="${labelY}" font-size="14" class="label">${label}</text>`
        : '');

  const svgPressText = (this.config.show_pressure 
        ? svg`<text x="${cx}" y="${pressureY}" font-size="22" font-weight="bold" class="label">
                  ${this.config.unit === 'mm'
                      ? pressure.toFixed(1) + ' mm'
                      : this.config.unit === 'in'
                        ? pressure.toFixed(2) + ' inHg'
                        : pressure.toFixed(1) + ' hPa'
                  }
              </text>` 
        : '');

  // 1) Bloc icône stocké dans une variable
  const iconNode = html`
  <ha-icon
    .icon=${this.getMdiIcon(weather.key)}
    style="
      --mdc-icon-size: 24px;           /* diamètre réel de l’icône */
      position: absolute;
      left:${iconX}px;
      top:${iconY}px;
      transform: translate(470%, -25%);/* centre l’icône */
      color:${tick_color};
    "
  ></ha-icon>
  `;

  // Hauteur utile : ±180 px au lieu de 300 px
  const viewHeight = gaugeAngle === 180 ? 180 : 300;
  const clipHeight = gaugeAngle === 180 ? (size! / 300) * 180 : 'auto';

  // before building the template
  const hasTitle = !!this.config.title;
  const svgTop = hasTitle ? '-16px' : '0';   // tighten title→gauge gap

  return html`
    <ha-card 
      role="button"
      tabindex="0"
      aria-label="Show details"
      .header=${this.config.title || undefined}      
      style="cursor:pointer"           
      @click=${this._onClick}
      @keydown=${this._onKeyDown}
    >
    
     

      ${svg`<svg viewBox="0 0 300 ${viewHeight}" style="max-width:${size}px;height:auto;display:block;margin-top:${svgTop};">
   
        ${this.config.border !== 'none' && (this.config.border === 'inner' || this.config.border === 'both') ? borderInner : nothing}
        ${this.config.border === 'outer' || this.config.border === 'both' ? borderOuter : nothing}

        ${arcs}
        ${ticks}
        ${labels}
        ${needle}
        ${svgIcon}
        ${weatherLabel}
        ${svgPressText}

      </svg>`}
      <!-- 2 On injecte la variable ici, hors du <svg> -->
      <!-- ${iconNode} --> 

    </ha-card>
  `;
    //  si on veut afficher une image en HTML: ${show_weather_icon ? this.getIcon(weather.icon) : nothing}
    // mais il faut le faire hors du svg...
  }
}


// Card Picker registration (name/description shown in “Ajouter une carte”)
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'ha-tbaro-card',
  name: 'Barometer Gauge (ha-tbaro-card)',
  description: 'SVG barometer gauge with 180°/270°, hPa/mm/inHg, i18n, tick sizing, borders.',
  preview: true,
});