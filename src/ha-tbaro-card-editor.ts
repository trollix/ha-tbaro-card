import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

// HA helper to emit config-changed
const fireEvent = (node: HTMLElement, type: string, detail?: any) =>
  node.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));

type Config = {
  entity?: string;
  title?: string;
  angle?: 180 | 270;
  unit?: 'hpa' | 'mm' | 'in';
  show_border?: boolean | 'inner' | 'outer' | 'both' | 'none';
  stroke_width?: number;
  needle_color?: string;
  tick_color?: string;
  language?: string;
};

@customElement('ha-tbaro-card-editor')
export class HaTbaroCardEditor extends LitElement {
  @property({ attribute: false }) public hass: any;
  @state() private _config: Config = {};

  static styles = css`
    .form {
      padding: 8px 16px 16px;
    }
  `;

  public setConfig(config: Config) {
    this._config = { ...config };
  }

  private _schema = [
    { name: 'entity', selector: { entity: { domain: 'sensor' } } },
    { name: 'title', selector: { text: {} } },
    { name: 'angle', selector: { select: { options: [ {value: 180, label: '180°'}, {value: 270, label: '270°'} ] } } },
    { name: 'unit', selector: { select: { options: [ {value: 'hpa', label: 'hPa'}, {value: 'mm', label: 'mmHg'}, {value: 'in', label: 'inHg'} ] } } },
    { name: 'show_border', selector: { select: { options: [
      { value: false, label: 'auto (false)' },
      { value: 'none', label: 'none' },
      { value: 'inner', label: 'inner' },
      { value: 'outer', label: 'outer' },
      { value: 'both', label: 'both' },
    ] } } },
    { name: 'stroke_width', selector: { number: { min: 6, max: 40, step: 1 } } },
    { name: 'needle_color', selector: { text: {} } },
    { name: 'tick_color', selector: { text: {} } },
    { name: 'language', selector: { select: { options: [
      { value: 'en', label: 'en' },
      { value: 'fr', label: 'fr' },
      { value: 'ru', label: 'ru' },
      { value: 'es', label: 'es' },
    ] } } },
  ];

  private _computeLabel = (schemaItem: any) => {
    // Try HA localized label, fallback to raw key
    const key = schemaItem.name;
    return this.hass?.localize?.(`ui.panel.lovelace.editor.card.generic.${key}`) || key;
  };

  private _valueChanged(ev: CustomEvent) {
    const value = ev.detail?.value;
    if (!value || !this._config) return;
    // Normalize types for angle, stroke_width etc.
    const next: any = { ...value };
    if (next.angle != null) next.angle = Number(next.angle);
    if (next.stroke_width != null) next.stroke_width = Number(next.stroke_width);
    fireEvent(this, 'config-changed', { config: next });
  }

  render() {
    // If ha-form is unavailable (very old frontend), fall back to a tiny YAML-ish note
    if (!customElements.get('ha-form')) {
      return html`
        <div class="form">
          <p><em>ha-form indisponible. Mettez à jour Home Assistant ou éditez en YAML.</em></p>
        </div>
      `;
    }

    return html`
      <div class="form">
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${this._schema}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._valueChanged}
        ></ha-form>
      </div>
    `;
  }
}
