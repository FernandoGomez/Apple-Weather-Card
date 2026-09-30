class AppleWeatherCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._config = {
      entity: 'weather.home',
      name: null,
      accent: '#F7D96F',
      text_color: '#F3F8FF'
    };
  }

  setConfig(config) {
    if (!config || !config.entity) {
      throw new Error('You need to define an entity for apple-weather-card');
    }

    this._config = {
      ...this._config,
      ...config,
      entity: config.entity
    };
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 7;
  }

  _render() {
    if (!this._hass || !this._config.entity) {
      return;
    }

    const stateObj = this._hass.states[this._config.entity];
    if (!stateObj) {
      this.shadowRoot.innerHTML = '<div class="card-error">Weather entity not found</div>';
      return;
    }

    const currentTemp = this._readNumber(stateObj.attributes.temperature, Number.parseFloat(stateObj.state));
    const feelsLike = this._readNumber(
      stateObj.attributes.feels_like_temperature,
      stateObj.attributes.apparent_temperature,
      stateObj.attributes.real_feel_temperature,
      stateObj.attributes.feels_like,
      stateObj.attributes.realfeel,
      stateObj.attributes.real_feel,
      stateObj.attributes.temperature_feels_like,
      stateObj.attributes.feels_like_temp
    );
    const condition = stateObj.state || stateObj.attributes.condition || 'sunny';
    const dayForecast = this._getDailyForecast(stateObj);
    const hourlyForecast = this._getHourlyForecast(stateObj);
    const location = this._config.name || stateObj.attributes.friendly_name || stateObj.entity_id.replace('weather.', '').replace(/_/g, ' ');
    const summary = this._conditionLabel(condition);
    const low = dayForecast[0]?.low ?? Math.round(currentTemp - 5);
    const high = dayForecast[0]?.high ?? Math.round(currentTemp + 5);

    const css = `
      :host {
        display: block;
        --card-blue-1: #1e77ca;
        --card-blue-2: #2f8cd9;
        --card-blue-3: #4d9ce5;
        --card-border: rgba(255,255,255,0.14);
        --card-text: #f5faff;
        --card-muted: rgba(245,250,255,0.8);
        --card-alt: #f4d35e;
        --card-warm: #f0bd59;
        --card-shadow: rgba(19, 60, 112, 0.18);
      }

      * { box-sizing: border-box; }

      .weather-card {
        width: 100%;
        min-height: 420px;
        border-radius: 30px;
        background: linear-gradient(180deg, var(--card-blue-2) 0%, var(--card-blue-1) 100%);
        box-shadow: inset 0 0 0 1px var(--card-border), 0 12px 22px var(--card-shadow);
        padding: 16px 16px 12px;
        color: var(--card-text);
        overflow: hidden;
      }

      .top-row {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 8px;
      }

      .location {
        font-size: clamp(1.35rem, 2.2vw, 2.8rem);
        line-height: 0.92;
        font-weight: 700;
        letter-spacing: -0.06em;
        margin-bottom: 4px;
        color: rgba(255,255,255,0.96);
      }

      .temperature-wrap {
        display: flex;
        align-items: flex-end;
        gap: 12px;
        margin-top: 0;
        height: clamp(4rem, 8vw, 7.1rem);
      }

      .temperature {
        font-size: clamp(4rem, 8vw, 7.1rem);
        line-height: 0.76;
        font-weight: 700;
        letter-spacing: -0.1em;
        margin: 0;
        color: rgba(255,255,255,0.95);
        display: flex;
        align-items: flex-end;
        height: 100%;
      }

      .feels-like {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-end;
        gap: 2px;
        height: 100%;
        padding-bottom: 4px;
        line-height: 1;
        color: rgba(255,255,255,0.82);
      }

      .feels-like-label {
        font-size: 0.7rem;
        letter-spacing: 0.04em;
        text-transform: none;
        font-weight: 600;
        opacity: 0.9;
        line-height: 1.1;
      }

      .feels-like-value {
        font-size: 1.2rem;
        letter-spacing: -0.05em;
        font-weight: 700;
        color: rgba(255,255,255,0.96);
        line-height: 1;
      }

      .status {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
        min-width: 116px;
        padding-bottom: 6px;
      }

      .status-icon {
        width: 42px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .status-icon ha-icon {
        --mdc-icon-size: 38px;
        color: var(--card-alt);
        filter: drop-shadow(0 1px 0 rgba(0,0,0,0.04));
      }

      .status-label {
        font-size: clamp(1.05rem, 1.5vw, 1.7rem);
        line-height: 1.1;
        font-weight: 700;
        letter-spacing: -0.05em;
        color: var(--card-text);
        text-align: right;
      }

      .extremes {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 0.96rem;
        color: rgba(255,255,255,0.92);
      }

      .divider {
        width: 100%;
        height: 1px;
        background: rgba(255,255,255,0.3);
        margin: 12px 0 14px;
      }

      .hourly {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 4px;
        margin-bottom: 16px;
      }

      .hour {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        min-height: 104px;
        padding: 2px 0;
      }

      .hour-label {
        font-size: 0.92rem;
        letter-spacing: 0.02em;
        color: rgba(255,255,255,0.85);
        font-weight: 600;
      }

      .hour-icon {
        margin: 8px 0 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .hour-icon ha-icon {
        --mdc-icon-size: 24px;
        color: var(--card-alt);
      }

      .hour-temp {
        font-size: 1.12rem;
        line-height: 1;
        font-weight: 700;
        letter-spacing: -0.05em;
      }

      .day-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .day-row {
        display: grid;
        grid-template-columns: 52px 28px 1fr 38px;
        gap: 10px;
        align-items: center;
        min-height: 32px;
      }

      .day-name {
        font-size: 1.18rem;
        font-weight: 700;
        letter-spacing: -0.04em;
        color: rgba(255,255,255,0.96);
      }

      .day-icon {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .day-icon ha-icon {
        --mdc-icon-size: 22px;
        color: var(--card-alt);
      }

      .range-wrap {
        position: relative;
        height: 8px;
        border-radius: 999px;
        background: rgba(255,255,255,0.18);
        overflow: hidden;
      }

      .range-fill {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        border-radius: 999px;
        background: linear-gradient(90deg, rgba(255,255,255,0.7), rgba(251, 212, 114, 0.96));
        box-shadow: 0 0 0 1px rgba(255,255,255,0.08);
      }

      .day-temp {
        text-align: right;
        font-size: 1.15rem;
        font-weight: 700;
        letter-spacing: -0.04em;
      }

      .card-error {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        color: white;
        font-weight: 700;
        background: linear-gradient(180deg, #2c7ed2, #3a8ce0);
        border-radius: 20px;
      }

      @media (max-width: 420px) {
        .weather-card {
          padding: 16px 14px 12px;
        }

        .status {
          min-width: 94px;
        }
      }
    `;

    const summaryLabel = this._conditionLabel(condition);
    const hourlyMarkup = hourlyForecast.length ? hourlyForecast.map((entry) => `
      <div class="hour">
        <div class="hour-label">${entry.label}</div>
        <div class="hour-icon">${this._iconSvg(entry.condition || condition, 24)}</div>
        <div class="hour-temp">${entry.temp}°</div>
      </div>
    `).join('') : '';

    const dayMarkup = dayForecast.length ? dayForecast.map((day) => {
      const rangeMin = Math.min(...dayForecast.map((entry) => entry.low));
      const rangeMax = Math.max(...dayForecast.map((entry) => entry.high));
      const safeSpan = Math.max(1, rangeMax - rangeMin);
      const width = ((day.high - rangeMin) / safeSpan) * 100;
      const left = ((day.low - rangeMin) / safeSpan) * 100;
      const fillWidth = Math.max(18, width - left + 12);

      return `
        <div class="day-row">
          <div class="day-name">${day.label}</div>
          <div class="day-icon">${this._iconSvg(day.condition || condition, 22)}</div>
          <div class="range-wrap">
            <div class="range-fill" style="left:${Math.max(0, left)}%; width:${Math.min(100, fillWidth)}%;"></div>
          </div>
          <div class="day-temp">${day.high}°</div>
        </div>
      `;
    }).join('') : '';

    this.shadowRoot.innerHTML = `
      <style>${css}</style>
      <div class="weather-card">
        <div class="top-row">
          <div>
            <div class="location">${location}</div>
            <div class="temperature-wrap">
              <div class="temperature">${Math.round(currentTemp)}°</div>
              <div class="feels-like">
                <div class="feels-like-label">Feels like</div>
                <div class="feels-like-value">${feelsLike !== null ? `${Math.round(feelsLike)}°` : `${Math.round(currentTemp)}°`}</div>
              </div>
            </div>
          </div>
          <div class="status">
            <div class="status-icon">${this._iconSvg(condition, 38)}</div>
            <div class="status-label">${summaryLabel}</div>
            <div class="extremes">H:${Math.round(high)}° L:${Math.round(low)}°</div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="hourly">
          ${hourlyMarkup}
        </div>

        <div class="day-list">
          ${dayMarkup}
        </div>
      </div>
    `;
  }

  _getDailyForecast(stateObj) {
    const entries = Array.isArray(stateObj.attributes.forecast) ? stateObj.attributes.forecast.slice(0, 5) : [];

    return entries.map((entry, index) => {
      const date = new Date(entry.datetime || entry.date || Date.now() + index * 86400000);
      const low = this._readNumber(entry.temperature_low, entry.low, entry.templow, entry.min_temp);
      const high = this._readNumber(entry.temperature_high, entry.high, entry.temperature, entry.max_temp);

      return {
        label: this._dayLabel(date),
        low: Math.round(low ?? 0),
        high: Math.round(high ?? 0),
        condition: entry.condition || stateObj.state || 'sunny'
      };
    });
  }

  _getHourlyForecast(stateObj) {
    const forecast = stateObj.attributes.forecast_hourly || stateObj.attributes.hourly || stateObj.attributes.forecast || [];
    const normalized = Array.isArray(forecast) ? forecast.slice(0, 5) : [];

    return normalized.map((entry, index) => {
      const date = new Date(entry.datetime || entry.date || Date.now() + index * 3600000);
      const temp = this._readNumber(entry.temperature, entry.temp, entry.value);
      return {
        label: this._hourLabel(date),
        temp: Math.round(temp ?? 0),
        condition: entry.condition || stateObj.state || 'sunny'
      };
    });
  }

  _readNumber(...values) {
    for (const value of values) {
      if (value === null || value === undefined || Number.isNaN(Number(value))) {
        continue;
      }
      return Number(value);
    }
    return null;
  }

  _iconSvg(condition, size = 32) {
    const normalized = (condition || '').toString().toLowerCase();
    const base = `width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"`;

    const sunny = `
      <svg ${base} class="weather-svg" style="display:block; overflow:visible;">
        <circle cx="32" cy="32" r="11" fill="#F4D35E"/>
        <g stroke="#F4D35E" stroke-width="3" stroke-linecap="round">
          <line x1="32" y1="5" x2="32" y2="15"/>
          <line x1="32" y1="49" x2="32" y2="59"/>
          <line x1="5" y1="32" x2="15" y2="32"/>
          <line x1="49" y1="32" x2="59" y2="32"/>
          <line x1="13" y1="13" x2="19" y2="19"/>
          <line x1="45" y1="45" x2="51" y2="51"/>
          <line x1="13" y1="51" x2="19" y2="45"/>
          <line x1="45" y1="19" x2="51" y2="13"/>
        </g>
      </svg>
    `;

    const cloudy = `
      <svg ${base} class="weather-svg" style="display:block; overflow:visible;">
        <g fill="#EAF2FF">
          <ellipse cx="22" cy="40" rx="14" ry="10"/>
          <ellipse cx="36" cy="33" rx="18" ry="12"/>
          <ellipse cx="46" cy="40" rx="11" ry="8"/>
          <ellipse cx="14" cy="35" rx="9" ry="7"/>
        </g>
      </svg>
    `;

    const partly = `
      <svg ${base} class="weather-svg" style="display:block; overflow:visible;">
        <circle cx="22" cy="24" r="8.5" fill="#F4D35E"/>
        <g stroke="#F4D35E" stroke-width="2.5" stroke-linecap="round">
          <line x1="22" y1="9" x2="22" y2="15"/>
          <line x1="22" y1="33" x2="22" y2="39"/>
          <line x1="7" y1="24" x2="13" y2="24"/>
          <line x1="31" y1="24" x2="37" y2="24"/>
          <line x1="10.5" y1="10.5" x2="14.2" y2="14.2"/>
          <line x1="29.8" y1="29.8" x2="33.5" y2="33.5"/>
          <line x1="10.5" y1="37.5" x2="14.2" y2="33.8"/>
          <line x1="29.8" y1="14.2" x2="33.5" y2="10.5"/>
        </g>
        <g fill="#EAF2FF">
          <ellipse cx="31" cy="40" rx="16" ry="10"/>
          <ellipse cx="45" cy="34" rx="13" ry="9"/>
          <ellipse cx="51" cy="40" rx="7" ry="6"/>
        </g>
      </svg>
    `;

    const rain = `
      <svg ${base} class="weather-svg" style="display:block; overflow:visible;">
        <g fill="#EAF2FF">
          <ellipse cx="22" cy="40" rx="14" ry="10"/>
          <ellipse cx="36" cy="33" rx="18" ry="12"/>
          <ellipse cx="46" cy="40" rx="11" ry="8"/>
          <ellipse cx="14" cy="35" rx="9" ry="7"/>
        </g>
        <g stroke="#7BB9FF" stroke-width="3" stroke-linecap="round">
          <line x1="20" y1="47" x2="17" y2="56"/>
          <line x1="32" y1="47" x2="29" y2="56"/>
          <line x1="43" y1="47" x2="40" y2="56"/>
        </g>
      </svg>
    `;

    const storm = `
      <svg ${base} class="weather-svg" style="display:block; overflow:visible;">
        <g fill="#EAF2FF">
          <ellipse cx="22" cy="40" rx="14" ry="10"/>
          <ellipse cx="36" cy="33" rx="18" ry="12"/>
          <ellipse cx="46" cy="40" rx="11" ry="8"/>
          <ellipse cx="14" cy="35" rx="9" ry="7"/>
        </g>
        <path d="M35 18 L26 32 H35 L29 45 L44 26 H36 L44 18 Z" fill="#F4D35E"/>
      </svg>
    `;

    const snow = `
      <svg ${base} class="weather-svg" style="display:block; overflow:visible;">
        <g fill="#EAF2FF">
          <ellipse cx="22" cy="40" rx="14" ry="10"/>
          <ellipse cx="36" cy="33" rx="18" ry="12"/>
          <ellipse cx="46" cy="40" rx="11" ry="8"/>
          <ellipse cx="14" cy="35" rx="9" ry="7"/>
        </g>
        <g stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round">
          <line x1="22" y1="47" x2="22" y2="55"/>
          <line x1="18" y1="50" x2="26" y2="52"/>
          <line x1="26" y1="50" x2="18" y2="52"/>
          <line x1="36" y1="47" x2="36" y2="55"/>
          <line x1="32" y1="50" x2="40" y2="52"/>
          <line x1="40" y1="50" x2="32" y2="52"/>
        </g>
      </svg>
    `;

    const wind = `
      <svg ${base} class="weather-svg" style="display:block; overflow:visible;">
        <path d="M9 22 H42 C48 22, 48 16, 42 16 H37" stroke="#EAF2FF" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M9 32 H48 C54 32, 54 26, 48 26 H43" stroke="#EAF2FF" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M12 42 H51 C57 42, 57 36, 51 36 H46" stroke="#EAF2FF" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M36 14 L39 21 L45 24 L39 27 L36 34 L33 27 L27 24 L33 21 Z" fill="#F4D35E"/>
      </svg>
    `;

    const map = {
      sunny,
      clear: sunny,
      'clear-night': `
        <svg ${base} class="weather-svg" style="display:block; overflow:visible;">
          <circle cx="32" cy="28" r="11" fill="#EAF2FF"/>
          <circle cx="39" cy="21" r="2.5" fill="#EAF2FF"/>
          <path d="M17 42 C24 36, 40 36, 47 42" stroke="#EAF2FF" stroke-width="3" fill="none" stroke-linecap="round"/>
        </svg>
      `,
      partlycloudy: partly,
      partly_cloudy: partly,
      cloudy,
      fog: cloudy,
      rain,
      rainy: rain,
      storm,
      lightning: storm,
      snow,
      windy: wind
    };

    return map[normalized] || cloudy;
  }

  _conditionLabel(condition) {
    const normalized = (condition || '').toString().toLowerCase();
    const labels = {
      sunny: 'Sunny',
      clear: 'Clear',
      'clear-night': 'Clear',
      partlycloudy: 'Partly Cloudy',
      partly_cloudy: 'Partly Cloudy',
      cloudy: 'Cloudy',
      fog: 'Foggy',
      rain: 'Rain',
      rainy: 'Rain',
      storm: 'Storm',
      lightning: 'Storm',
      snow: 'Snow',
      windy: 'Windy'
    };
    return labels[normalized] || normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  _dayLabel(date) {
    return date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3);
  }

  _hourLabel(date) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric' }).replace(':00', '').replace(' AM', ' AM').replace(' PM', ' PM');
  }
}

if (!window.customCards) {
  window.customCards = [];
}

window.customCards.push({
  type: 'apple-weather-card',
  name: 'Apple Weather Card',
  description: 'A compact Apple-style weather card powered by Home Assistant weather entities, including AccuWeather forecast data.',
  preview: false,
  documentationURL: 'https://www.home-assistant.io/integrations/weather/'
});

if (!customElements.get('apple-weather-card')) {
  customElements.define('apple-weather-card', AppleWeatherCard);
}
