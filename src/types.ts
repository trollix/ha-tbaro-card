export type PressureUnit =
  | 'hpa'
  | 'mbar'
  | 'mm'
  | 'in'
  | 'pa';

export type CardDesign =
  | 'classic'
  | 'modern-arc'
  | 'modern-history'
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

export interface BaroCardConfig {
  entity: string;
  title?: string;
  language?: string;

  design?:
    | 'classic'
    | 'modern-arc'
    | 'modern-history'
    | 'modern-summary';

  theme?: 'auto' | 'light' | 'dark';

  unit?: 'hpa' | 'mbar' | 'mm' | 'in' | 'pa';
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

  angle?: 180 | 270;
  border?: 'none' | 'inner' | 'outer' | 'both';

  trend_hours?: number;

  segments?: Segment[];
}

export interface BaroCardConfigV1 {
  entity: string;
  title?: string;
  language?: string;
  design?: CardDesign;
  theme?: CardTheme;
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
  trend?: number;
  trend_hours?: number;
  segments?: Segment[];
}


export interface BaroCardConfigV2 {
  entity: string;

  title?: string;
  language?: string;

  design?:
    | 'modern-arc'
    | 'modern-summary'
    | 'modern-history';

  theme?: CardTheme;

  unit?: PressureUnit;
  decimals?: number;

  show_pressure?: boolean;
  show_weather_text?: boolean;

  trend_hours?: number;
}

/**
 * Dans l’éditeur, la configuration peut être incomplète pendant la saisie.
 * L’entité, notamment, n’est pas forcément encore sélectionnée.
 */
export type BaroCardEditorConfigV1 = Partial<BaroCardConfigV1>;
export type BaroCardEditorConfigV2 = Partial<BaroCardConfigV2>;

