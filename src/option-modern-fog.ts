/**
 * ============================================================================
 * HA-TBARO-CARD
 * Rendu : Modern Fog
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

export function renderModernFog(this: any) {
  return html`
    <ha-card
      class="modern-card"
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
          <text x="150" y="30" class="modern-svg-title">
            ${this.config.title || 'Pression'}
          </text>

          <text x="150" y="180" class="modern-svg-value">
            ${this.pressure}
          </text>

          <text x="150" y="208" class="modern-svg-unit">
            ${this.pressureUnit}
          </text>
        </svg>
      `}
    </ha-card>
  `;
}