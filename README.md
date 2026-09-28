# Atmos Weather Dashboard

A responsive weather dashboard built with plain HTML, CSS, and JavaScript. It includes current conditions, a five-day forecast, metric/imperial controls, light/dark themes, city search, and browser geolocation.

## Project structure

```text
weather-dashboard/
├── index.html   # Dashboard markup
├── style.css    # Responsive layout and visual styles
├── script.js    # Weather API and interactive controls
└── README.md    # Setup and usage instructions
```

## Create the project

1. Create a folder named `weather-dashboard`.
2. Create `index.html`, `style.css`, `script.js`, and `README.md` inside it.
3. Add the code from this project to the matching files.

## Get an OpenWeatherMap API key

1. Create a free account at [openweathermap.org](https://openweathermap.org/).
2. Open your account's API keys page and copy your key. Newly created keys can take a little while to become active.

## Add your API key

Open `script.js` and replace the clearly marked placeholder near the top:

```js
const API_KEY = "YOUR_OPENWEATHERMAP_API_KEY";
```

with your key:

```js
const API_KEY = "paste_your_key_here";
```

The dashboard uses OpenWeatherMap's Current Weather, 5 Day / 3 Hour Forecast, and Air Pollution APIs (all covered by the same free key). The preview is sample data until a key is configured. Do not publish a real API key in a public repository; keys included in client-side code are visible to visitors.

## Run the website

Open the project folder in VS Code, then open `index.html` with the Live Server extension. Click **Go Live** in the status bar. You can also open `index.html` directly for the sample preview; browser geolocation typically requires `localhost` or a secure HTTPS page.

## Test it

1. With the API key configured, search for a city such as `Tokyo` or `London`, then press Enter or click **Search**.
2. Try a misspelled city to see the not-found message.
3. Click the location icon and approve the browser's location request to load local weather.
4. Switch between °C and °F, then toggle the theme. The theme preference is saved in the browser.
5. Resize the page or use a phone-sized viewport to check the responsive layout and horizontally scroll the forecast row.

Without an API key, the initial sample dashboard remains visible. Live searches and geolocation show a reminder to configure the key first.