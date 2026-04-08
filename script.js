const NYC = { latitude: 40.7128, longitude: -74.0060 };

const elements = {
  weatherIcon: document.getElementById('weather-icon'),
  weatherTemp: document.getElementById('weather-temp'),
  feelsLike: document.getElementById('feels-like'),
  humidity: document.getElementById('humidity'),
  conditions: document.getElementById('conditions'),
  wind: document.getElementById('wind'),
  precip: document.getElementById('precip'),
  aqi: document.getElementById('aqi'),
  recommendations: document.getElementById('recommendations'),
  alerts: document.getElementById('alerts'),
  refreshBtn: document.getElementById('refreshBtn'),
  weeklyForecast: document.getElementById('weekly-forecast'),
};

async function fetchNYCWeather() {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${NYC.latitude}&longitude=${NYC.longitude}&current_weather=true&hourly=relativehumidity_2m,precipitation_probability&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America/New_York`;
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

function weatherCodeToIcon(code) {
  const map = {
    0: '☀️',
    1: '🌤️',
    2: '⛅',
    3: '☁️',
    45: '🌫️',
    48: '🌁',
    51: '🌦️',
    53: '🌦️',
    55: '🌧️',
    61: '🌧️',
    63: '🌧️',
    65: '⛈️',
    80: '🌦️',
    81: '🌧️',
    82: '⛈️',
    95: '⛈️',
    99: '🌨️',
  };
  return map[code] || '❓';
}

function dayName(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function displayWeeklyForecast(daily) {
  if (!elements.weeklyForecast || !daily) return;
  const { time = [], weathercode = [], temperature_2m_max = [], temperature_2m_min = [], precipitation_probability_max = [] } = daily;
  elements.weeklyForecast.innerHTML = '';

  for (let i = 0; i < Math.min(time.length, 7); i += 1) {
    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <h6>${dayName(time[i])}</h6>
      <div class="icon">${weatherCodeToIcon(weathercode[i])}</div>
      <div>${weatherCodeToText(weathercode[i])}</div>
      <div class="temp-range">${Math.round(temperature_2m_max[i])}° / ${Math.round(temperature_2m_min[i])}°</div>
      <div class="chance">Precip ${Math.round(precipitation_probability_max[i] || 0)}%</div>
    `;
    elements.weeklyForecast.appendChild(card);
  }
}

function getSkincareRecommendations({ tempC, humidity, precipProb, pm25 }) {
  const recs = [];

  if (tempC >= 28) {
    recs.push({
      title: 'Warm weather hydration',
      text: 'Use lightweight gel or fluid moisturizers, consider a mattifying sunscreen (SPF 30+) and retinol only at night to avoid sun sensitivity.',
      questions: ['What is your current moisturizer type?', 'Do you experience increased oiliness in heat?'],
      bestFor: 'Best for oily and combination skin types'
    });
    recs.push({
      title: 'Sweat-proof formula',
      text: 'Choose oil-free, non-comedogenic formulations and blot max shine midday; avoid heavy layers that trap dirt.',
      questions: ['How often do you sweat during the day?', 'Do you have acne-prone skin?'],
      bestFor: 'Best for acne-prone and oily skin'
    });
  } else if (tempC <= 5) {
    recs.push({
      title: 'Cold-weather barrier repair',
      text: 'Use ceramide-rich creams, nourishing balms and weekly overnight masks to reduce flaking and windburn risk.',
      questions: ['Do you experience dry patches in winter?', 'Is your skin sensitive to cold?'],
      bestFor: 'Best for dry and sensitive skin'
    });
    recs.push({
      title: 'Hydrating layering',
      text: 'Start with a hydrating toner, then thicker cream and finish with lip and hand balm. Keep humidifier on at home.',
      questions: ['What layers do you currently use?', 'Do you have access to a humidifier?'],
      bestFor: 'Best for very dry skin types'
    });
  } else {
    recs.push({
      title: 'Moderate climate routine',
      text: 'Daily cleanser + antioxidant serum + SPF is prime. Remove makeup fully and add a light face oil at dusk if needed.',
      questions: ['What is your daily routine like?', 'Do you wear makeup regularly?'],
      bestFor: 'Best for all skin types'
    });
  }

  if (humidity !== null) {
    if (humidity < 30) {
      recs.push({
        title: 'Low humidity strategy',
        text: 'Humectants like HA + glycerin boost water retention; seal with occlusives (squalane, petrolatum) at night.',
        questions: ['Do you live in a dry climate?', 'What humectants have you tried?'],
        bestFor: 'Best for dry skin in arid environments'
      });
    } else if (humidity > 70) {
      recs.push({
        title: 'High humidity defense',
        text: 'Use breathable moisturizers, avoid heavy creams, and use a mattifying primer to keep pores clear.',
        questions: ['Do you experience increased breakouts in humidity?', 'What mattifying products do you use?'],
        bestFor: 'Best for oily skin in humid climates'
      });
    } else {
      recs.push({
        title: 'Balanced humidity care',
        text: 'Keep a consistent routine and focus on barrier health, not overloading active treatments.',
        questions: ['Is your routine consistent?', 'Do you use active ingredients?'],
        bestFor: 'Best for balanced skin types'
      });
    }
  }

  if (pm25 !== null) {
    if (pm25 > 35) {
      recs.push({
        title: 'Air pollution protection',
        text: 'Use antioxidant serums (vitamin C, E, niacinamide), double cleanse at night, and barrier-strengthening ceramides. Add weekly clay mask to remove impurities.',
        questions: ['Do you live in a polluted area?', 'How often do you cleanse?'],
        bestFor: 'Best for urban dwellers with pollution exposure'
      });
    } else {
      recs.push({
        title: 'Clean air maintenance',
        text: 'Keep up with gentle cleansing + SPF, and use light protective products to preserve barrier function.',
        questions: ['What protective products do you use?', 'Is your skin barrier healthy?'],
        bestFor: 'Best for all skin types in clean environments'
      });
    }
  }

  if (precipProb >= 60) {
    recs.push({
      title: 'Wet weather shield',
      text: 'Choose water-resistant sunscreen, a breathable rainproof primer, and lock in moisture while avoiding heavy greasiness.',
      questions: ['Do you go outside in rain?', 'What waterproof products do you have?'],
      bestFor: 'Best for active lifestyles in rainy weather'
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
  // Pretend weather data for demonstration
  const pretendData = {
    temp: 18,
    feelsLike: 20,
    humidity: 75,
    conditions: 'Moderate rain',
    wind: 2.5,
    precip: 80,
    aqi: 15.0,
    icon: '🌧️',
    code: 63  // Moderate rain
  };

  elements.weatherIcon.textContent = pretendData.icon;
  elements.weatherIcon.className = 'weather-icon'; // Reset classes
  // Add rotation based on weather
  if (pretendData.code >= 51 && pretendData.code <= 82) { // Rain codes
    elements.weatherIcon.classList.add('rotating');
  } else if (pretendData.code >= 95) { // Thunderstorm
    elements.weatherIcon.classList.add('fast-rotating');
  }

  elements.weatherTemp.textContent = `${pretendData.temp}°C`;
  elements.feelsLike.textContent = `${pretendData.feelsLike}°C`;
  elements.humidity.textContent = `${pretendData.humidity}%`;
  elements.conditions.textContent = pretendData.conditions;
  elements.wind.textContent = `${pretendData.wind} m/s`;
  elements.precip.textContent = `${pretendData.precip}%`;
  elements.aqi.textContent = `${pretendData.aqi} µg/m³`;
}

function displayRecommendations(recs) {
  elements.recommendations.innerHTML = '';
  recs.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    let html = `<strong>${item.title}</strong><br>${item.text}`;
    if (item.questions && item.questions.length > 0) {
      html += `<br><em>Questions to consider:</em><ul>`;
      item.questions.forEach(q => {
        html += `<li>${q}</li>`;
      });
      html += `</ul>`;
    }
    if (item.bestFor) {
      html += `<br><strong>${item.bestFor}</strong>`;
    }
    li.innerHTML = html;
    elements.recommendations.appendChild(li);
  });
}

function displayTopics(topics) {
  const topicsEl = document.getElementById('topics');
  topicsEl.innerHTML = '';
  topics.forEach((topic, index) => {
    const col = document.createElement('div');
    col.className = 'col-12 topic-card p-2';
    const imageHtml = topic.img ? 
      `<img src="${topic.img}" alt="${topic.title}" class="topic-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : '';
    const placeholderHtml = `<div class="image-placeholder" data-topic-index="${index}" style="display: ${topic.img ? 'none' : 'flex'};">
      <div class="placeholder-icon">📷</div>
      <div class="placeholder-text">Future Image ${index + 1}</div>
    </div>`;
    col.innerHTML = `
      ${imageHtml}
      ${placeholderHtml}
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

    displayWeeklyForecast(weatherData.daily);

    const recommendations = getSkincareRecommendations({
      tempC: pretendData.temp,
      humidity: pretendData.humidity,
      precipProb: pretendData.precip,
      pm25: pretendData.aqi,
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

// Initialize topics on page load
displayTopics(getSkincareTopics());

window.addEventListener('DOMContentLoaded', refreshData);
