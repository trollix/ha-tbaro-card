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



 .modern-summary-axis-label {
  fill: var(--summary-muted, var(--baro-muted));
  font-size: 14spx;
  font-family: sans-serif;
}


.modern-summary-x-axis {
  stroke: var(--summary-axis, var(--baro-muted));
  stroke-width: 0.6;
  opacity: 0.7;
}

.modern-summary-x-tick {
  stroke: var(--summary-axis, var(--baro-muted));
  stroke-width: 0.8;
  opacity: 0.8;
}

.modern-summary-time-label {
  fill: var(--summary-muted, var(--baro-muted));
  font-size: 15px;
  font-family: sans-serif;
}

.modern-summary-header-right {
  text-align: right;
}

.modern-summary-trend {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.1;
  white-space: nowrap;
}

.modern-summary-trend-period {
  margin-top: 2px;
  font-size: 11px;
  color: var(--baro-muted);
}

.modern-summary-weather {
  margin-top: 5px;
  font-size: 12px;
  color: var(--baro-muted);
  white-space: nowrap;
}

.modern-summary-trend-up {
  color: var(--success-color, #43a047);
}

.modern-summary-trend-down {
  color: var(--error-color, #db4437);
}

.modern-summary-header-right {
  text-align: right;
  transform: translateY(24px);
}

`;