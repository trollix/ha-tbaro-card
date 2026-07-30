import { css } from 'lit';

export default css`
  .modern-card {
    cursor: pointer;
    overflow: hidden;

    --baro-bg: var(--ha-card-background, var(--card-background-color));
    --baro-text: var(--primary-text-color);
    --baro-muted: var(--secondary-text-color);
    --baro-line: color-mix(in srgb, var(--baro-text) 14%, transparent);
    --baro-marker: var(--baro-text);
    --baro-marker-ring: var(--baro-bg);
    --baro-status-bg: color-mix(
      in srgb,
      var(--success-color, #4caf50) 13%,
      transparent
    );
    --baro-status-text: var(--success-color, #4caf50);
  }

  .modern-card.theme-light {
    --baro-bg: #f7f8fb;
    --baro-text: #172033;
    --baro-muted: #6e7687;
    --baro-line: rgba(23, 32, 51, 0.13);
    --baro-marker: #172033;
    --baro-marker-ring: #f7f8fb;
    --baro-status-bg: rgba(54, 163, 104, 0.13);
    --baro-status-text: #278558;

    background: var(--baro-bg);
    color: var(--baro-text);
  }

  .modern-card.theme-dark {
    --baro-bg: #131722;
    --baro-text: #f4f6fb;
    --baro-muted: #929bad;
    --baro-line: rgba(244, 246, 251, 0.14);
    --baro-marker: #ffffff;
    --baro-marker-ring: #131722;
    --baro-status-bg: rgba(88, 210, 144, 0.15);
    --baro-status-text: #69dda0;

    background: var(--baro-bg);
    color: var(--baro-text);
  }

  .modern-svg {
    display: block;
    width: 100%;
    height: auto;
    margin: 0;
    font-family: var(--paper-font-body1_-_font-family, sans-serif);
  }

  .modern-svg-title {
    fill: var(--baro-muted);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 2.1px;
    text-anchor: middle;
    text-transform: uppercase;
  }

  .modern-svg-value {
    fill: var(--baro-text);
    font-size: 50px;
    font-weight: 300;
    text-anchor: middle;
  }

  .modern-svg-unit {
    fill: var(--baro-muted);
    font-size: 20px;
    font-weight: 500;
    text-anchor: middle;
  }

  .modern-svg-scale-value {
    fill: var(--baro-text);
    font-size: 15px;
    font-weight: 600;
    text-anchor: middle;
  }

  .modern-svg-scale-label,
  .modern-svg-trend-period {
    fill: var(--baro-muted);
    font-size: 14px;
    text-anchor: middle;
  }

  .modern-svg-trend {
    fill: var(--baro-text);
    font-size: 19px;
    font-weight: 500;
    text-anchor: middle;
  }

  .modern-svg-trend-up {
    fill: var(--success-color, #4caf50);
  }

  .modern-svg-trend-down {
    fill: var(--error-color, #db4437);
  }

  .modern-svg-status {
    fill: var(--baro-status-text);
    font-size: 15px;
    font-weight: 500;
    text-anchor: middle;
  }

  .modern-marker {
    fill: var(--baro-marker);
    stroke: var(--baro-marker-ring);
    stroke-width: 3.5;
  }
`;