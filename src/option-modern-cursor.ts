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


          <!-- Pictogrammes décoratifs -->

          <!-- Pluie -->
          <g
            transform="translate(66 116)"
            stroke="rgba(255, 255, 255, 0.65)"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M -10 0 C -10 -6 -5 -10 1 -9 C 5 -13 13 -10 14 -4 C 20 -3 21 6 15 8 H -7 C -13 8 -15 2 -10 0" />
            <line x1="-4" y1="13" x2="-7" y2="18" />
            <line x1="3" y1="13" x2="0" y2="18" />
            <line x1="10" y1="13" x2="7" y2="18" />
          </g>

          <!-- Nuage -->
          <g
            transform="translate(150 116)"
            stroke="rgba(255, 255, 255, 0.65)"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M -13 5 C -13 -1 -9 -5 -4 -5 C -1 -11 8 -12 12 -6 C 19 -6 22 3 17 7 H -8 C -12 7 -14 6 -13 5" />
          </g>

          <!-- Soleil -->
          <g
            transform="translate(234 116)"
            stroke="rgba(255, 255, 255, 0.65)"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
          >
            <circle cx="0" cy="0" r="8" />
            <line x1="0" y1="-16" x2="0" y2="-12" />
            <line x1="0" y1="12" x2="0" y2="16" />
            <line x1="-16" y1="0" x2="-12" y2="0" />
            <line x1="12" y1="0" x2="16" y2="0" />
            <line x1="-11" y1="-11" x2="-8" y2="-8" />
            <line x1="8" y1="8" x2="11" y2="11" />
            <line x1="11" y1="-11" x2="8" y2="-8" />
            <line x1="-8" y1="8" x2="-11" y2="11" />
          </g>

          
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