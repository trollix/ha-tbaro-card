import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import './editors/editor-v1';
import './editors/editor-v2';

type Config = {
  design?:
    | 'classic'
    | 'modern-arc'
    | 'modern-circle'
    | 'modern-history'
    | 'modern-summary';

  [key: string]: unknown;
};

@customElement('ha-tbaro-card-editor')
export class HaTbaroCardEditor extends LitElement {
  @property({ attribute: false }) public hass: any;
  @state() private _config: Config = {};

  public setConfig(config: Config) {
    this._config = { ...config };
  }

  private _configChanged = (event: CustomEvent) => {
    const config = event.detail?.config;
    if (!config) return;

    this._config = { ...config };

    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      }),
    );
  };

  render() {
    const design = this._config.design ?? 'classic';

    if (
      design === 'modern-arc' ||
      design === 'modern-circle' ||
      design === 'modern-history' ||
      design === 'modern-summary'
    ) { 
      return html`
        <ha-tbaro-editor-v2
          .hass=${this.hass}
          .config=${this._config}
          @config-changed=${this._configChanged}
        ></ha-tbaro-editor-v2>
      `;
    }

    return html`
      <ha-tbaro-editor-v1
        .hass=${this.hass}
        .config=${this._config}
        @config-changed=${this._configChanged}
      ></ha-tbaro-editor-v1>
    `;
  }
}
