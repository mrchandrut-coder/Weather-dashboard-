// Replace this value with your OpenWeatherMap API key to enable live weather.
const API_KEY = "cb5cb3cbebbf98a762063e16313185ca";
const API_BASE = "https://api.openweathermap.org/data/2.5";
const ICON_BASE = "https://openweathermap.org/img/wn";

const demoWeather = {
  name: "San Francisco",
  sys: { country: "US", sunrise: 1759067580, sunset: 1759112640 },
  timezone: -25200,
  dt: Math.floor(Date.now() / 1000),
  main: { temp: 19, feels_like: 18, humidity: 64, pressure: 1015 },
  weather: [{ description: "partly cloudy", icon: "02d" }],
  wind: { speed: 4.1 },
  clouds: { all: 28 },
  visibility: 10000
};

const demoAir = {
  list: [{ main: { aqi: 2 }, components: { pm2_5: 8.4, pm10: 14.1 } }]
};

const demoForecast = {
  city: { timezone: -25200 },
  list: Array.from({ length: 5 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + index);
    date.setUTCHours(12, 0, 0, 0);
    return {
      dt: Math.floor(date.getTime() / 1000),
      dt_txt: `${date.toISOString().slice(0, 10)} 12:00:00`,
      main: { temp: 18 + (index % 3), temp_min: 14 + (index % 2), temp_max: 20 + (index % 3) },
      weather: [{ description: ["clear sky", "few clouds", "scattered clouds", "light rain", "clear sky"][index], icon: ["01d", "02d", "03d", "10d", "01d"][index] }],
      pop: [0.05, 0.12, 0.08, 0.62, 0.03][index]
    };
  })
};

const elements = {
  form: document.querySelector("#search-form"),
  search: document.querySelector("#city-search"),
  location: document.querySelector("#location-button"),
  theme: document.querySelector("#theme-button"),
  date: document.querySelector("#current-date"),
  localTime: document.querySelector("#local-time"),
  city: document.querySelector("#city-name"),
  country: document.querySelector("#country-name"),
  temperature: document.querySelector("#current-temperature"),
  condition: document.querySelector("#current-condition"),
  icon: document.querySelector("#current-icon"),
  feelsLike: document.querySelector("#feels-like"),
  detailFeels: document.querySelector("#detail-feels"),
  humidity: document.querySelector("#humidity"),
  wind: document.querySelector("#wind-speed"),
  cloudiness: document.querySelector("#cloudiness"),
  pressure: document.querySelector("#pressure"),
  visibility: document.querySelector("#visibility"),
  sunrise: document.querySelector("#sunrise"),
  sunset: document.querySelector("#sunset"),
  aqiValue: document.querySelector("#aqi-value"),
  aqiLabel: document.querySelector("#aqi-label"),
  aqiMarker: document.querySelector("#aqi-marker"),
  aqiNote: document.querySelector("#aqi-note"),
  forecast: document.querySelector("#forecast-grid"),
  notice: document.querySelector("#demo-notice"),
  dismissNotice: document.querySelector("#dismiss-notice"),
  error: document.querySelector("#error-message"),
  loading: document.querySelector("#loading-overlay"),
  unitButtons: document.querySelectorAll(".unit-button")
};

let currentWeather = demoWeather;
let currentForecast = demoForecast;
let currentAir = demoAir;
let selectedUnit = "c";
let requestSequence = 0;

function temperature(value) {
  const converted = selectedUnit === "f" ? value * 9 / 5 + 32 : value;
  return `${Math.round(converted)}°`;
}

function getWind(speed) {
  if (selectedUnit === "f") return `${Math.round(speed * 2.23694)}<small> mph</small>`;
  return `${Math.round(speed * 3.6)}<small> km/h</small>`;
}

function getDistance(meters) {
  if (selectedUnit === "f") return `${(meters / 1609.344).toFixed(1)}<small> mi</small>`;
  return `${(meters / 1000).toFixed(1)}<small> km</small>`;
}

function localDate(timestamp, offsetSeconds, options) {
  const localTime = new Date((timestamp + offsetSeconds) * 1000);
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...options }).format(localTime);
}

function iconUrl(icon, size = "2x") {
  return `${ICON_BASE}/${icon || "01d"}@${size}.png`;
}

function renderCurrent(weather, forecast, air = currentAir) {
  const condition = weather.weather?.[0]?.description || "Weather unavailable";
  const offset = weather.timezone || 0;
  const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
  const country = weather.sys?.country ? countryNames.of(weather.sys.country) : "";
  const placeName = [weather.name, country].filter(Boolean).join(", ");
  const icon = weather.weather?.[0]?.icon || "01d";

  elements.city.textContent = weather.name || "Unknown location";
  elements.country.textContent = placeName;
  elements.temperature.innerHTML = `${temperature(weather.main.temp).replace("°", "")}<span>°</span>`;
  elements.condition.textContent = condition;
  elements.icon.src = iconUrl(icon, "4x");
  elements.icon.alt = condition;
  elements.feelsLike.textContent = temperature(weather.main.feels_like);
  elements.detailFeels.innerHTML = `${temperature(weather.main.feels_like).replace("°", "")}<small>°</small>`;
  elements.humidity.innerHTML = `${weather.main.humidity}<small>%</small>`;
  elements.wind.innerHTML = getWind(weather.wind.speed);
  elements.cloudiness.innerHTML = `${weather.clouds?.all ?? 0}<small>%</small>`;
  elements.pressure.innerHTML = `${weather.main.pressure}<small> hPa</small>`;
  elements.visibility.innerHTML = getDistance(weather.visibility ?? 0);
  elements.sunrise.textContent = localDate(weather.sys.sunrise, offset, { hour: "numeric", minute: "2-digit" });
  elements.sunset.textContent = localDate(weather.sys.sunset, offset, { hour: "numeric", minute: "2-digit" });
  elements.localTime.textContent = localDate(weather.dt, offset, { weekday: "short", hour: "numeric", minute: "2-digit" });
  renderForecast(forecast, offset);
  renderAir(air);
}

const AQI_LEVELS = [
  { label: "Good", color: "#6fdc8c" },
  { label: "Fair", color: "#d7e46a" },
  { label: "Moderate", color: "#ffd166" },
  { label: "Poor", color: "#ff9a5c" },
  { label: "Very poor", color: "#ff6b8b" }
];

function renderAir(air) {
  const entry = air?.list?.[0];
  if (!entry) {
    elements.aqiValue.textContent = "--";
    elements.aqiLabel.textContent = "Unavailable";
    elements.aqiLabel.style.background = "";
    elements.aqiNote.textContent = "Air quality data is unavailable for this location";
    return;
  }
  const aqi = Math.min(Math.max(entry.main.aqi, 1), 5);
  const level = AQI_LEVELS[aqi - 1];
  const { pm2_5 = 0, pm10 = 0 } = entry.components || {};
  elements.aqiValue.textContent = `${aqi}/5`;
  elements.aqiLabel.textContent = level.label;
  elements.aqiLabel.style.background = level.color;
  elements.aqiMarker.style.left = `${(aqi - 0.5) * 20}%`;
  elements.aqiNote.textContent = `PM2.5 ${pm2_5.toFixed(1)} · PM10 ${pm10.toFixed(1)} µg/m³`;
}

function renderForecast(forecast, offset) {
  const groups = new Map();
  for (const entry of forecast.list || []) {
    const dateKey = localDate(entry.dt, offset, { year: "numeric", month: "2-digit", day: "2-digit" });
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey).push(entry);
  }

  const days = [...groups.values()].slice(0, 5);
  elements.forecast.replaceChildren();
  days.forEach((entries, index) => {
    const representative = entries.reduce((closest, entry) => {
      const hour = new Date((entry.dt + offset) * 1000).getUTCHours();
      const closestHour = new Date((closest.dt + offset) * 1000).getUTCHours();
      return Math.abs(hour - 12) < Math.abs(closestHour - 12) ? entry : closest;
    });
    const dayName = index === 0 ? "Today" : localDate(representative.dt, offset, { weekday: "short" });
    const dateLabel = localDate(representative.dt, offset, { month: "short", day: "numeric" });
    const rainChance = Math.round(Math.max(...entries.map((entry) => entry.pop || 0)) * 100);
    const card = document.createElement("article");
    card.className = "forecast-card glass-panel";
    card.innerHTML = `
      <div class="forecast-day">${dayName}<span class="forecast-date">${dateLabel}</span></div>
      <div class="forecast-weather">
        <img src="${iconUrl(representative.weather?.[0]?.icon)}" alt="${representative.weather?.[0]?.description || "Weather"}" loading="lazy">
        <span class="forecast-temp">${temperature(representative.main.temp)}</span>
      </div>
      <p class="forecast-condition">${representative.weather?.[0]?.description || "Forecast"}</p>
      <div class="rain-row"><span>Rain chance</span><span class="rain-value"><span class="rain-drop" aria-hidden="true">↓</span>${rainChance}%</span></div>
      <div class="rain-track" aria-label="${rainChance}% chance of rain"><div class="rain-fill" style="width: ${rainChance}%"></div></div>`;
    elements.forecast.append(card);
  });
}

function setLoading(loading) {
  elements.loading.hidden = !loading;
  elements.form.querySelector(".search-submit").disabled = loading;
  elements.location.disabled = loading;
}

function showError(message) {
  elements.error.textContent = message;
  elements.error.hidden = false;
}

function hideError() {
  elements.error.hidden = true;
  elements.error.textContent = "";
}

// Air quality is a nice-to-have: failures return null so weather still loads.
async function fetchAirQuality(coord) {
  if (!coord) return null;
  try {
    const params = new URLSearchParams({ lat: coord.lat, lon: coord.lon, appid: API_KEY });
    const response = await fetch(`${API_BASE}/air_pollution?${params}`);
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

async function fetchWeather(query) {
  const sequence = ++requestSequence;
  hideError();
  setLoading(true);
  try {
    const params = new URLSearchParams({ ...query, appid: API_KEY, units: "metric" });
    const [weatherResponse, forecastResponse] = await Promise.all([
      fetch(`${API_BASE}/weather?${params}`),
      fetch(`${API_BASE}/forecast?${params}`)
    ]);
    if (sequence !== requestSequence) return;
    if (weatherResponse.status === 404) throw new Error("We couldn't find that city. Check the spelling and try again.");
    if (weatherResponse.status === 401 || forecastResponse.status === 401) throw new Error("Your API key was not accepted. Check the API_KEY value in script.js and try again.");
    if (!weatherResponse.ok || !forecastResponse.ok) throw new Error("Weather data is unavailable right now. Please try again in a moment.");
    const [weather, forecast] = await Promise.all([weatherResponse.json(), forecastResponse.json()]);
    if (sequence !== requestSequence) return;
    const air = await fetchAirQuality(weather.coord);
    if (sequence !== requestSequence) return;
    currentWeather = weather;
    currentForecast = forecast;
    currentAir = air;
    renderCurrent(weather, forecast, air);
    elements.notice.hidden = true;
    hideError();
  } catch (error) {
    if (sequence === requestSequence) showError(error.message || "Something went wrong while loading weather data.");
  } finally {
    if (sequence === requestSequence) setLoading(false);
  }
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = elements.search.value.trim();
  if (!city) {
    showError("Enter a city name to search for its weather.");
    return;
  }
  if (API_KEY === "YOUR_OPENWEATHERMAP_API_KEY") {
    showError("Add your OpenWeatherMap API key to the API_KEY variable in script.js before searching.");
    return;
  }
  fetchWeather({ q: city });
});

elements.location.addEventListener("click", () => {
  hideError();
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by this browser.");
    return;
  }
  if (API_KEY === "YOUR_OPENWEATHERMAP_API_KEY") {
    showError("Add your OpenWeatherMap API key to the API_KEY variable in script.js before using your location.");
    return;
  }
  setLoading(true);
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => fetchWeather({ lat: coords.latitude, lon: coords.longitude }),
    (error) => {
      setLoading(false);
      const messages = {
        1: "Location permission was denied. Allow location access or search for a city instead.",
        2: "Your location could not be determined. Try searching for a city instead.",
        3: "Location request timed out. Please try again."
      };
      showError(messages[error.code] || "Unable to get your location.");
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
  );
});

elements.unitButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedUnit = button.dataset.unit;
    elements.unitButtons.forEach((unitButton) => {
      const active = unitButton === button;
      unitButton.classList.toggle("is-active", active);
      unitButton.setAttribute("aria-pressed", String(active));
    });
    renderCurrent(currentWeather, currentForecast);
  });
});

elements.theme.addEventListener("click", () => {
  const isLight = document.body.classList.toggle("light-mode");
  elements.theme.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
  document.querySelector('meta[name="theme-color"]').content = isLight ? "#eaf1ff" : "#111a3c";
  try { localStorage.setItem("atmos-theme", isLight ? "light" : "dark"); } catch { /* Storage may be unavailable in private browsing. */ }
});

elements.dismissNotice.addEventListener("click", () => { elements.notice.hidden = true; });

function updateDate() {
  elements.date.textContent = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date());
}

try {
  if (localStorage.getItem("atmos-theme") === "light") {
    document.body.classList.add("light-mode");
    elements.theme.setAttribute("aria-label", "Switch to dark mode");
    document.querySelector('meta[name="theme-color"]').content = "#eaf1ff";
  }
} catch { /* Keep the default theme when storage is unavailable. */ }

updateDate();
renderCurrent(currentWeather, currentForecast);