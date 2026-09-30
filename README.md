# Apple Weather Card

A compact Home Assistant custom card inspired by the Apple Weather widget, powered by a Home Assistant weather entity such as an AccuWeather weather integration.

## Features

- Apple-style rounded blue glass panel
- Current temperature and summary
- Hourly forecast strip
- Multi-day forecast with range bars
- Works with AccuWeather weather entities in Home Assistant
- HACS-friendly structure

## Installation

1. Add this repository as a custom repository in HACS.
2. Search for `Apple Weather Card` and install it.
3. In Home Assistant Lovelace, add a manual card using:

```yaml
type: custom:apple-weather-card
entity: weather.home
```

Optional custom naming:

```yaml
type: custom:apple-weather-card
entity: weather.home
name: West Jordan
```

## Data source

This card expects a standard Home Assistant weather entity. If you are using the AccuWeather integration, the card will read the entity's current conditions and forecast data automatically.

## Notes

- The card uses the built-in HA Material Design icons.
- It is designed to closely match the reference Apple Weather widget, while staying compatible with standard weather entities.
