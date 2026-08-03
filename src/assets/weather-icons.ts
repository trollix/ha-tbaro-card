import { nothing, svg } from 'lit';

export type WeatherIcon =
  | 'storm'
  | 'rain'
  | 'partly'
  | 'sun';

type WeatherIconOptions = {
  x: number;
  y: number;

  scale?: number;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;

  shadow?: boolean;
  shadowStroke?: string;
  shadowStrokeWidth?: number;
  shadowOpacity?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
};

/**
 * Dessine la forme SVG d'une icône météo.
 */
function renderWeatherShape(
  icon: WeatherIcon,
  transform: string,
  stroke: string,
  strokeWidth: number,
  opacity: number,
) {
  const commonAttributes = {
    transform,
    stroke,
    strokeWidth,
    opacity,
  };

  if (icon === 'storm') {
    return svg`
      <g
        transform="${commonAttributes.transform}"
        stroke="${commonAttributes.stroke}"
        stroke-width="${commonAttributes.strokeWidth}"
        opacity="${commonAttributes.opacity}"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          d="
            M -10 0
            C -10 -6 -5 -10 1 -9
            C 5 -13 13 -10 14 -4
            C 20 -3 21 6 15 8
            H -7
            C -13 8 -15 2 -10 0
          "
        />

        <path d="M 3 11 L -2 19 H 4 L 0 27" />
      </g>
    `;
  }

  if (icon === 'rain') {
    return svg`
      <g
        transform="${commonAttributes.transform}"
        stroke="${commonAttributes.stroke}"
        stroke-width="${commonAttributes.strokeWidth}"
        opacity="${commonAttributes.opacity}"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          d="
            M -10 0
            C -10 -6 -5 -10 1 -9
            C 5 -13 13 -10 14 -4
            C 20 -3 21 6 15 8
            H -7
            C -13 8 -15 2 -10 0
          "
        />

        <line x1="-4" y1="13" x2="-7" y2="18" />
        <line x1="3" y1="13" x2="0" y2="18" />
        <line x1="10" y1="13" x2="7" y2="18" />
      </g>
    `;
  }

  if (icon === 'partly') {
    return svg`
      <g
        transform="${commonAttributes.transform}"
        stroke="${commonAttributes.stroke}"
        stroke-width="${commonAttributes.strokeWidth}"
        opacity="${commonAttributes.opacity}"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="8" cy="-7" r="6" />

        <line x1="8" y1="-18" x2="8" y2="-14" />
        <line x1="17" y1="-7" x2="21" y2="-7" />
        <line x1="15" y1="-15" x2="18" y2="-18" />

        <path
          d="
            M -10 4
            C -10 -1 -6 -5 -1 -5
            C 2 -10 10 -10 13 -5
            C 19 -5 21 3 16 7
            H -6
            C -10 7 -11 6 -10 4
          "
        />
      </g>
    `;
  }

  return svg`
    <g
      transform="${commonAttributes.transform}"
      stroke="${commonAttributes.stroke}"
      stroke-width="${commonAttributes.strokeWidth}"
      opacity="${commonAttributes.opacity}"
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
  `;
}

/**
 * Dessine une icône météo avec une ombre optionnelle.
 */
export function renderWeatherIcon(
  icon: WeatherIcon,
  {
    x,
    y,

    scale = 1,
    stroke = 'currentColor',
    strokeWidth = 2,
    opacity = 1,

    shadow = false,
    shadowStroke = 'rgba(0, 0, 0, 0.35)',
    shadowStrokeWidth = strokeWidth + 1.2,
    shadowOpacity = 0.45,
    shadowOffsetX = 0.8,
    shadowOffsetY = 1,
  }: WeatherIconOptions,
) {
  const iconTransform =
    `translate(${x} ${y}) scale(${scale})`;

  const shadowTransform =
    `translate(${x + shadowOffsetX} ${y + shadowOffsetY}) scale(${scale})`;

  return svg`
    ${shadow
      ? renderWeatherShape(
          icon,
          shadowTransform,
          shadowStroke,
          shadowStrokeWidth,
          shadowOpacity,
        )
      : nothing}

    ${renderWeatherShape(
      icon,
      iconTransform,
      stroke,
      strokeWidth,
      opacity,
    )}
  `;
}