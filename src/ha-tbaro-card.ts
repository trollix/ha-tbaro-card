// ha-tbaro-card.ts

import { LitElement, html, css, svg, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';

import './ha-tbaro-card-editor';

import classicStyles from './styles/classic';
import modernStyles from './styles/modern';

// Import des icônes SVG comme chaînes via rollup-plugin-string
// @ts-ignore
import sunIcon from './icons/sun.svg';
import rainIcon from './icons/rain.svg';
import partlyIcon from './icons/partly.svg';
import stormIcon from './icons/storm.svg';

import de from '../locales/de.json';
import en from '../locales/en.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import it from '../locales/it.json';
import nl from '../locales/nl.json';
import pl from '../locales/pl.json';
import ru from '../locales/ru.json';
import sv from '../locales/sv.json';


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
  unit?: 'hpa' | 'mm' | 'in' | 'pa' | 'mbar';
  decimals?: number;
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
  design?: 'classic' | 'modern-arc' | 'modern-history' | 'modern-summary';
  theme?: 'auto' | 'light' | 'dark';
  trend?: number;
  trend_hours?: number;
  segments?: Segment[];
}

@customElement('ha-tbaro-card')
export class HaTbaroCard extends LitElement {
  @property({ attribute: false }) hass: any;
  @property({ type: Object }) config!: BaroCardConfig;

  @state() private _historyTrend: number | null = null;

  private _trendRequestKey = '';
  private _trendRequestInFlight = false;

  private _translations: Record<string, string> = {};
  private static _localeMap: Record<string, Record<string, string>> = { en, de, es, fr, it, nl, pl, ru, sv };

  static styles = [
    css`
      :host {
        display: block;
      }

      svg {
        display: block;
        margin: auto;
      }
    `,
    classicStyles,
    modernStyles,
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
      design: 'classic',
      theme: 'auto',
      trend_hours: 3,
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
    border: 'outer',
    design: 'classic',
    theme: 'auto',
  };
}


  private static readonly HPA_TO_MM  = 0.75006156;
  private static readonly HPA_TO_IN  = 0.02953;        // 1 hPa = 0.02953 inHg
  private static readonly HPA_TO_PA  = 100;            // 1 hPa = 100 Pa
  private static readonly MM_TO_HPA  = 1 / HaTbaroCard.HPA_TO_MM;
  private static readonly IN_TO_HPA  = 1 / HaTbaroCard.HPA_TO_IN;
  private static readonly PA_TO_HPA  = 1 / HaTbaroCard.HPA_TO_PA;


  /** multiplicateur pour aller DE la valeur brute VERS hPa */
  private static readonly UNIT_TO_HPA: Record<string, number> = {
    hpa:   1,
    mbar:  1,
    mm:    HaTbaroCard.MM_TO_HPA,   // ≈ 1.333223684
    mmhg:  HaTbaroCard.MM_TO_HPA,   // accepte « mmHg »
    in:    HaTbaroCard.IN_TO_HPA,       // ← alias court
    inhg:  HaTbaroCard.IN_TO_HPA,       // ← alias complet
    pa:    HaTbaroCard.PA_TO_HPA,      // 1 Pa = 0.01 hPa
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
    if (this.config.unit === 'pa')                // hPa → Pa
      return this.rawHpa * HaTbaroCard.HPA_TO_PA;
    return this.rawHpa;                           // hPa direct and mbar
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


protected updated(changedProperties: Map<PropertyKey, unknown>) {
  super.updated(changedProperties);

  if (
    changedProperties.has('hass') ||
    changedProperties.has('config')
  ) {
    this._refreshPressureTrend();
  }
}

private historicalStateToHpa(stateValue: string): number | null {
  const value = Number.parseFloat(stateValue);
  if (!Number.isFinite(value)) return null;

  const entity = this.hass?.states?.[this.config.entity];
  const key = (entity?.attributes?.unit_of_measurement || 'hPa')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

  const factor = HaTbaroCard.UNIT_TO_HPA[key] ?? 1;
  return value * factor;
}

private async _refreshPressureTrend() {
  if (
    !this.hass ||
    !this.config?.entity ||
    this.config.design !== 'modern-arc'
  ) {
    return;
  }

  const hours = Math.max(1, this.config.trend_hours ?? 3);

  // Une requête maximum toutes les cinq minutes pour cette entité/période.
  const fiveMinuteBucket = Math.floor(Date.now() / (5 * 60 * 1000));
  const requestKey =
    `${this.config.entity}|${hours}|${fiveMinuteBucket}`;

  if (
    requestKey === this._trendRequestKey ||
    this._trendRequestInFlight
  ) {
    return;
  }

  this._trendRequestKey = requestKey;
  this._trendRequestInFlight = true;

  const end = new Date();
  const start = new Date(end.getTime() - hours * 60 * 60 * 1000);

  const path =
    `history/period/${encodeURIComponent(start.toISOString())}` +
    `?filter_entity_id=${encodeURIComponent(this.config.entity)}` +
    `&end_time=${encodeURIComponent(end.toISOString())}` +
    `&minimal_response&no_attributes`;

  try {
    const response = await this.hass.callApi('GET', path);
    const history = Array.isArray(response?.[0]) ? response[0] : [];

    const oldestValidState = history.find(
      (item: any) =>
        this.historicalStateToHpa(String(item?.state)) !== null,
    );

    const previousHpa = oldestValidState
      ? this.historicalStateToHpa(String(oldestValidState.state))
      : null;

    this._historyTrend =
      previousHpa === null
        ? null
        : this.rawHpa - previousHpa;
  } catch (error) {
    console.warn(
      '[ha-tbaro-card] Unable to load pressure history:',
      error,
    );
    this._historyTrend = null;
  } finally {
    this._trendRequestInFlight = false;
  }
}

public getCardSize(): number {
  if (this.config?.design === 'modern-arc') return 4;
  if (
    this.config?.design === 'modern-history' ||
    this.config?.design === 'modern-summary'
  ) {
    return 6;
  }
  return this.config?.angle === 180 ? 3 : 5;
}

public getGridOptions() {
  if (this.config?.design === 'modern-arc') {
    return {
      rows: 4,
      columns: 6,
      min_rows: 4,
      min_columns: 3,
    };
  }

  if (
    this.config?.design === 'modern-history' ||
    this.config?.design === 'modern-summary'
  ) {
    return {
      rows: 6,
      columns: 6,
      min_rows: 5,
      min_columns: 4,
    };
  }

  return {
    rows: this.config?.angle === 180 ? 3 : 5,
    columns: 6,
    min_rows: this.config?.angle === 180 ? 2 : 4,
    min_columns: 3,
  };
}

private polarEllipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  angle: number,
) {
  return {
    x: cx + Math.cos(angle) * rx,
    y: cy + Math.sin(angle) * ry,
  };
}

private describeEllipseArc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  start: number,
  end: number,
) {
  const startPoint = this.polarEllipse(cx, cy, rx, ry, start);
  const endPoint = this.polarEllipse(cx, cy, rx, ry, end);
  const largeArc = end - start > Math.PI ? 1 : 0;

  return `M ${startPoint.x} ${startPoint.y}
          A ${rx} ${ry} 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y}`;
}

private clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

private cubicBezierPoint(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number,
) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x:
      mt3 * p0.x +
      3 * mt2 * t * p1.x +
      3 * mt * t2 * p2.x +
      t3 * p3.x,
    y:
      mt3 * p0.y +
      3 * mt2 * t * p1.y +
      3 * mt * t2 * p2.y +
      t3 * p3.y,
  };
}

private get pressureUnit(): string {
  if (this.config.unit === 'mm') return 'mm';
  if (this.config.unit === 'in') return 'inHg';
  if (this.config.unit === 'pa') return 'Pa';
  if (this.config.unit === 'mbar') return 'mbar';
  return 'hPa';
}

private get normalizedLanguage(): string {
  return (this.config?.language || this.hass?.locale?.language || 'en')
    .toLowerCase()
    .split('-')[0];
}

private get translatedWeatherLabel(): string {
  const lang = this.normalizedLanguage;
  const translations =
    HaTbaroCard._localeMap[lang] ?? HaTbaroCard._localeMap.en;
  return translations[this.getWeatherInfo().key] ?? this.getWeatherInfo().key;
}

private _renderModernArc() {
  const pressure = this.pressure;
  const decimals = Math.min(2, Math.max(0, this.config.decimals ?? 0));
  const theme = this.config.theme ?? 'auto';
  const title = this.config.title || 'Pression';
  const trendHours = Math.max(1, this.config.trend_hours ?? 3);
  const weatherLabel = this.translatedWeatherLabel;

  const minP = 950;
  const maxP = 1050;
  const hpa = this.clamp(this.rawHpa, minP, maxP);
  const progress = (hpa - minP) / (maxP - minP);

  // Traduction du trend en unité déclaré dans la configuration
  const trendHpa = this._historyTrend;
  const trend =
    trendHpa == null
      ? null
      : this.config.unit === 'mm'
        ? trendHpa * HaTbaroCard.HPA_TO_MM
        : this.config.unit === 'in'
          ? trendHpa * HaTbaroCard.HPA_TO_IN
          : this.config.unit === 'pa'
            ? trendHpa * HaTbaroCard.HPA_TO_PA
            : trendHpa;

  /*
   * Parabole réelle :
   *
   *   y = vertexY + a × (x - centerX)²
   *
   * Le tracé déborde légèrement sous y = baseY, puis un clip horizontal
   * coupe proprement ses deux extrémités. On obtient donc à la fois :
   * - une vraie parabole ;
   * - deux coupes horizontales nettes.
   */
  const centerX = 150;
  const vertexY = 166;
  const baseY = 214;
  const visibleLeftX = 30;
  const visibleRightX = 270;

  const parabolaA =
    (baseY - vertexY) /
    Math.pow(visibleRightX - centerX, 2);

  const parabolaY = (x: number) =>
    vertexY + parabolaA * Math.pow(x - centerX, 2);

  /*
   * Segment visible exact de la parabole.
   * stroke-linecap="butt" coupe automatiquement chaque extrémité
   * perpendiculairement à la tangente locale.
   */
  const curvePath = `
    M ${visibleLeftX} ${parabolaY(visibleLeftX)}
    Q ${centerX} ${2 * vertexY - baseY}
      ${visibleRightX} ${parabolaY(visibleRightX)}
  `;

  const markerX =
    visibleLeftX +
    progress * (visibleRightX - visibleLeftX);

  const marker = {
    x: markerX,
    y: parabolaY(markerX) + 2,
  };

  const trendArrow =
    trend == null ? '→' : trend > 0 ? '↑' : trend < 0 ? '↓' : '→';

  const trendDecimals =
    this.config.unit === 'in'
      ? 2
      : this.config.unit === 'pa'
        ? 0
        : 1;

  const trendNumber =
    trend == null
      ? ''
      : `${trend > 0 ? '+' : ''}${trend.toFixed(trendDecimals)} ${this.pressureUnit}`;


  const trendClass =
    trend == null || trend === 0
      ? ''
      : trend > 0
        ? 'modern-svg-trend-up'
        : 'modern-svg-trend-down';

  return html`
    <ha-card
      class="modern-card ${theme === 'auto' ? '' : `theme-${theme}`}"
      role="button"
      tabindex="0"
      aria-label="Show details"
      @click=${this._onClick}
      @keydown=${this._onKeyDown}
    >
      ${svg`
        <svg
          class="modern-svg"
          viewBox="0 0 300 360"
          aria-hidden="true"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient
              id="baro-modern-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <!-- Seuil haute pression à 1013 hPa sur l'échelle 950–1050 -->
              <stop offset="0%" stop-color="#3a73f4" />
              <stop offset="20%" stop-color="#43b7df" />

              <stop offset="20%" stop-color="#66cf91" />
              <stop offset="40%" stop-color="#66cf91" />

              <stop offset="40%" stop-color="#d5df55" />
              <stop offset="63%" stop-color="#f0b343" />

              <stop offset="63%" stop-color="#f57a45" />
              <stop offset="100%" stop-color="#f57a45" />
            </linearGradient>
          </defs>

          <text x="150" y="30" class="modern-svg-title">
            ${title}
          </text>

          ${this.config.show_pressure !== false
            ? svg`
                <text x="150" y="104" class="modern-svg-value">
                  ${pressure.toFixed(decimals)}
                </text>
                <text x="150" y="133" class="modern-svg-unit">
                  ${this.pressureUnit}
                </text>
              `
            : nothing}

          <path
            d="${curvePath}"
            stroke="url(#baro-modern-gradient)"
            stroke-width="5"
            stroke-linecap="butt"
            fill="none"
          />

          <circle
            class="modern-marker"
            cx="${marker.x}"
            cy="${marker.y}"
            r="8"
          />

          <text x="38" y="239" class="modern-svg-scale-value">950</text>
          <text x="38" y="255" class="modern-svg-scale-label">basse</text>

          <text x="262" y="239" class="modern-svg-scale-value">1050</text>
          <text x="262" y="255" class="modern-svg-scale-label">haute</text>

          ${trend == null
            ? svg`
                <text x="150" y="246" class="modern-svg-trend">
                  Tendance indisponible
                </text>
              `
            : svg`
                <text
                  x="150"
                  y="242"
                  class="modern-svg-trend ${trendClass}"
                >
                  ${trendArrow} ${trendNumber}
                </text>
                <text
                  x="150"
                  y="262"
                  class="modern-svg-trend-period"
                >
                  ${trendHours} h
                </text>
              `}

          ${this.config.show_weather_text !== false
            ? svg`
                <rect
                  x="94"
                  y="294"
                  width="112"
                  height="38"
                  rx="19"
                  fill="var(--baro-status-bg)"
                />
                <text x="150" y="318" class="modern-svg-status">
                  ${weatherLabel}
                </text>
              `
            : nothing}
        </svg>
      `}
    </ha-card>
  `;
}

private _renderModernPlaceholder(design: 'modern-history' | 'modern-summary') {
  const theme = this.config.theme ?? 'auto';
  const label =
    design === 'modern-history'
      ? 'Modern history'
      : 'Modern summary';

  return html`
    <ha-card
      class="modern-card ${theme === 'auto' ? '' : `theme-${theme}`}"
      role="button"
      tabindex="0"
      aria-label="Show details"
      @click=${this._onClick}
      @keydown=${this._onKeyDown}
    >
      <div class="modern-coming-soon">
        <strong>${label}</strong><br />
        Le squelette est prêt. Le rendu arrive après validation de Modern arc.
      </div>
    </ha-card>
  `;
}


render() {

  if (!this.config) return html``;

  if (this.config.design === 'modern-arc') {
    return this._renderModernArc();
  }

  if (
    this.config.design === 'modern-history' ||
    this.config.design === 'modern-summary'
  ) {
    return this._renderModernPlaceholder(this.config.design);
  }

  const pressure = this.pressure;
  const {
    title,
    needle_color,
    tick_color,
    size,
    decimals = 0,
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

// Sécurise la précision entre 0 et 2 décimales
const pressureDecimals = Math.min(2, Math.max(0, decimals));

const pressureUnit =
  this.config.unit === 'mm'
    ? 'mm'
    : this.config.unit === 'in'
      ? 'inHg'
      : this.config.unit === 'pa'
        ? 'Pa'
        : this.config.unit === 'mbar'
        ? 'mbar'
        : 'hPa';


const svgPressText = this.config.show_pressure
  ? svg`
      <text
        x="${cx}"
        y="${pressureY}"
        font-size="22"
        font-weight="bold"
        class="label"
      >
        ${pressure.toFixed(pressureDecimals)} ${pressureUnit}
      </text>
    `
  : nothing;

  // const svgPressText = (this.config.show_pressure 
  //      ? svg`<text x="${cx}" y="${pressureY}" font-size="22" font-weight="bold" class="label">
  //                ${this.config.unit === 'mm'
  //                    ? pressure.toFixed(1) + ' mm'
  //                    : this.config.unit === 'in'
  //                      ? pressure.toFixed(2) + ' inHg'
  //                        : this.config.unit == 'hpa'
  //                        ? pressure.toFixed(1) + ' hPa'
  //                        : pressure.toFixed(1) + ' Pa'
  //                }
  //            </text>` 
  //      : '');


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