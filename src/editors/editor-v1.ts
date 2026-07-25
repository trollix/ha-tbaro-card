import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

type ConfigV1 = {
  entity?: string;
  title?: string;
  design?: 'classic' | 'modern-arc';
  unit?: 'hpa' | 'mm' | 'in' | 'pa' | 'mbar';
  decimals?: number;
  show_pressure?: boolean;
  show_weather_text?: boolean;
  show_weather_icon?: boolean;
  language?: string;
  angle?: 180 | 270;
  border?: 'inner' | 'outer' | 'both' | 'none';
  size?: number;
  icon_size?: number;
  icon_offset_x?: number;
  icon_offset_y?: number;
  stroke_width?: number;
  needle_color?: string;
  tick_color?: string;
};

@customElement('ha-tbaro-editor-v1')
export class HaTbaroEditorV1 extends LitElement {
  @property({ attribute: false }) public hass: any;
  @property({ attribute: false }) public config: ConfigV1 = {};

  static styles = css`
    .form {
      padding: 8px 16px 16px;
    }
  `;

  private get _schema() {
    return [
      {
        name: 'entity',
        required: true,
        selector: { entity: { domain: 'sensor' } },
      },
      {
        name: 'title',
        selector: { text: {} },
      },
      {
        name: 'design',
        selector: {
          select: {
            mode: 'dropdown',
            options: [
              { value: 'classic', label: 'Version 1 · Classique' },
              { value: 'modern-arc', label: 'Version 2 · Moderne' },
            ],
          },
        },
      },
      {
        name: 'unit',
        selector: {
          select: {
            options: [
              { value: 'hpa', label: 'hPa' },
              { value: 'mbar', label: 'mbar' },
              { value: 'mm', label: 'mmHg' },
              { value: 'in', label: 'inHg' },
              { value: 'pa', label: 'Pa' },
            ],
          },
        },
      },
      {
        name: 'decimals',
        selector: {
          number: { min: 0, max: 2, step: 1, mode: 'box' },
        },
      },
      {
        name: 'show_pressure',
        selector: { boolean: {} },
      },
      {
        name: 'show_weather_text',
        selector: { boolean: {} },
      },
      {
        name: 'show_weather_icon',
        selector: { boolean: {} },
      },
      {
        name: 'language',
        selector: {
          select: {
            options: [
              { value: 'de', label: 'Deutsch' },
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Español' },
              { value: 'fr', label: 'Français' },
              { value: 'it', label: 'Italiano' },
              { value: 'nl', label: 'Nederlands' },
              { value: 'pl', label: 'Polski' },
              { value: 'ru', label: 'Русский' },
              { value: 'sv', label: 'Svenska' },
            ],
          },
        },
      },
      {
        name: 'angle',
        selector: {
          select: {
            options: [
              { value: 180, label: '180°' },
              { value: 270, label: '270°' },
            ],
          },
        },
      },
      {
        name: 'border',
        selector: {
          select: {
            options: [
              { value: 'none', label: 'Aucune' },
              { value: 'inner', label: 'Intérieure' },
              { value: 'outer', label: 'Extérieure' },
              { value: 'both', label: 'Les deux' },
            ],
          },
        },
      },
      {
        name: 'size',
        selector: {
          number: { min: 150, max: 600, step: 10, mode: 'box' },
        },
      },
      {
        name: 'icon_size',
        selector: {
          number: { min: 10, max: 150, step: 1, mode: 'box' },
        },
      },
      {
        name: 'icon_offset_x',
        selector: {
          number: { min: -150, max: 150, step: 1, mode: 'box' },
        },
      },
      {
        name: 'icon_offset_y',
        selector: {
          number: { min: -150, max: 150, step: 1, mode: 'box' },
        },
      },
      {
        name: 'stroke_width',
        selector: {
          number: { min: 6, max: 40, step: 1, mode: 'box' },
        },
      },
      {
        name: 'needle_color',
        selector: { text: {} },
      },
      {
        name: 'tick_color',
        selector: { text: {} },
      },
    ];
  }

  private _computeLabel = (schemaItem: any) => {
    const labels: Record<string, string> = {
      entity: 'Entité de pression',
      title: 'Titre',
      design: 'Version',
      unit: 'Unité',
      decimals: 'Décimales',
      show_pressure: 'Afficher la pression',
      show_weather_text: 'Afficher le libellé météo',
      show_weather_icon: 'Afficher l’icône météo',
      language: 'Langue',
      angle: 'Angle du cadran',
      border: 'Bordure',
      size: 'Taille de la carte',
      icon_size: 'Taille de l’icône',
      icon_offset_x: 'Décalage horizontal de l’icône',
      icon_offset_y: 'Décalage vertical de l’icône',
      stroke_width: 'Épaisseur de l’arc',
      needle_color: 'Couleur de l’aiguille',
      tick_color: 'Couleur des graduations',
    };

    return labels[schemaItem.name] ?? schemaItem.name;
  };

  private _valueChanged(event: CustomEvent) {
    const value = event.detail?.value;
    if (!value) return;

    const next: ConfigV1 = { ...value };

    if (next.angle != null) next.angle = Number(next.angle) as 180 | 270;
    if (next.decimals != null) next.decimals = Number(next.decimals);
    if (next.size != null) next.size = Number(next.size);
    if (next.stroke_width != null) next.stroke_width = Number(next.stroke_width);
    if (next.icon_size != null) next.icon_size = Number(next.icon_size);
    if (next.icon_offset_x != null) next.icon_offset_x = Number(next.icon_offset_x);
    if (next.icon_offset_y != null) next.icon_offset_y = Number(next.icon_offset_y);

    this.config = next;

    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: next },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <div class="form">
        <ha-form
          .hass=${this.hass}
          .data=${this.config}
          .schema=${this._schema}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._valueChanged}
        ></ha-form>
      </div>
    `;
  }
}
