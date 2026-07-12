// weather.js
// Populates the header weather chip. Uses Open-Meteo (free, no API key)
// and browser geolocation with a fallback city if the user declines
// location access or geolocation isn't available.

const WEATHER_FALLBACK = { lat: 40.7128, lon: -74.0060 }; // New York, used if geolocation is unavailable/denied

async function loadWeather(lat, lon) {
  const el = document.getElementById('weatherTemp');
  if (!el) return;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&temperature_unit=fahrenheit`;
    const res = await fetch(url);
    const data = await res.json();
    const temp = Math.round(data.current.temperature_2m);
    el.textContent = `${temp}\u00B0F`;
  } catch (err) {
    console.error('weather fetch failed', err);
    el.textContent = '--';
  }
}

function initWeather() {
  if (!navigator.geolocation) {
    loadWeather(WEATHER_FALLBACK.lat, WEATHER_FALLBACK.lon);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => loadWeather(pos.coords.latitude, pos.coords.longitude),
    () => loadWeather(WEATHER_FALLBACK.lat, WEATHER_FALLBACK.lon),
    { timeout: 5000 }
  );
}

document.addEventListener('DOMContentLoaded', initWeather);
