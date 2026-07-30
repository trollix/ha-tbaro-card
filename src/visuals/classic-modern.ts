/**
 * ============================================================================
 * HA-TBARO-CARD
 * Visuel : Classic
 * ============================================================================
 *
 * Affichage classique du baromètre :
 * - cadran 180° ou 270°
 * - segments colorés
 * - graduations
 * - aiguille
 * - pictogramme météo
 * - texte météo
 * - pression actuelle
 *
 * ============================================================================
 */

import { html, svg, nothing } from 'lit';

export function renderClassicModern(this: any) {

    const pressure = this.pressure;

  const {
    title,
    language,
    unit,
    needle_color,
    tick_color,
    size,
    decimals = 0,
    icon_size = 50,
    icon_offset_x = 0,
    icon_offset_y = 0,
    segments = [],
    stroke_width = 20,
    angle: gaugeAngle = 270,
    border = 'outer',
    show_weather_icon,
    show_weather_text,
    show_pressure,
  } = this.config;

  const cx = 150;
  const cy = 150;
  const radius = 110;

  const minPressure = 950;
  const maxPressure = 1050;
  const pressureRange = maxPressure - minPressure;

  // Gestion de l'angle dynamique
  const isHalfGauge = gaugeAngle === 180;
  const startAngle = isHalfGauge ? Math.PI : Math.PI * 0.75;
  const endAngle = isHalfGauge ? Math.PI * 2 : Math.PI * 2.25;
  const angleRange = endAngle - startAngle;

  const pressureHpa = this.rawHpa; // pour l’angle et getWeatherInfo
  const needleAngle = startAngle + ((pressureHpa - minPressure) / pressureRange) * angleRange;


  // Position dynamique des éléments verticaux
  // const weatherYOffset = isHalfGauge ? -90 : 0;
  
  const iconX = cx - 25 + icon_offset_x;
  const iconYOffset = isHalfGauge ? -90 : 0;
  const iconY = (isHalfGauge ? cy + 12 : cy + 5) + iconYOffset + icon_offset_y;
  const labelY = isHalfGauge ? cy - 25 : cy + 60;
  const pressureY = isHalfGauge ? cy : cy + 85;


  // ——— météo et localisation ———
  const weather = this.getWeatherInfo();
  const label = this._translateText(weather.key);

  // Arcs colorés
  const classicModernArc = this.describeArc(
    cx,
    cy,
    radius,
    startAngle,
    endAngle,
  );

  // Ticks
  // valeurs fixes en hPa utilisées pour la position angulaire
  const tickPressures = [950, 960, 970, 980, 990, 1000, 1010, 1020, 1030, 1040, 1050];

  // rendu des traits - deprecated
  /*
  const ticks_old = tickPressures.map(p => {
    const a  = startAngle + ((p - minP) / (maxP - minP)) * angleRange;
    const p1 = this.polar(cx, cy, r + 16, a);
    const p2 = this.polar(cx, cy, r - 24, a);
    return svg`<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${tick_color}" stroke-width="2" />`;
  });
  */

  const tickLengthOuter = 1;   // pixels hors de l’arc
  const tickLengthInner  = 2;   // pixels vers l’intérieur

  const tickMarks = tickPressures.map((pressureValue: number) => {
    const tickAngle = startAngle + ((pressureValue - minPressure) / pressureRange) * angleRange;
    const outerRadius = radius + stroke_width / 2 + tickLengthOuter;
    const innerRadius = radius - stroke_width / 2 - tickLengthInner;

    const outerPoint = this.polar( cx, cy,outerRadius, tickAngle, );
    const innerPoint = this.polar( cx, cy, innerRadius, tickAngle,);

    return svg`
      <line
        x1="${outerPoint.x}"
        y1="${outerPoint.y}"
        x2="${innerPoint.x}"
        y2="${innerPoint.y}"
        stroke="var(--classic-modern-muted)"
        stroke-width="1.2"
        opacity="0.72"
      />
    `;
  });



    // Labels
    // on étiquette un repère sur deux pour garder de l’espace
    const labelPressures = [960, 980, 1000, 1020, 1040];

    // Labels convertis
    const pressureLabels = labelPressures.map((pressureValue: number) => {
      const display =
        unit === 'mm'
          ? (pressureValue * this.constructor.HPA_TO_MM).toFixed(0)
          : unit === 'in'
              ? (pressureValue * this.constructor.HPA_TO_IN).toFixed(2)
              : pressureValue.toString();

      const labelAngle  = startAngle + ((pressureValue - minPressure) / pressureRange) * angleRange;
      const labelPoint = this.polar(cx, cy, radius - 36, labelAngle);
      return svg`<text x="${labelPoint.x}" y="${labelPoint.y}" class="classic-modern-scale-label">${display}</text>`;
    });


    // Aiguille
const needle = (() => {
  const needleLength =
    isHalfGauge
      ? radius - 8
      : radius - 24;

  const rearLength =
    isHalfGauge
      ? 18
      : 22;

  const tip = this.polar(
    cx,
    cy,
    needleLength,
    needleAngle,
  );

  const rear = this.polar(
    cx,
    cy,
    -rearLength,
    needleAngle,
  );

  return svg`
    <!-- Ombre légère -->
    <line
      x1="${rear.x + 1.5}"
      y1="${rear.y + 2}"
      x2="${tip.x + 1.5}"
      y2="${tip.y + 2}"
      stroke="rgba(0, 0, 0, 0.16)"
      stroke-width="5"
      stroke-linecap="round"
    />

    <!-- Aiguille principale -->
    <line
      x1="${rear.x}"
      y1="${rear.y}"
      x2="${tip.x}"
      y2="${tip.y}"
      stroke="var(--classic-modern-text)"
      stroke-width="4"
      stroke-linecap="round"
    />

    <!-- Moyeu extérieur -->
    <circle
      cx="${cx}"
      cy="${cy}"
      r="11"
      fill="var(--classic-modern-bg)"
      stroke="rgba(255, 255, 255, 0.78)"
      stroke-width="4"
    />

    <!-- Moyeu central -->
    <circle
      cx="${cx}"
      cy="${cy}"
      r="5"
      fill="var(--classic-modern-text)"
    />
  `;
})();


  // à ajouter avant ${arcs} si on veut un border 1px autour de la gauge:
  // <circle cx="${cx}" cy="${cy}" r="${r + stroke_width / 2}" fill="none" stroke="#000" stroke-width="1" />

  //const label = pressure > 1020 ? 'Soleil radieux' : pressure < 980 ? 'Tempête' : pressure < 1000 ? 'Pluie probable' : 'Ciel dégagé';

  // début création border fer à cheval
  // const borderRadius = r + stroke_width / 2 + 0.5; // non utilisé
  const outerBorderRadius = radius + stroke_width / 2 + 0.5;        // ≈ 0.5 px de marge
  const innerBorderRadius = radius - stroke_width / 2 - 0.5;

  const outerBorder = svg`<path d="${this.describeArc(cx, cy, outerBorderRadius, startAngle, endAngle)}" stroke="#000" stroke-width="1" fill="none" />`;
  const innerBorder = svg`<path d="${this.describeArc(cx, cy, innerBorderRadius, startAngle, endAngle)}" stroke="#000" stroke-width="1" fill="none" />`;

  //  <image href="${this.getIconDataUrl(weather.icon)}" x="${iconX}" y="${iconY}" width="50" height="50" />
  const svgIcon = show_weather_icon
    ? svg`
        <image
          href="${this.getIconDataUrl(weather.icon)}"
          x="${iconX}"
          y="${iconY}"
          width="${icon_size}"
          height="${icon_size}"
        />
      `
    : nothing;

  const weatherLabel = show_weather_text
    ? svg`
        <text
          x="${cx}"
          y="${labelY}"
          font-size="14"
          class="label"
        >
          ${label}
        </text>
      `
    : nothing;

  // Sécurise la précision entre 0 et 2 décimales
  const pressureDecimals = Math.min(2, Math.max(0, decimals));
  const pressureUnit = this.pressureUnit;

const svgPressText = show_pressure
  ? svg`
      <text
        x="${cx}"
        y="${pressureY - 6}"
        class="classic-modern-pressure"
      >
        ${pressure.toFixed(pressureDecimals)}
      </text>

      <text
        x="${cx}"
        y="${pressureY + 18}"
        class="classic-modern-unit"
      >
        ${pressureUnit}
      </text>
    `
  : nothing;


  // Hauteur utile : ±180 px au lieu de 300 px
  const viewHeight = isHalfGauge ? 180 : 300;
  //const clipHeight = isHalfGauge ? (size! / 300) * 180 : 'auto';

  // before building the template
  const hasTitle = !!title;
  const svgTop = hasTitle ? '-16px' : '0';   // tighten title→gauge gap

return html`
  <ha-card
    class="classic-modern-card"
    role="button"
    tabindex="0"
    aria-label="Show details"
    .header=${title || undefined}
    @click=${this._onClick}
    @keydown=${this._onKeyDown}
  >
    ${svg`
      <svg
        class="classic-modern-svg"
        viewBox="0 0 300 ${viewHeight}"
        style="max-width:${size}px;height:auto;display:block;margin-top:${svgTop};"
      >
        <defs>
          <linearGradient
            id="classic-modern-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stop-color="#43a5ec" />
            <stop offset="20%" stop-color="#43a5ec" />

            <stop offset="35%" stop-color="#66cf91" />
            <stop offset="50%" stop-color="#66cf91" />

            <stop offset="65%" stop-color="#e6c648" />
            <stop offset="78%" stop-color="#e6c648" />

            <stop offset="100%" stop-color="#f57a45" />
          </linearGradient>

          <filter
            id="classic-modern-glow"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>

        <!-- Halo diffus -->
        <path
          d="${classicModernArc}"
          stroke="url(#classic-modern-gradient)"
          stroke-width="${stroke_width + 8}"
          stroke-linecap="round"
          fill="none"
          opacity="0.20"
          filter="url(#classic-modern-glow)"
        />

        <!-- Arc principal -->
        <path
          d="${classicModernArc}"
          stroke="url(#classic-modern-gradient)"
          stroke-width="${Math.max(10, stroke_width - 6)}"
          stroke-linecap="round"
          fill="none"
        />

        ${tickMarks}
        ${pressureLabels}
        ${needle}
        ${svgIcon}
        ${weatherLabel}
        ${svgPressText}
      </svg>
    `}
  </ha-card>
`;

    //  si on veut afficher une image en HTML: ${show_weather_icon ? this.getIcon(weather.icon) : nothing}
    // mais il faut le faire hors du svg...

}