import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

// HA helper to emit config-changed
const fireEvent = (node: HTMLElement, type: string, detail?: any) =>
  node.dispatchEvent(
    new CustomEvent(type, {
      detail,
      bubbles: true,
      composed: true,
    }),
  );

type Config = {
  entity?: string;
  title?: string;
  design?: 'classic' | 'modern-arc' | 'modern-history' | 'modern-summary';
  theme?: 'auto' | 'light' | 'dark';
  show_weather_icon?: boolean;
  show_weather_text?: boolean;
  show_pressure?: boolean;
  angle?: 180 | 270;
  unit?: 'hpa' | 'mm' | 'in' | 'pa' | 'mbar';
  decimals?: number;
  border?: 'inner' | 'outer' | 'both' | 'none';
  icon_size?: number;
  icon_offset_x?: number;
  icon_offset_y?: number;
  stroke_width?: number;
  needle_color?: string;
  tick_color?: string;
  language?: string;
  trend_hours?: number;
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

  private get _schema() {
    const common = [
      {
        name: 'entity',
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
              { value: 'classic', label: 'Classique' },
              { value: 'modern-arc', label: 'Moderne · Parabole' },
              { value: 'modern-history', label: 'Moderne · Historique' },
              { value: 'modern-summary', label: 'Moderne · Résumé' },
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
              { value: 'mm', label: 'mmHg' },
              { value: 'in', label: 'inHg' },
              { value: 'pa', label: 'Pa' },
              { value: 'mbar', label: 'mbar' },
            ],
          },
        },
      },
      {
        name: 'decimals',
        selector: {
          number: {
            min: 0,
            max: 2,
            step: 1,
            mode: 'box',
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

    const design = this._config.design ?? 'classic';

    if (design === 'modern-arc') {
      return [
        ...common,
        {
          name: 'theme',
          selector: {
            select: {
              options: [
                { value: 'auto', label: 'Automatique' },
                { value: 'light', label: 'Clair' },
                { value: 'dark', label: 'Sombre' },
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
      ];
    }

    if (design === 'modern-history' || design === 'modern-summary') {
      return [
        ...common,
        {
          name: 'theme',
          selector: {
            select: {
              options: [
                { value: 'auto', label: 'Automatique' },
                { value: 'light', label: 'Clair' },
                { value: 'dark', label: 'Sombre' },
              ],
            },
          },
        },
      ];
    }

    return [
      ...common,
      {
        name: 'show_weather_icon',
        selector: { boolean: {} },
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
        name: 'icon_size',
        selector: {
          number: {
            min: 10,
            max: 150,
            step: 1,
            mode: 'box',
          },
        },
      },
      {
        name: 'icon_offset_x',
        selector: {
          number: {
            min: -150,
            max: 150,
            step: 1,
            mode: 'box',
          },
        },
      },
      {
        name: 'icon_offset_y',
        selector: {
          number: {
            min: -150,
            max: 150,
            step: 1,
            mode: 'box',
          },
        },
      },
      {
        name: 'stroke_width',
        selector: {
          number: {
            min: 6,
            max: 40,
            step: 1,
            mode: 'box',
          },
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
      design: 'Design',
      theme: 'Thème',
      unit: 'Unité',
      decimals: 'Décimales',
      show_pressure: 'Afficher la pression',
      show_weather_text: 'Afficher le libellé météo',
      show_weather_icon: 'Afficher l’icône météo',
      language: 'Langue',
      trend_hours: 'Période de tendance',
      angle: 'Angle du cadran',
      border: 'Bordure',
      icon_size: 'Taille de l’icône',
      icon_offset_x: 'Décalage horizontal de l’icône',
      icon_offset_y: 'Décalage vertical de l’icône',
      stroke_width: 'Épaisseur de l’arc',
      needle_color: 'Couleur de l’aiguille',
      tick_color: 'Couleur des graduations',
    };

    return (
      labels[schemaItem.name] ||
      this.hass?.localize?.(
        `ui.panel.lovelace.editor.card.generic.${schemaItem.name}`,
      ) ||
      schemaItem.name
    );
  };

  private _valueChanged(ev: CustomEvent) {
    const value = ev.detail?.value;
    if (!value || !this._config) return;

    const next: any = { ...value };

    if (next.angle != null) next.angle = Number(next.angle);
    if (next.decimals != null) next.decimals = Number(next.decimals);
    if (next.stroke_width != null) {
      next.stroke_width = Number(next.stroke_width);
    }
    if (next.icon_size != null) next.icon_size = Number(next.icon_size);
    if (next.icon_offset_x != null) {
      next.icon_offset_x = Number(next.icon_offset_x);
    }
    if (next.icon_offset_y != null) {
      next.icon_offset_y = Number(next.icon_offset_y);
    }
    if (next.trend_hours != null) {
      next.trend_hours = Number(next.trend_hours);
    }

    this._config = next;
    fireEvent(this, 'config-changed', { config: next });
  }

  render() {
    if (!customElements.get('ha-form')) {
      return html`
        <div class="form">
          <p>
            <em>
              ha-form indisponible. Mettez à jour Home Assistant ou éditez en
              YAML.
            </em>
          </p>
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
