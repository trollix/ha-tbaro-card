export type PressureUnit =
  | 'hpa'
  | 'mbar'
  | 'mm'
  | 'in'
  | 'pa';

export type CardDesign =
  | 'classic'
  | 'modern-arc'
  | 'modern-circle'
  | 'modern-summary';

export type CardTheme =
  | 'auto'
  | 'light'
  | 'dark';

export type GaugeAngle = 180 | 270;

export type BorderStyle =
  | 'none'
  | 'inner'
  | 'outer'
  | 'both';

export interface Segment {
  from: number;
  to: number;
  color: string;
}

/**
 * Configuration complète acceptée par la carte principale.
 *
 * La carte principale gère actuellement tous les designs dans une même classe,
 * donc elle utilise volontairement une interface commune.
 */
export interface BaroCardConfig {
  entity: string;
  title?: string;
  language?: string;

  design?: CardDesign;
  theme?: CardTheme;
  curve_color?: string;

  unit?: PressureUnit;
  decimals?: number;

  needle_color?: string;
  tick_color?: string;

  show_weather_icon?: boolean;
  show_weather_text?: boolean;
  show_pressure?: boolean;

  stroke_width?: number;
  size?: number;

  icon_size?: number;
  icon_offset_x?: number;
  icon_offset_y?: number;

  angle?: GaugeAngle;
  border?: BorderStyle;

  trend_hours?: number;

  segments?: Segment[];
}

/**
 * Configuration de l’éditeur classique.
 */
export interface BaroCardConfigV1 {
  entity: string;
  title?: string;
  language?: string;

  design?: 'classic';

  unit?: PressureUnit;
  decimals?: number;

  show_weather_icon?: boolean;
  show_weather_text?: boolean;
  show_pressure?: boolean;

  angle?: GaugeAngle;
  border?: BorderStyle;

  size?: number;
  stroke_width?: number;

  icon_size?: number;
  icon_offset_x?: number;
  icon_offset_y?: number;

  needle_color?: string;
  tick_color?: string;

  segments?: Segment[];
}

/**
 * Configuration de l’éditeur moderne.
 */
export interface BaroCardConfigV2 {
  entity: string;
  title?: string;
  language?: string;

  design?:
    | 'modern-arc'
    | 'modern-circle'
    | 'modern-summary';

  theme?: CardTheme;
  curve_color?: string;

  unit?: PressureUnit;
  decimals?: number;

  show_pressure?: boolean;
  show_weather_text?: boolean;

  trend_hours?: number;
}

/**
 * Dans l’éditeur, la configuration peut être incomplète pendant la saisie.
 */
export type BaroCardEditorConfigV1 =
  Partial<BaroCardConfigV1>;

export type BaroCardEditorConfigV2 =
  Partial<BaroCardConfigV2>;