import { css } from 'lit';

export default css`
  .modern-summary {
    padding: 14px 16px 12px;
  }

  .modern-summary-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .modern-summary-title {
    font-size: 14px;
    font-weight: 600;
  }

  .modern-summary-weather {
    font-size: 12px;
    color: var(--baro-muted);
    white-space: nowrap;
  }

  .modern-summary-value {
    margin-top: 6px;
    font-size: 20px;
    font-weight: 700;
    line-height: 1.1;
  }

  .modern-summary-chart {
    height: 110px;
    margin-top: 14px;
  }

  .modern-summary-svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .modern-summary-grid {
    stroke: var(--summary-grid, var(--baro-line));
    stroke-width: 1;
  }

  .modern-summary-curve {
    fill: none;
    stroke: var(--primary-color);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .modern-summary-point {
    fill: var(--primary-color);
    stroke: var(--baro-bg);
    stroke-width: 2;
  }

  .modern-summary-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--baro-muted);
    font-size: 13px;
  }

  .modern-summary-range {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
    color: var(--baro-muted);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  .modern-summary-axis-label {
    fill: var(--summary-muted, var(--baro-muted));
    font-size: 9px;
    font-family: sans-serif;
  }


`;