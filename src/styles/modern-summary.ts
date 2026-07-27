import { css } from 'lit';

export default css`
  .modern-summary-chart {
    height: 90px;
    margin-top: 20px;
  }

  .modern-summary-svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .modern-summary-grid {
    fill: none;
    stroke: var(--baro-line);
    stroke-width: 1;
    stroke-dasharray: 4 5;
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

`;