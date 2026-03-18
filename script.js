const NYC = { latitude: 40.7128, longitude: -74.0060 };

const elements = {
  temp: document.getElementById('temp'),
  humidity: document.getElementById('humidity'),
  conditions: document.getElementById('conditions'),
  wind: document.getElementById('wind'),
  precip: document.getElementById('precip'),
  aqi: document.getElementById('aqi'),
  recommendations: document.getElementById('recommendations'),
  alerts: document.getElementById('alerts'),
  refreshBtn: document.getElementById('refreshBtn'),
};

async function fetchNYCWeather() {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${NYC.latitude}&longitude=${NYC.longitude}&current_weather=true&hourly=relativehumidity_2m,precipitation_probability`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather service unavailable');
  return res.json();
}

async function fetchNYCAirQuality() {
  const aqURL = `https://api.openaq.org/v2/latest?coordinates=${NYC.latitude},${NYC.longitude}&radius=10000&limit=3`;
  const res = await fetch(aqURL);
  if (!res.ok) throw new Error('Air quality service unavailable');
  return res.json();
}

function parseAQI(data) {
  if (!data.results || !data.results.length) return null;
  const measures = data.results.flatMap(r => r.measurements || []);
  const pm25 = measures.find(m => m.parameter === 'pm25');
  if (!pm25) return null;
  return pm25.value;
}

function weatherCodeToText(code) {
  const map = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    80: 'Rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    95: 'Thunderstorm',
    99: 'Hail',
  };
  return map[code] || 'Unknown';
}

function getSkincareRecommendations({ tempC, humidity, precipProb, pm25 }) {
  const recs = [];

  if (tempC >= 28) {
    recs.push({
      title: 'Warm weather hydration',
      text: 'Use lightweight gel or fluid moisturizers, consider a mattifying sunscreen (SPF 30+) and retinol only at night to avoid sun sensitivity.'
    });
    recs.push({
      title: 'Sweat-proof formula',
      text: 'Choose oil-free, non-comedogenic formulations and blot max shine midday; avoid heavy layers that trap dirt.'
    });
  } else if (tempC <= 5) {
    recs.push({
      title: 'Cold-weather barrier repair',
      text: 'Use ceramide-rich creams, nourishing balms and weekly overnight masks to reduce flaking and windburn risk.'
    });
    recs.push({
      title: 'Hydrating layering',
      text: 'Start with a hydrating toner, then thicker cream and finish with lip and hand balm. Keep humidifier on at home.'
    });
  } else {
    recs.push({
      title: 'Moderate climate routine',
      text: 'Daily cleanser + antioxidant serum + SPF is prime. Remove makeup fully and add a light face oil at dusk if needed.'
    });
  }

  if (humidity !== null) {
    if (humidity < 30) {
      recs.push({
        title: 'Low humidity strategy',
        text: 'Humectants like HA + glycerin boost water retention; seal with occlusives (squalane, petrolatum) at night.'
      });
    } else if (humidity > 70) {
      recs.push({
        title: 'High humidity defense',
        text: 'Use breathable moisturizers, avoid heavy creams, and use a mattifying primer to keep pores clear.'
      });
    } else {
      recs.push({
        title: 'Balanced humidity care',
        text: 'Keep a consistent routine and focus on barrier health, not overloading active treatments.'
      });
    }
  }

  if (pm25 !== null) {
    if (pm25 > 35) {
      recs.push({
        title: 'Air pollution protection',
        text: 'Use antioxidant serums (vitamin C, E, niacinamide), double cleanse at night, and barrier-strengthening ceramides.
Add weekly clay mask to remove impurities.'
      });
    } else {
      recs.push({
        title: 'Clean air maintenance',
        text: 'Keep up with gentle cleansing + SPF, and use light protective products to preserve barrier function.'
      });
    }
  }

  if (precipProb >= 60) {
    recs.push({
      title: 'Wet weather shield',
      text: 'Choose water-resistant sunscreen, a breathable rainproof primer, and lock in moisture while avoiding heavy greasiness.'
    });
  }

  return recs;
}

function getSkincareTopics() {
  return [
    {
      title: 'Importance of barrier function',
      text: 'A strong skin barrier reduces irritation, loss of moisture and pollution damage. Look for ceramides, niacinamide, and fatty acids.',
      img: 'https://images.unsplash.com/photo-1597951123458-5a3f9018d4f7?auto=format&fit=crop&w=400&q=80'
    },
    {
      title: 'Antioxidants & pollution',
      text: 'PM2.5 particles promote free radical stress. Vitamin C, E, and green tea help neutralize oxidative damage before it ages skin.',
      img: 'https://images.unsplash.com/photo-1570703340372-87b3f9cee9f1?auto=format&fit=crop&w=400&q=80'
    },
    {
      title: 'Humectants vs occlusives',
      text: 'Humectants attract water (HA, glycerin), occlusives seal it (squalane, petrolatum). Combine both in dry air setting for best hydration.',
      img: 'https://images.unsplash.com/photo-1617116438612-16f94f4d491f?auto=format&fit=crop&w=400&q=80'
    }
  ];
}

function displayError(message) {
  elements.alerts.innerHTML = `<div class="alert alert-warning" role="alert">${message}</div>`;
}

function clearError() {
  elements.alerts.innerHTML = '';
}

function displayWeather({ temp, humidity, weatherDesc, windspeed, precipProb, pm25 }) {
  elements.temp.textContent = `${temp.toFixed(1)}°C`;
  elements.humidity.textContent = humidity === null ? 'N/A' : `${humidity.toFixed(0)}%`;
  elements.conditions.textContent = weatherDesc;
  elements.wind.textContent = `${windspeed.toFixed(1)} m/s`;
  elements.precip.textContent = `${precipProb.toFixed(0)}%`;
  elements.aqi.textContent = pm25 === null ? 'N/A' : `${pm25.toFixed(1)} µg/m³`;
}

function displayRecommendations(recs) {
  elements.recommendations.innerHTML = '';
  recs.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.innerHTML = `<strong>${item.title}</strong><br>${item.text}`;
    elements.recommendations.appendChild(li);
  });
}

function displayTopics(topics) {
  const topicsEl = document.getElementById('topics');
  topicsEl.innerHTML = '';
  topics.forEach((topic) => {
    const col = document.createElement('div');
    col.className = 'col-12 topic-card p-2';
    col.innerHTML = `
      <img src="${topic.img}" alt="${topic.title}" loading="lazy">
      <h6>${topic.title}</h6>
      <p>${topic.text}</p>
    `;
    topicsEl.appendChild(col);
  });
}

async function refreshData() {
  try {
    clearError();
    elements.refreshBtn.disabled = true;
    elements.refreshBtn.textContent = 'Loading...';

    const [weatherData, airData] = await Promise.all([fetchNYCWeather(), fetchNYCAirQuality()]);

    const current = weatherData.current_weather || {};
    const humidityIndex = weatherData.hourly.time.indexOf(current.time);
    const humidity = humidityIndex >= 0 ? weatherData.hourly.relativehumidity_2m[humidityIndex] : null;
    const precipProb = humidityIndex >= 0 ? weatherData.hourly.precipitation_probability[humidityIndex] : 0;

    const pm25 = parseAQI(airData);

    displayWeather({
      temp: current.temperature,
      humidity,
      weatherDesc: weatherCodeToText(current.weathercode),
      windspeed: current.windspeed,
      precipProb: precipProb || 0,
      pm25,
    });

    const recommendations = getSkincareRecommendations({
      tempC: current.temperature,
      humidity,
      precipProb: precipProb || 0,
      pm25,
    });

    displayRecommendations(recommendations);
    displayTopics(getSkincareTopics());
  } catch (err) {
    displayError('Could not load live data yet. ' + err.message);
  } finally {
    elements.refreshBtn.disabled = false;
    elements.refreshBtn.textContent = 'Refresh Data';
  }
}

elements.refreshBtn.addEventListener('click', refreshData);

window.addEventListener('DOMContentLoaded', refreshData);
