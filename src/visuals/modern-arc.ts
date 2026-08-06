/**
 * ============================================================================
 * HA-TBARO-CARD
 * Rendu : Modern Arc
 * ============================================================================
 *
 * Affichage sur 180° en parabole
 *
 * Ce rendu reprend les informations de Modern Arc :
 * - pression actuelle
 * - unité
 * - tendance
 * - pression basse et haute
 * - texte météo
 *
 * Seule la présentation graphique est différente.
 *
 * ============================================================================
 */

import { html, svg, nothing } from 'lit';

export function renderModernArc(this: any) {

  const pressure = this.pressure;
  const decimals = Math.min(2, Math.max(0, this.config.decimals ?? 0));
  const theme = this.config.theme ?? 'auto';
  const title = this.config.title || 'Pression';
  //TR-const trendHours = Math.max(1, this.config.trend_hours ?? 3);
  const weatherLabel = this.translatedWeatherLabel;

  const minP = 950;
  const maxP = 1050;
  const hpa = this.clamp(this.rawHpa, minP, maxP);
  const progress = (hpa - minP) / (maxP - minP);

  // Traduction du trend en unité déclarée dans la configuration
  /*TR-const trendHpa = this._historyTrend;
  const trend =
    trendHpa == null
      ? null
      : this.config.unit === 'mm'
        ? trendHpa * this.constructor.HPA_TO_MM
        : this.config.unit === 'in'
          ? trendHpa * this.constructor.HPA_TO_IN
          : this.config.unit === 'pa'
            ? trendHpa * this.constructor.HPA_TO_PA
            : trendHpa;


   */

  const lowLabel = this._translateText('low');
  const highLabel = this._translateText('high');


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
/*
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

*/

  const trendInfo = this.getTrendInfo(); // Contruction de trend
/*
  const trendClass =
    trend == null || trend === 0
      ? ''
      : trend > 0
        ? 'modern-svg-trend-up'
        : 'modern-svg-trend-down';
*/

const trendDirectionCssClass =
  trendInfo.direction === 'up'
    ? 'modern-svg-trend-up'
    : trendInfo.direction === 'down'
      ? 'modern-svg-trend-down'
      : '';



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
              <!-- Seuil haute pression à 1013 hPa sur l'échelle 950–1050  -->
              <stop offset="0%" stop-color="#3a73f4" />
              <stop offset="20%" stop-color="#43b7df" />

              <stop offset="20%" stop-color="#66cf91" />
              <stop offset="40%" stop-color="#66cf91" />

              <stop offset="40%" stop-color="#d5df55" />
              <stop offset="60%" stop-color="#f0b343" />

              <stop offset="60%" stop-color="#f57a45" />
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

          <!-- épaisseur du trait: stroke-width 5-->
          <path
            d="${curvePath}"
            stroke="url(#baro-modern-gradient)"
            stroke-width="7"
            stroke-linecap="butt"
            fill="none"
          />

          <!-- grosseur du rond: r=8 -->
          <circle
            class="modern-marker"
            cx="${marker.x}"
            cy="${marker.y}"
            r="9"
          />

        <text x="38" y="239" class="modern-svg-scale-value">950</text>
        <text x="38" y="255" class="modern-svg-scale-label">${lowLabel}</text>

        <text x="262" y="239" class="modern-svg-scale-value">1050</text>
        <text x="262" y="255" class="modern-svg-scale-label">${highLabel}</text>

          ${trendInfo.value == null
            ? svg`
                <text x="150" y="246" class="modern-svg-trend">
                  Tendance indisponible
                </text>
              `
            : svg`
                <text
                  x="150"
                  y="242"
                  class="modern-svg-trend ${trendDirectionCssClass}"
                >
                  ${trendInfo.arrow} ${trendInfo.text}
                </text>
                <text
                  x="150"
                  y="262"
                  class="modern-svg-trend-period"
                >
                  ${trendInfo.hours} h
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
