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

export function renderClassic(this: any) {

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
    gauge_angle = 270,
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
  const isHalfGauge = gauge_angle === 180;
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
  const coloredArcs = segments.map((segment: any) => {
    const segmentStartAngle = startAngle + ((segment.from - minPressure) / pressureRange) * angleRange;
    const segmentEndAngle = startAngle + ((segment.to - minPressure) / pressureRange) * angleRange;

    return svg`
      <path
        d="${this.describeArc(cx, cy, radius, segmentStartAngle, segmentEndAngle)}"
        stroke="${segment.color}"
        stroke-width="${stroke_width}"
        fill="none"
      />
    `;
  });

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

  //const tickWidth = this.config.tick_width ?? Math.max(1, Math.round(stroke_width * 0.10));
  const tickWidth = 1;//stroke_width * 0.08;
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
        stroke="${tick_color}"
        stroke-width="${tickWidth}"
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
      return svg`<text x="${labelPoint.x}" y="${labelPoint.y}" font-size="0.9em" font-weight="bolder" class="label">${display}</text>`;
    });


    // Aiguille
    const needle = (() => {

    //const needleLength = isHalfGauge ? r - 60 : r - 35;
    //const baseLength = isHalfGauge ? 30 : 16;
  
    //const cy_needle =  cy;
    //const tip = this.polar(cx, cy_needle, needleLength, needleAngle);
    //const base = this.polar(cx, cy_needle, baseLength, needleAngle);

    const needleLength = isHalfGauge ? radius - 5 : radius - 35;
    const baseLength = isHalfGauge ? 80 : 16;

    const tip = this.polar(cx, cy, needleLength, needleAngle);
    const base = this.polar(cx, cy, baseLength, needleAngle);
    const sideAngle = needleAngle + Math.PI / 2;
    const offset = isHalfGauge ? 7 : 5; // grosseur de l'aiguille
    const baseL = { x: base.x + Math.cos(sideAngle) * offset, y: base.y + Math.sin(sideAngle) * offset };
    const baseR = { x: base.x - Math.cos(sideAngle) * offset, y: base.y - Math.sin(sideAngle) * offset };
    const dot = isHalfGauge ? nothing : svg`<circle cx="${cx}" cy="${cy}" r="10" fill="${tick_color}" />`;
    
    return svg`
      <polygon points="${tip.x},${tip.y} ${baseL.x},${baseL.y} ${baseR.x},${baseR.y}" fill="${needle_color}" />
      ${dot}
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
  //                ${unit === 'mm'
  //                    ? pressure.toFixed(1) + ' mm'
  //                    : unit === 'in'
  //                      ? pressure.toFixed(2) + ' inHg'
  //                        : unit == 'hpa'
  //                        ? pressure.toFixed(1) + ' hPa'
  //                        : pressure.toFixed(1) + ' Pa'
  //                }
  //            </text>` 
  //      : '');



  // Hauteur utile : ±180 px au lieu de 300 px
  const viewHeight = isHalfGauge ? 180 : 300;
  //const clipHeight = isHalfGauge ? (size! / 300) * 180 : 'auto';

  // before building the template
  const hasTitle = !!title;
  const svgTop = hasTitle ? '-16px' : '0';   // tighten title→gauge gap

  return html`
    <ha-card
      role="button"
      tabindex="0"
      aria-label="Show details"
      .header=${title || undefined}
      style="cursor:pointer"
      @click=${this._onClick}
      @keydown=${this._onKeyDown}
    >
      ${svg`
        <svg
          viewBox="0 0 300 ${viewHeight}"
          style="max-width:${size}px;height:auto;display:block;margin-top:${svgTop};"
        >
          ${border === 'inner' || border === 'both' ? innerBorder : nothing}
          ${border === 'outer' || border === 'both' ? outerBorder : nothing}
          ${coloredArcs}
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