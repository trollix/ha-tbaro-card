// ha-tbaro-card.ts

import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { BaroCardConfig } from './types';
import { renderModernSummary } from './visuals/modern-summary';
import { renderModernCircle } from './visuals/modern-circle';
import { renderModernArc } from './visuals/modern-arc';
import { renderModernCursor } from './visuals/modern-cursor';
import { renderClassic } from './visuals/classic';
import { renderClassicModern } from './visuals/classic-modern';

import './ha-tbaro-card-editor';


import classicStyles from './styles/classic';
import classicModernStyles from './styles/classic-modern';
import modernArcStyles from './styles/modern-arc';
import modernSummaryStyles from './styles/modern-summary';
import modernCursorStyles from './styles/modern-cursor';
import modernCircleStyles from './styles/modern-circle';
import commonStyles from './styles/common';

// Import des icônes SVG comme chaînes via rollup-plugin-string
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

@customElement('ha-tbaro-card')
export class HaTbaroCard extends LitElement {
  
  
  @property({ attribute: false }) hass: any;
  @property({ type: Object }) config!: BaroCardConfig;
  @property({ attribute: false }) private _summaryHistoryValues: number[] = [];

  @state() private _historyTrend: number | null = null;

  private _trendRequestKey = '';
  private _trendRequestInFlight = false;
  private _summaryHistoryRequestKey = '';

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
    classicModernStyles,
    commonStyles,
    modernArcStyles,
    modernCircleStyles,
    modernSummaryStyles,
    modernCursorStyles,
  ];


  setConfig(config: BaroCardConfig) {

    if (!config.entity) throw new Error("Entity is required");

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
      trend_hours: 24,
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
  /*
  private getMdiIcon(id: string): string {
    const map: Record<string, string> = {
      sun:    'mdi:weather-sunny',
      partly: 'mdi:weather-partly-cloudy',
      rain:   'mdi:weather-rainy',
      storm:  'mdi:weather-lightning',
    };
    return map[id] ?? 'mdi:weather-cloudy';
  }
  */

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
  this._updateSummaryHistoryIfNeeded();
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
    this.config.design !== 'modern-arc' && 
    this.config.design !== 'modern-circle' &&
    this.config.design !== 'modern-summary'&&
    this.config.design !== 'modern-cursor'
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
        this._trendRequestKey = '';
      } finally {
        this._trendRequestInFlight = false;
      }
}

public getCardSize(): number {
  const design = this.config?.design ?? 'classic';

  if (design === 'modern-arc') {
    return 4;
  } else if (
    design === 'modern-summary'
  ) {
    return 6;
  } else {
    return this.config.angle === 180 ? 3 : 5;
  }
}

public getGridOptions() {
  const design = this.config?.design ?? 'classic';

  if (design === 'modern-arc') {
    return {
      rows: 4,
      columns: 6,
      min_rows: 4,
      min_columns: 3,
    };
  } else if (design === 'modern-summary') {
    return {
      rows: 6,
      columns: 6,
      min_rows: 5,
      min_columns: 4,
    };
  } else {
    const isHalfGauge = this.config.angle === 180;

    return {
      rows: isHalfGauge ? 3 : 5,
      columns: 6,
      min_rows: isHalfGauge ? 2 : 4,
      min_columns: 3,
    };
  }
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


private _translateText(key: string): string {
  const translations =
    HaTbaroCard._localeMap[this.normalizedLanguage] ??
    HaTbaroCard._localeMap.en;

  return translations[key] ??
    HaTbaroCard._localeMap.en[key] ??
    key;
}


private get translatedWeatherLabel(): string {
  const weather = this.getWeatherInfo();

  return this._translateText(weather.key);
}


// -----------------------------------------------------------------------------
// MODERN SUMMARY
// -----------------------------------------------------------------------------


/**
 * Vérifie si l'historique de Modern Summary doit être rechargé.
 *
 * Une nouvelle requête est effectuée uniquement lorsque le design,
 * l'entité ou la période de tendance change.
 */
private _updateSummaryHistoryIfNeeded(): void {
  if (
    !this.hass ||
    !this.config.entity ||
    this.config.design !== 'modern-summary'
  ) {
    return;
  }

  const trendHours =
    this.config.trend_hours ?? 24;

  const requestKey =
    `${this.config.design}|${this.config.entity}|${trendHours}|${this.config.unit}`;

  if (
    requestKey ===
    this._summaryHistoryRequestKey
  ) {
    return;
  }

  this._summaryHistoryRequestKey =
    requestKey;

  void this._loadSummaryHistory();
}


/**
 * Charge l’historique récent de l’entité de pression
 * pour alimenter la courbe de Modern Summary.
 */
/**
 * Charge l’historique récent de l’entité de pression
 * pour alimenter la courbe de Modern Summary.
 */
private async _loadSummaryHistory(): Promise<void> {
  if (!this.hass || !this.config.entity) {
    return;
  }

  const trendHours = this.config.trend_hours ?? 24;

  const startDate = new Date(
    Date.now() - trendHours * 60 * 60 * 1000,
  );

  const startTime = encodeURIComponent(
    startDate.toISOString(),
  );

  const entityId = encodeURIComponent(
    this.config.entity,
  );

try {
  const history = await this.hass.callApi(
    'GET',
    `history/period/${startTime}?filter_entity_id=${entityId}&minimal_response&no_attributes`,
  ) as Array<Array<{ state: string }>>;

  const values = (history[0] ?? [])
    .map((state) => this.historicalStateToHpa(state.state))
    .filter((value): value is number => value !== null)
    .map((value) => {
      if (this.config.unit === 'mm') {
        return value * HaTbaroCard.HPA_TO_MM;
      }

      if (this.config.unit === 'in') {
        return value * HaTbaroCard.HPA_TO_IN;
      }

      if (this.config.unit === 'pa') {
        return value * HaTbaroCard.HPA_TO_PA;
      }

      return value;
    });

  this._summaryHistoryValues = values;
} catch (error) {
  console.error(
    'ha-tbaro-card: unable to load pressure history',
    error,
  );

  this._summaryHistoryValues = [];
}

}

/**
 * Réduit une série historique à un nombre raisonnable de valeurs.
 *
 * Les points sont prélevés régulièrement sur toute la période afin
 * de conserver la forme générale de la courbe sans surcharger le SVG.
 */
private _sampleSummaryHistoryValues(
  values: number[],
  maximumPoints: number,
): number[] {
  if (values.length <= maximumPoints) {
    return [...values];
  }

  const sampledValues: number[] = [];

  for (let index = 0; index < maximumPoints; index += 1) {
    const sourceIndex = Math.round(
      (index / (maximumPoints - 1)) *
        (values.length - 1),
    );

    sampledValues.push(
      values[sourceIndex],
    );
  }

  return sampledValues;
}


/**
 * Transforme une série de valeurs en points SVG.
 *
 * Les valeurs sont automatiquement réparties sur toute la largeur
 * et normalisées verticalement selon le minimum et le maximum
 * de la série.
 */
private _buildSummaryChartPoints(
  values: number[],
  width: number,
  height: number,
  padding: number,
): string {
  if (values.length < 2) {
    return '';
  }

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum || 1;

  return values
    .map((value, index) => {
      const x =
        padding +
        (index / (values.length - 1)) *
          (width - padding * 2);

      const y =
        height -
        padding -
        ((value - minimum) / range) *
          (height - padding * 2);

      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

/**
 * Transforme une liste de points SVG en courbe lissée.
 *
 * La courbe utilise des segments quadratiques entre les points,
 * tout en conservant le premier et le dernier point de la série.
 */
private _buildSummaryChartPath(
  points: string,
): string {
  if (!points) {
    return '';
  }

  const parsedPoints = points
    .split(' ')
    .map((point) => {
      const [x, y] = point
        .split(',')
        .map(Number);

      return { x, y };
    })
    .filter((point) => (
      Number.isFinite(point.x) &&
      Number.isFinite(point.y)
    ));

  if (parsedPoints.length < 2) {
    return '';
  }

  let path =
    `M ${parsedPoints[0].x} ${parsedPoints[0].y}`;

  for (
    let index = 1;
    index < parsedPoints.length - 2;
    index += 1
  ) {
    const currentPoint = parsedPoints[index];
    const nextPoint = parsedPoints[index + 1];

    const middleX =
      (currentPoint.x + nextPoint.x) / 2;

    const middleY =
      (currentPoint.y + nextPoint.y) / 2;

    path +=
      ` Q ${currentPoint.x} ${currentPoint.y}` +
      ` ${middleX} ${middleY}`;
  }

  const controlPoint =
    parsedPoints[parsedPoints.length - 2];

  const lastPoint =
    parsedPoints[parsedPoints.length - 1];

  path +=
    ` Q ${controlPoint.x} ${controlPoint.y}` +
    ` ${lastPoint.x} ${lastPoint.y}`;

  return path;
}

render() {

  // Routeur
  
  if (!this.config) return html``;

  if (this.config.design === 'modern-arc') {
    return renderModernArc.call(this);
  }
  
  if (this.config.design === 'modern-circle') {
    return renderModernCircle.call(this);
  }
  
  if (this.config.design === 'modern-summary') {
    return renderModernSummary.call(this);
  }

  if (this.config.design === 'modern-cursor') {
    return renderModernCursor.call(this);
  }
  
  if (this.config.design === 'classic-modern') {
    return renderClassicModern.call(this);
  }

return renderClassic.call(this);

  return renderClassic.call(this);
  
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