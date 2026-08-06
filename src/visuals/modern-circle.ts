/**
 * ============================================================================
 * HA-TBARO-CARD
 * Rendu : Modern Circle
 * ============================================================================
 *
 * Affichage circulaire sur 270°.
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

export function renderModernCircle(this: any) {

  const pressure = this.pressure;
  const decimals = Math.min(2, Math.max(0, this.config.decimals ?? 0));
  const theme = this.config.theme ?? 'auto';
  const title = this.config.title || 'Pression';
  const weatherLabel = this.translatedWeatherLabel;

  const minP = 950;
  const maxP = 1050;
  const hpa = this.clamp(this.rawHpa, minP, maxP);
  const progress = (hpa - minP) / (maxP - minP);

  // Traduction du trend en unité déclarée dans la configuration
  const trendInfo = this.getTrendInfo();

  const trendDirectionCssClass =
    trendInfo.direction === 'up'
      ? 'modern-svg-trend-up'
      : trendInfo.direction === 'down'
        ? 'modern-svg-trend-down'
        : '';



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
/*
 * Cercle ouvert sur 270°.
 *
 * L'arc commence en bas à gauche, passe par le haut,
 * puis se termine en bas à droite.
 */
const centerX = 150;
const centerY = 165;
const radius = 105;

const startAngle = 225;
const endAngle = 495;

const pointOnCircle = (angle: number) => {
  const radians = (angle - 90) * Math.PI / 180;

  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY + radius * Math.sin(radians),
  };
};

const startPoint = pointOnCircle(startAngle);
const endPoint = pointOnCircle(endAngle);

const curvePath = `
  M ${startPoint.x} ${startPoint.y}
  A ${radius} ${radius}
    0 1 1
    ${endPoint.x} ${endPoint.y}
`;

const markerAngle =
  startAngle +
  progress * (endAngle - startAngle);

const marker = pointOnCircle(markerAngle);

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
              <stop offset="60%" stop-color="#f0b343" />

              <stop offset="60%" stop-color="#f57a45" />
              <stop offset="100%" stop-color="#f57a45" />
            </linearGradient>
          </defs>

          <text x="150" y="34" class="modern-svg-title">
            ${title}
          </text>

          ${this.config.show_pressure !== false
            ? svg`
                <text x="150" y="158" class="modern-svg-value">
                  ${pressure.toFixed(decimals)}
                </text>
                <text x="150" y="188" class="modern-svg-unit">
                  ${this.pressureUnit}
                </text>
              `
            : nothing}

          <!-- épaisseur du trait: stroke-width 5-->
<!-- Fond bleu : 20 % -->
<path
  d="${curvePath}"
  pathLength="100"
  stroke="#43a5ec"
  stroke-width="7"
  stroke-linecap="butt"
  stroke-dasharray="20 80"
  fill="none"
/>

<!-- Vert : 20 % -->
<path
  d="${curvePath}"
  pathLength="100"
  stroke="#66cf91"
  stroke-width="7"
  stroke-linecap="butt"
  stroke-dasharray="20 80"
  stroke-dashoffset="-20"
  fill="none"
/>

<!-- Jaune : 20 % -->
<path
  d="${curvePath}"
  pathLength="100"
  stroke="#e6c648"
  stroke-width="7"
  stroke-linecap="butt"
  stroke-dasharray="20 80"
  stroke-dashoffset="-40"
  fill="none"
/>

<!-- Rouge : 40 % -->
<path
  d="${curvePath}"
  pathLength="100"
  stroke="#f57a45"
  stroke-width="7"
  stroke-linecap="butt"
  stroke-dasharray="40 60"
  stroke-dashoffset="-60"
  fill="none"
/>



          <!-- grosseur du rond: r=8 -->
          <circle
            class="modern-marker"
            cx="${marker.x}"
            cy="${marker.y}"
            r="9"
          />

        <text x="67" y="261" class="modern-svg-scale-value">950</text>
        <text x="67" y="278" class="modern-svg-scale-label">${lowLabel}</text>

        <text x="233" y="261" class="modern-svg-scale-value">1050</text>
        <text x="233" y="278" class="modern-svg-scale-label">${highLabel}</text>

          ${trendInfo.value == null
            ? svg`
                <text x="150" y="247" class="modern-svg-trend">
                  Tendance indisponible
                </text>
              `
            : svg`
                <text
                  x="150"
                  y="239"
                  class="modern-svg-trend ${trendDirectionCssClass}"
                >
                  ${trendInfo.arrow} ${trendInfo.text}
                </text>
                <text
                  x="150"
                  y="260"
                  class="modern-svg-trend-period"
                >
                  ${trendInfo.hours} h
                </text>
              `}

          ${this.config.show_weather_text !== false
            ? svg`
                <rect
                  x="94"
                  y="301"
                  width="112"
                  height="38"
                  rx="19"
                  fill="var(--baro-status-bg)"
                />
                <text x="150" y="325" class="modern-svg-status">
                  ${weatherLabel}
                </text>
              `
            : nothing}
        </svg>
      `}
    </ha-card>
  `;
}
