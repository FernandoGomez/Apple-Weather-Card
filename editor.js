class AppleWeatherCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config || {};
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  _render() {
    const entityOptions = this._hass
      ? Object.keys(this._hass.states)
        .filter((key) => key.startsWith('weather.'))
        .map((key) => `<option value="${key}" ${this._config.entity === key ? 'selected' : ''}>${key}</option>`)
        .join('')
      : '<option value="">Loading weather entities...</option>';

    this.innerHTML = `
      <div class="card-config">
        <label>
          Weather entity
          <select id="entity">
            ${entityOptions}
          </select>
        </label>

        <label>
          Card name
          <input id="name" type="text" value="${this._config.name || ''}" placeholder="Optional custom location name" />
        </label>
      </div>
      <style>
        .card-config {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 12px 14px 4px;
          color: var(--primary-text-color, #fff);
        }

        label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        select, input {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 10px;
          color: var(--primary-text-color, #fff);
          padding: 10px 12px;
          font: inherit;
        }
      </style>
    `;

    this.querySelector('#entity')?.addEventListener('change', (ev) => {
      this._config.entity = ev.target.value;
      this._fire();
    });

    this.querySelector('#name')?.addEventListener('input', (ev) => {
      this._config.name = ev.target.value || null;
      this._fire();
    });
  }

  _fire() {
    const event = new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }
}

if (!customElements.get('apple-weather-card-editor')) {
  customElements.define('apple-weather-card-editor', AppleWeatherCardEditor);
}
