import { css } from 'lit';

export default css`

.label {
  text-anchor: middle;
  fill: var(--primary-text-color);
  font-family: sans-serif;
}

.weather-img-svg {
  width: 40px;
  height: 40px;
  display: block;
  margin: -38px auto 0 auto; /* <- remonte un peu l’icône */
  filter: var(--ha-card-icon-filter);  /* s’adapte au thème */
}

:host([data-theme="dark"]) ha-icon {
  color: #ffc107;      /* exemple = jaune doré dans le thème sombre */
}

`;