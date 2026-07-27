import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { translateEditor } from './editor-translation';

type ConfigV2 = {
  entity?: string;
  title?: string;
  design?: 'classic' | 'modern-arc' | 'modern-history' | 'modern-summary';
  theme?: 'auto' | 'light' | 'dark';
  unit?: 'hpa' | 'mm' | 'in' | 'pa' | 'mbar';
  decimals?: number;
  show_pressure?: boolean;
  show_weather_text?: boolean;
  language?: string;
  trend_hours?: number;
};

@customElement('ha-tbaro-editor-v2')
export class HaTbaroEditorV2 extends LitElement {
  @property({ attribute: false }) public hass: any;
  @property({ attribute: false }) public config: ConfigV2 = {};

  static styles = css`
    .form {
      padding: 8px 16px 16px;
    }
  `;

  private _translate(key: string): string {
    return translateEditor(this.config.language, key);
  }

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
              {
                value: 'classic',
                label: this._translate('design_classic'),
              },
              {
                value: 'modern-arc',
                label: this._translate('design_modern_arc'),
              },
              {
                value: 'modern-history',
                label: this._translate('design_modern_history'),
              },
              {
                value: 'modern-summary',
                label: this._translate('design_modern_summary'),
              },
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
        name: 'theme',
        selector: {
          select: {
            options: [
              {
                value: 'auto',
                label: this._translate('editor_auto'),
              },
              {
                value: 'light',
                label: this._translate('editor_light'),
              },
              {
                value: 'dark',
                label: this._translate('editor_dark'),
              },
            ],
          },
        },
      },
      {
        name: 'trend_hours',
        selector: {
          number: {
            min: 1,
            max: 24,
            step: 1,
            mode: 'box',
            unit_of_measurement: 'h',
          },
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
    ];
  }

  private _computeLabel = (schemaItem: any) => {
    const translationKeys: Record<string, string> = {
      entity: 'editor_pressure_entity',
      title: 'title',
      design: 'editor_version',
      unit: 'unit',
      decimals: 'decimals',
      theme: 'editor_theme',
      show_pressure: 'show_pressure',
      trend_hours: 'trend_hours',
      show_weather_text: 'show_weather_text',
      language: 'language',
    };

    const translationKey = translationKeys[schemaItem.name];

    if (translationKey) {
      return this._translate(translationKey);
    }

    return schemaItem.name;
  };


  private _valueChanged(event: CustomEvent) {
    const value = event.detail?.value;
    if (!value) return;

    const next: ConfigV2 = { ...value };

    if (next.decimals != null) next.decimals = Number(next.decimals);
    if (next.trend_hours != null) next.trend_hours = Number(next.trend_hours);

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
