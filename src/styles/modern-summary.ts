import { css } from 'lit';

export default css`
  .modern-summary {
    padding: 20px;
  }

  .modern-summary-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .modern-summary-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--baro-text);
  }

  .modern-summary-weather {
    font-size: 13px;
    color: var(--baro-muted);
  }

  .modern-summary-value {
    margin-top: 18px;
    font-size: 42px;
    font-weight: 700;
    line-height: 1;
    color: var(--baro-text);
  }

  .modern-summary-unit {
    margin-left: 5px;
    font-size: 15px;
    font-weight: 500;
    color: var(--baro-muted);
  }

  .modern-summary-chart {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 90px;
    margin-top: 20px;
    border-top: 1px solid var(--baro-line);
    color: var(--baro-muted);
    font-size: 13px;
  }
`;