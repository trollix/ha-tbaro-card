import { css } from 'lit';

export default css`
  .classic-modern-card {
    cursor: pointer;
    overflow: hidden;

    --classic-modern-text: var(--primary-text-color);
    --classic-modern-muted: var(--secondary-text-color);
    --classic-modern-bg:
      var(--ha-card-background, var(--card-background-color));
    --classic-modern-status-bg:
    color-mix(in srgb, var(--primary-text-color) 7%, transparent);

  }

  .classic-modern-svg {
    font-family:
      var(--paper-font-body1_-_font-family),
      sans-serif;
  }

  .classic-modern-card .label {
    fill: var(--classic-modern-text);
    font-family: inherit;
    text-anchor: middle;
  }


  .classic-modern-card .classic-modern-scale-label {
    fill: var(--classic-modern-muted);
    font-size: 12px;
    font-weight: 500;
    text-anchor: middle;
  }

  .classic-modern-card .classic-modern-pressure {
    fill: var(--classic-modern-text);
    font-size: 34px;
    font-weight: 300;
    text-anchor: middle;
  }

  .classic-modern-card .classic-modern-unit {
    fill: var(--classic-modern-muted);
    font-size: 14px;
    font-weight: 500;
    text-anchor: middle;
  }

  .classic-modern-card .classic-modern-weather {
    fill: var(--classic-modern-text);
    font-size: 13px;
    font-weight: 500;
    text-anchor: middle;
  }

.classic-modern-pressure-value {
  fill: var(--classic-modern-text);
  font-size: 18px;
  font-weight: 300;
  text-anchor: middle;
  letter-spacing: 0.2px;
  font-family: var(--paper-font-body1_-_font-family, sans-serif);
}

.classic-modern-pressure-unit {
  fill: var(--classic-modern-muted);
  font-size: 11px;
  font-weight: 500;
  text-anchor: middle;
  font-family: var(--paper-font-body1_-_font-family, sans-serif);
}


`;