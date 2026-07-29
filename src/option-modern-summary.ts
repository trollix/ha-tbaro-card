/**
 * ============================================================================
 * HA-TBARO-CARD
 * Rendu : Modern Summary
 * ============================================================================
 *
 * Cette vue présente une synthèse rapide de la pression :
 * - titre de la carte ;
 * - valeur actuelle et unité ;
 * - état météo estimé ;
 * - zone réservée à la future courbe d’historique.
 *
 * Le premier rendu reste volontairement simple et statique.
 * La récupération et l’affichage de l’historique seront ajoutés
 * dans une étape séparée afin de ne pas modifier Modern Arc.
 *
 * ============================================================================
 */

import { html, svg, nothing } from 'lit';

export function renderModernSummary(this: any) {
  
  const theme = this.config.theme ?? 'auto';
  const title = this.config.title || 'Pression';
  const pressure = this.pressure;

  const decimals = Math.min(
    2,
    Math.max(
      0,
      this.config.decimals ?? 0,
    ),
  );

  const curveColor =
  this.config.curve_color || 'var(--primary-color)';

  const weatherLabel = this.translatedWeatherLabel;

  const chartWidth = 300;
  const chartHeight = 145;
  const chartAxisLeft = 44;
  const chartTop = 8;
  const chartBottom = 22;
  const chartPlotHeight =
  chartHeight - chartTop - chartBottom;
  const chartAxisY = chartHeight - 24;

const chartPadding = 5;
const chartViewWidth =
  chartWidth + chartAxisLeft;

  const trendHours = this.config.trend_hours ?? 24;

  const chartValues =
    this._sampleSummaryHistoryValues(
      this._summaryHistoryValues,
      60,
    );

  const lastHistoryValue =
    chartValues[chartValues.length - 1];

  if (
    Number.isFinite(pressure) &&
    pressure !== lastHistoryValue
  ) {
    chartValues.push(pressure);
  }

  const minimumPressure =
    chartValues.length > 0
      ? Math.min(...chartValues)
      : undefined;

  const maximumPressure =
    chartValues.length > 0
      ? Math.max(...chartValues)
      : undefined;

const chartAxisMinimum =
  minimumPressure !== undefined
    ? Math.floor(minimumPressure)
    : undefined;

const chartAxisMaximum =
  maximumPressure !== undefined
    ? Math.ceil(maximumPressure)
    : undefined;

const chartAxisValues =
  chartAxisMinimum !== undefined &&
  chartAxisMaximum !== undefined
    ? Array.from(
        { length: 4 },
        (_, index) => {
          const ratio = index / 3;

          return {
            value:
              chartAxisMaximum -
              ratio *
                (
                  chartAxisMaximum -
                  chartAxisMinimum
                ),

            y:
              chartTop +
              ratio * chartPlotHeight,
          };
        },
      )
    : [];

  const now = new Date();

  const formatChartTime = (hoursAgo: number) => {
    const date = new Date(
      now.getTime() - hoursAgo * 60 * 60 * 1000,
    );

    return date.toLocaleTimeString(
      this.normalizedLanguage,
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    );
  };

  const chartTimeLabels = [
    {
      x: chartAxisLeft,
      label: formatChartTime(trendHours),
    },
    {
      x: chartAxisLeft + chartWidth / 3,
      label: formatChartTime(trendHours * 2 / 3),
    },
    {
      x: chartAxisLeft + chartWidth * 2 / 3,
      label: formatChartTime(trendHours / 3),
    },
    {
      x: chartViewWidth,
      label: formatChartTime(0),
    },
  ];



  const chartPoints =
    this._buildSummaryChartPoints(
      chartValues,
      chartWidth,
      chartPlotHeight,
      chartPadding,
    );

  const chartPath =
    this._buildSummaryChartPath(
      chartPoints,
    );

  const chartPointList =
    chartPoints
      ? chartPoints.split(' ')
      : [];

  const lastChartPoint =
    chartPointList.length > 0
      ? chartPointList[
          chartPointList.length - 1
        ].split(',')
      : [];

  const lastChartX = Number(
    lastChartPoint[0] ?? 0,
  );

  const lastChartY = Number(
    lastChartPoint[1] ?? 0,
  );

  


  return html`
    <ha-card
      class="modern-card ${theme === 'auto' ? '' : `theme-${theme}`}"
      role="button"
      tabindex="0"
      aria-label="Show details"
      @click=${this._onClick}
      @keydown=${this._onKeyDown}
    >
      <div class="modern-summary">


        <div class="modern-summary-header">
          <span class="modern-summary-title">
            ${title}
          </span>

          ${this.config.show_weather_text !== false
            ? html`
                <span class="modern-summary-weather">
                  ${weatherLabel}
                </span>
              `
            : nothing}
        </div>

        <div class="modern-summary-value">
          ${pressure.toFixed(decimals)}

          <span class="modern-summary-unit">
            ${this.pressureUnit}
          </span>
        </div>

        <div class="modern-summary-chart">
          ${chartPath
            ? svg`
<svg
  class="modern-summary-svg"
  viewBox="0 0 ${chartViewWidth} ${chartHeight}"
  preserveAspectRatio="none"
  aria-hidden="true"
>
  ${chartAxisValues.map(
    (axisValue) => svg`
      <text
        class="modern-summary-axis-label"
        x="${chartAxisLeft - 8}"
        y="${axisValue.y + 3}"
        text-anchor="end"
      >
        ${Math.round(axisValue.value)}

      </text>

      <line
        class="modern-summary-grid"
        x1="${chartAxisLeft}"
        y1="${axisValue.y}"
        x2="${chartViewWidth}"
        y2="${axisValue.y}"
      />

      <line
        class="modern-summary-x-axis"
        x1="${chartAxisLeft}"
        y1="${chartAxisY}"
        x2="${chartViewWidth}"
        y2="${chartAxisY}"
      />


${chartTimeLabels.map(
  (timeLabel) => svg`
    <line
      class="modern-summary-x-tick"
      x1="${timeLabel.x}"
      y1="${chartAxisY}"
      x2="${timeLabel.x}"
      y2="${chartAxisY + 4}"
    />

    <text
      class="modern-summary-time-label"
      x="${timeLabel.x}"
      y="${chartAxisY + 24}"
      text-anchor="${timeLabel.x === chartAxisLeft
        ? 'start'
        : timeLabel.x === chartViewWidth
          ? 'end'
          : 'middle'}"
    >
      ${timeLabel.label}
    </text>
  `,
)}


    `,
  )}

  <g transform="translate(${chartAxisLeft} ${chartTop})">
    <path
      class="modern-summary-curve"
      d="${chartPath}" 
      style="stroke: ${curveColor};"
    />

    <circle
      class="modern-summary-point"
      cx="${lastChartX}"
      cy="${lastChartY}"
      r="5" 
      style="fill: ${curveColor};"
    />
  </g>
</svg>
              `
            : html`
                <div class="modern-summary-empty">
                  ${this._translateText('summary_history_unavailable')}
                </div>
              `}
        </div>

      </div>
    </ha-card>
  `;
}

