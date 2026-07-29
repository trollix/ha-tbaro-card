/**
 * ============================================================================
 * HA-TBARO-CARD
 * Rendu : Modern Cursor
 * ============================================================================
 *
 * Affichage horizontal inspiré des baromètres traditionnels.
 *
 * Ce rendu affiche :
 * - une barre colorée 20 / 20 / 20 / 40
 * - des pictogrammes météo décoratifs
 * - un curseur mobile selon la pression
 * - la pression actuelle
 * - l’unité
 * - la tendance
 *
 * ============================================================================
 */

import { html, svg, nothing } from 'lit';

export function renderModernCursor(this: any) {

  const pressure = this.pressure;
  const decimals = Math.min(
    2,
    Math.max(
      0,
      this.config.decimals ?? 0,
    ),
  );

  const theme = this.config.theme ?? 'auto';
  const title = this.config.title || 'Pression';

  const minP = 950;
  const maxP = 1050;

  const hpa = this.clamp(
    this.rawHpa,
    minP,
    maxP,
  );

  const progress =
    (hpa - minP) /
    (maxP - minP);

  const barLeft = 30;
  const barTop = 80;
  const barWidth = 240;
  const barHeight = 72;

  const markerX =
    barLeft +
    progress * barWidth;

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
              id="baro-fog-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
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

          <text
            x="150"
            y="30"
            class="modern-svg-title"
          >
            ${title}
          </text>

          <rect
            x="${barLeft}"
            y="${barTop}"
            width="${barWidth}"
            height="${barHeight}"
            rx="12"
            fill="url(#baro-fog-gradient)"
          />

          <line
            x1="${markerX}"
            y1="${barTop - 5}"
            x2="${markerX}"
            y2="${barTop + barHeight + 5}"
            stroke="#ffffff"
            stroke-width="4"
            stroke-linecap="round"
          />

          ${this.config.show_pressure !== false
            ? svg`
                <text
                  x="150"
                  y="225"
                  class="modern-svg-value"
                >
                  ${pressure.toFixed(decimals)}
                </text>

                <text
                  x="150"
                  y="255"
                  class="modern-svg-unit"
                >
                  ${this.pressureUnit}
                </text>
              `
            : nothing}
        </svg>
      `}
    </ha-card>
  `;
}