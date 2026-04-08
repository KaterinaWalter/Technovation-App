// NYC Weather and Skincare Recommendation App
// Uses OpenWeatherMap API for weather and air quality data

const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'; // Get free key from openweathermap.org
const NYC_COORDS = { lat: 40.7128, lon: -74.0060 }; // NYC coordinates

// App State
let currentSkinType = localStorage.getItem('skinType') || 'normal';
let favoriteProducts = JSON.parse(localStorage.getItem('favoriteProducts') || '[]');
let darkMode = localStorage.getItem('darkMode') === 'true';

const DOM_ELEMENTS = {
  loading: document.getElementById('loadingSpinner'),
  error: document.getElementById('errorMessage'),
  errorText: document.getElementById('errorText'),
  mainContent: document.getElementById('mainContent'),
  temperature: document.getElementById('temperature'),
  humidity: document.getElementById('humidity'),
  windSpeed: document.getElementById('windSpeed'),
  visibility: document.getElementById('visibility'),
  uvIndex: document.getElementById('uvIndex'),
  weatherDescription: document.getElementById('weatherDescription'),
  feelsLike: document.getElementById('feelsLike'),
  weatherIcon: document.getElementById('weatherIcon'),
  cityName: document.getElementById('cityName'),
  tempRange: document.getElementById('tempRange'),
  pressure: document.getElementById('pressure'),
  windDirection: document.getElementById('windDirection'),
  sunrise: document.getElementById('sunrise'),
  sunset: document.getElementById('sunset'),
  skinTypeSummary: document.getElementById('skinTypeSummary'),
  aqiValue: document.getElementById('aqiValue'),
  aqiLabel: document.getElementById('aqiLabel'),
  pm25: document.getElementById('pm25'),
  pm10: document.getElementById('pm10'),
  o3: document.getElementById('o3'),
  no2: document.getElementById('no2'),
  conditionAnalysis: document.getElementById('conditionAnalysis'),
  productsContainer: document.getElementById('productsContainer'),
  routineContainer: document.getElementById('routineContainer'),
  tipsContainer: document.getElementById('tipsContainer'),
  lastUpdated: document.getElementById('lastUpdated'),
  refreshBtn: document.getElementById('refreshBtn'),
  clearFavoritesBtn: document.getElementById('clearFavoritesBtn'),
  darkModeBtn: document.getElementById('darkModeBtn'),
  skinTypeBtns: document.querySelectorAll('.skin-type-btn')
};

// Air quality index descriptions
const AQI_LEVELS = [
  { range: [0, 50], label: 'Good', color: '#2ecc71' },
  { range: [51, 100], label: 'Moderate', color: '#f39c12' },
  { range: [101, 150], label: 'Unhealthy for Sensitive Groups', color: '#e67e22' },
  { range: [151, 200], label: 'Unhealthy', color: '#e74c3c' },
  { range: [201, 300], label: 'Very Unhealthy', color: '#c0392b' },
  { range: [301, Infinity], label: 'Hazardous', color: '#8b0000' }
];

// Skincare Tips Database
const SKINCARE_TIPS = {
  cold: [
    '🧊 Use an extra layer of moisturizer in cold weather to combat dryness',
    '🛁 Take shorter, lukewarm showers instead of hot water; hot water strips natural oils',
    '💧 Increase your water intake to hydrate from within',
    '🧤 Wear gloves outside to protect skin from cold wind and dry air'
  ],
  hot: [
    '🌞 Reapply sunscreen every 2 hours, especially if sweating',
    '💦 Use lightweight, oil-free moisturizers and gel-based products',
    '😴 Keep your pillowcase cool and change it frequently to prevent bacterial growth',
    '🥗 Eat water-rich foods like cucumbers, watermelon, and citrus fruits'
  ],
  humid: [
    '🎭 Use a clay or charcoal mask once a week to control excess oil',
    '🧼 Wash your face twice daily with a gentle cleanser',
    '🌿 Use lightweight products; heavy creams can cause breakouts',
    '💨 Keep your environment cool and well-ventilated'
  ],
  dry: [
    '🧴 Use a humidifier at night to add moisture to the air',
    '🛢️ Apply moisturizer to damp skin to lock in hydration',
    '🥑 Include hydrating ingredients like glycerin and hyaluronic acid in your routine',
    '☕ Avoid overusing exfoliants and stick to gentle, hydrating products'
  ],
  pollution: [
    '🛡️ Double cleanse at night to remove all pollutants and makeup',
    '🧪 Use an antioxidant serum to protect against free radical damage',
    '🧴 Apply a protective moisturizer barrier between skin and environment',
    '🌿 Use products with neem oil or green tea for extra protection'
  ],
  uv: [
    '☀️ Apply SPF every morning, even on cloudy days',
    '🧢 Wear UV-protective clothing, hats, and sunglasses',
    '⏰ Avoid sun exposure between 10 AM and 4 PM when UV is strongest',
    '🔄 Reapply sunscreen after swimming or heavy sweating'
  ],
  normal: [
    '✨ Keep your routine balanced with gentle cleansing and hydration',
    '🌿 Use a lightweight moisturizer to maintain your skin’s natural barrier',
    '🛡️ Continue using SPF daily for long-term protection',
    '🧴 Choose products without harsh sulfates or fragrances'
  ],
  oily: [
    '💧 Use gel-based hydration to avoid heavy residue',
    '🧼 Cleanse twice a day with a gentle foaming cleanser',
    '🔬 Use salicylic acid or BHA products to keep pores clear',
    '🌬️ Finish with a lightweight SPF to prevent shine'
  ],
  combination: [
    '🌸 Treat oily zones with exfoliation and hydrate dry areas separately',
    '🧴 Use non-comedogenic products that are light but nourishing',
    '⏰ Apply hydration in the morning and a comforting moisturizer at night',
    '🧽 Keep blotting sheets handy for midday shine control'
  ],
  sensitive: [
    '🍃 Choose fragrance-free, calming products with minimal ingredients',
    '🧴 Apply a gentle moisturizer immediately after cleansing',
    '🧊 Avoid aggressive exfoliants and hot showers',
    '🌿 Patch-test new products before using them on your whole face'
  ],
  general: [
    '💤 Get 7-9 hours of quality sleep; skin repairs itself at night',
    '🥗 Eat a balanced diet rich in antioxidants, vitamins, and omega-3s',
    '💧 Drink at least 8 glasses of water daily',
    '🧘 Manage stress through meditation, exercise, or yoga'
  ]
};

const SKIN_TYPE_ADVICE = {
  normal: {
    title: 'Normal skin',
    summary: 'Your skin is well-balanced, so keep routines simple and maintain hydration with lightweight products.'
  },
  oily: {
    title: 'Oily skin',
    summary: 'Focus on oil control, gentle exfoliation, and lightweight hydration to keep shine under control.'
  },
  dry: {
    title: 'Dry skin',
    summary: 'Use rich moisturizers, barrier repair ingredients, and avoid over-cleansing to preserve moisture.'
  },
  combination: {
    title: 'Combination skin',
    summary: 'Balance your routine with targeted care: hydrate dry areas and control oil where needed.'
  },
  sensitive: {
    title: 'Sensitive skin',
    summary: 'Choose calming, gentle products and build your routine slowly to avoid irritation.'
  }
};

const SKINCARE_PRODUCTS = {
  moisturizers: [
    {
      name: 'Hydrating Face Serum',
      icon: '💧',
      triggers: ['dry', 'cold', 'low_humidity', 'normal'],
      description: 'Lightweight serum with hyaluronic acid for deep hydration',
      reason: 'Perfect for dry, cold weather conditions',
      ingredients: 'Hyaluronic Acid, Glycerin, Vitamin E'
    },
    {
      name: 'Rich Night Moisturizer',
      icon: '🌙',
      triggers: ['dry', 'cold', 'sensitive'],
      description: 'Intensive overnight cream to repair and nourish',
      reason: 'Cold weather can dehydrate skin; use at night',
      ingredients: 'Ceramides, Peptides, Squalane'
    },
    {
      name: 'Gel Moisturizer',
      icon: '✨',
      triggers: ['hot', 'humid', 'high_humidity', 'oily', 'combination'],
      description: 'Lightweight, non-greasy gel formula',
      reason: 'Best for humid weather to avoid excess oil buildup',
      ingredients: 'Niacinamide, Centella Asiatica'
    }
  ],
  sunscreen: [
    {
      name: 'Broad Spectrum SPF 50',
      icon: '☀️',
      triggers: ['high_uv', 'clear_sky', 'sunny', 'normal', 'dry', 'sensitive'],
      description: 'Daily sunscreen to prevent UV damage',
      reason: 'High UV index requires protection from sun damage',
      ingredients: 'Zinc Oxide, Titanium Dioxide'
    },
    {
      name: 'Lightweight Daily SPF 30',
      icon: '🛡️',
      triggers: ['moderate_uv', 'oily', 'combination'],
      description: 'Daily sunscreen with antioxidants',
      reason: 'Moderate UV protection for everyday use',
      ingredients: 'Avobenzone, Octinoxate, Polyphenols'
    }
  ],
  acne: [
    {
      name: 'Salicylic Acid Cleanser',
      icon: '🧼',
      triggers: ['humid', 'high_humidity', 'poor_air_quality', 'oily', 'combination'],
      description: 'Deep-cleaning facial wash for oily skin',
      reason: 'Humidity increases oil production and breakouts',
      ingredients: 'Salicylic Acid 2%, Tea Tree Oil'
    },
    {
      name: 'BHA Exfoliating Toner',
      icon: '🔄',
      triggers: ['humid', 'poor_air_quality', 'oily', 'combination'],
      description: 'Exfoliating toner to unclog pores',
      reason: 'Poor air quality clogs pores; exfoliate to clear',
      ingredients: 'Beta Hydroxy Acid, Witch Hazel'
    }
  ],
  pollution: [
    {
      name: 'Detoxifying Mask',
      icon: '🎭',
      triggers: ['poor_air_quality', 'high_pollution', 'combination', 'oily'],
      description: 'Deep-cleansing mask with activated charcoal',
      reason: 'Air pollution deposits toxins on skin; detoxify weekly',
      ingredients: 'Activated Charcoal, Clay, Vitamin C'
    },
    {
      name: 'Antioxidant Serum',
      icon: '🔬',
      triggers: ['poor_air_quality', 'high_uv', 'sensitive', 'dry', 'normal'],
      description: 'Serum protecting against environmental damage',
      reason: 'Protects skin from pollution and UV damage',
      ingredients: 'Vitamin C, Green Tea Extract, Resveratrol'
    }
  ],
  sensitivity: [
    {
      name: 'Gentle Cleanser',
      icon: '🍃',
      triggers: ['dry', 'cold', 'low_humidity', 'sensitive'],
      description: 'Sulfate-free, pH-balanced cleanser',
      reason: 'Dry weather can irritate sensitive skin',
      ingredients: 'Oat Extract, Chamomile, Aloe Vera'
    },
    {
      name: 'Barrier Repair Cream',
      icon: '🛡️',
      triggers: ['dry', 'cold', 'sensitive'],
      description: 'Strengthens skin barrier with ceramides',
      reason: 'Cold weather damages skin barrier; repair daily',
      ingredients: 'Ceramides, Centella Asiatica, Panthenol'
    },
    {
      name: 'Soothing Mist',
      icon: '🌿',
      triggers: ['sensitive', 'dry', 'normal'],
      description: 'Calming mist to reduce redness and irritation',
      reason: 'Refreshing hydration for sensitive and dry complexions',
      ingredients: 'Aloe Vera, Rose Water, Niacinamide'
    }
  ],
  cleansers: [
    {
      name: 'Balancing Foaming Cleanser',
      icon: '🧼',
      triggers: ['oily', 'combination', 'normal'],
      description: 'Removes excess oil without overdrying',
      reason: 'Good for normal or combination skin prone to shine',
      ingredients: 'Green Tea, Niacinamide'
    },
    {
      name: 'Creamy Hydrating Cleanser',
      icon: '🫧',
      triggers: ['dry', 'sensitive'],
      description: 'Gentle cleanser that preserves moisture',
      reason: 'Perfect for dry or sensitive skin that needs comfort',
      ingredients: 'Shea Butter, Glycerin'
    }
  ]
};

// Skincare Routine Generator
function generateRoutine(conditions, skinType) {
  const routine = {
    morning: [],
    evening: []
  };

  // Morning routine
  routine.morning.push('Cleanser - Gently cleanse your face with lukewarm water');
  
  if (skinType === 'oily' || skinType === 'combination') {
    routine.morning.push('Light toner - Apply a gentle, oil-balancing toner');
  }

  if (conditions.includes('poor_air_quality')) {
    routine.morning.push('Toner - Use a clarifying toner to remove impurities');
  }
  
  if (conditions.includes('low_humidity') || conditions.includes('dry')) {
    routine.morning.push('Hydrating Serum - Apply serum with hyaluronic acid');
  }

  if (skinType === 'sensitive') {
    routine.morning.push('Calming essence - Choose a soothing, fragrance-free formula');
  }
  
  routine.morning.push('Moisturizer - Apply moisturizer suitable for your skin type');
  
  if (conditions.includes('high_uv') || conditions.includes('sunny')) {
    routine.morning.push('Sunscreen - Apply SPF 30-50+ generously (last step)');
  } else {
    routine.morning.push('Sunscreen - Apply SPF 15+ for daily UV protection');
  }

  // Evening routine
  routine.evening.push('Cleanser - Thoroughly cleanse to remove makeup and sunscreen');
  
  if (skinType === 'dry' || skinType === 'sensitive') {
    routine.evening.push('Repair cream - Use a nourishing night cream or balm');
  }

  if (conditions.includes('poor_air_quality')) {
    routine.evening.push('Exfoliant - 2-3x weekly with BHA/AHA for deep cleansing');
  }
  
  if (conditions.includes('high_humidity') || conditions.includes('humid')) {
    routine.evening.push('Acne Treatment - Apply targeted treatment if needed');
  }
  
  if (conditions.includes('low_humidity') || conditions.includes('dry') || conditions.includes('cold')) {
    routine.evening.push('Night Moisturizer - Use a richer night cream for intensive repair');
  } else {
    routine.evening.push('Night Moisturizer - Apply lightweight moisturizer');
  }
  
  routine.evening.push('Eye Cream - Gently apply around the eye area');

  return routine;
}

// Skin type descriptions
const SKIN_TYPE_INFO = {
  normal: {
    title: 'Normal',
    summary: 'Your skin is perfectly balanced! Focus on maintaining a consistent routine.',
    tips: ['Continue with a balanced daily routine', 'Protect from environmental damage', 'Use sunscreen daily']
  },
  oily: {
    title: 'Oily',
    summary: 'Your skin produces excess sebum. Focus on oil control and pore care.',
    tips: ['Use oil-control products', 'Exfoliate regularly to prevent breakouts', 'Lightweight, non-comedogenic products']
  },
  dry: {
    title: 'Dry',
    summary: 'Your skin lacks moisture. Prioritize hydration and nourishment.',
    tips: ['Double your moisturizing efforts', 'Use hydrating serums and essences', 'Avoid harsh, drying products']
  },
  combination: {
    title: 'Combination',
    summary: 'Your T-zone needs oil control while cheeks need hydration. Target your care!',
    tips: ['Customize product zones', 'Use different products for T-zone vs cheeks', 'Balance your routine']
  },
  sensitive: {
    title: 'Sensitive',
    summary: 'Your skin is reactive. Use only gentle, tested, minimal-ingredient products.',
    tips: ['Patch test new products', 'Avoid fragrance and alcohol', 'Use gentle, hydrating products']
  }
};

function updateSkinTypeSummary() {
  const info = SKIN_TYPE_INFO[currentSkinType];
  
  // Update summary text
  const summaryEl = document.getElementById('skinTypeSummary');
  if (summaryEl) {
    summaryEl.textContent = info.summary;
  }
  
  // Highlight active skin type card
  document.querySelectorAll('.skin-type-info-card').forEach(card => {
    card.classList.remove('active');
    if (card.dataset.type === currentSkinType) {
      card.classList.add('active');
    }
  });
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  // Set up dark mode
  if (darkMode) {
    document.body.classList.add('dark-mode');
    DOM_ELEMENTS.darkModeBtn.innerHTML = '<i class=\"fas fa-sun\"></i>';
  }

  // Set up skin type selector
  DOM_ELEMENTS.skinTypeBtns.forEach(btn => {
    if (btn.dataset.type === currentSkinType) {
      btn.classList.add('active');
    }
    btn.addEventListener('click', (e) => {
      DOM_ELEMENTS.skinTypeBtns.forEach(b => b.classList.remove('active'));
      e.target.closest('.skin-type-btn').classList.add('active');
      currentSkinType = e.target.closest('.skin-type-btn').dataset.type;
      localStorage.setItem('skinType', currentSkinType);
      updateSkinTypeSummary();
      // Update skin type cards
      document.querySelectorAll('.skin-type-info-card').forEach(card => {
        card.classList.remove('active');
        if (card.dataset.type === currentSkinType) {
          card.classList.add('active');
        }
      });
      if (DOM_ELEMENTS.mainContent.style.display !== 'none') {
        fetchWeatherData();
      }
    });
  });

  updateSkinTypeSummary();

  // Event listeners
  DOM_ELEMENTS.refreshBtn.addEventListener('click', fetchWeatherData);
  DOM_ELEMENTS.clearFavoritesBtn.addEventListener('click', clearFavorites);
  DOM_ELEMENTS.darkModeBtn.addEventListener('click', toggleDarkMode);

  checkAPIKey();
  fetchWeatherData();
});

function toggleDarkMode() {
  darkMode = !darkMode;
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', darkMode);
  
  if (darkMode) {
    DOM_ELEMENTS.darkModeBtn.innerHTML = '<i class=\"fas fa-sun\"></i>';
  } else {
    DOM_ELEMENTS.darkModeBtn.innerHTML = '<i class=\"fas fa-moon\"></i>';
  }
}

function clearFavorites() {
  if (confirm('Are you sure you want to clear all favorite products?')) {
    favoriteProducts = [];
    localStorage.setItem('favoriteProducts', JSON.stringify(favoriteProducts));
    updateProductCards();
  }
}

function checkAPIKey() {
  if (API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY') {
    showError('Please set your OpenWeatherMap API key in script.js. Get a free key at https://openweathermap.org/api');
    return false;
  }
  return true;
}

async function fetchWeatherData() {
  try {
    DOM_ELEMENTS.loading.style.display = 'block';
    DOM_ELEMENTS.mainContent.style.display = 'none';
    DOM_ELEMENTS.error.style.display = 'none';
    DOM_ELEMENTS.refreshBtn.disabled = true;

    if (!checkAPIKey()) return;

    // Fetch weather data
    const weatherData = await fetchWeatherAPI();
    const airQualityData = await fetchAirQualityAPI();

    // Update UI with data
    updateWeatherDisplay(weatherData);
    updateAirQualityDisplay(airQualityData);
    
    // Generate skincare recommendations
    const conditions = analyzeWeatherConditions(weatherData, airQualityData);
    updateConditionAnalysis(conditions);
    updateRoutine(conditions);
    updateTips(conditions);
    updateProductRecommendations(conditions);

    // Show main content
    DOM_ELEMENTS.loading.style.display = 'none';
    DOM_ELEMENTS.mainContent.style.display = 'block';
    DOM_ELEMENTS.lastUpdated.textContent = new Date().toLocaleTimeString();

  } catch (error) {
    showError(error.message);
  } finally {
    DOM_ELEMENTS.refreshBtn.disabled = false;
  }
}

async function fetchWeatherAPI() {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${NYC_COORDS.lat}&lon=${NYC_COORDS.lon}&appid=${API_KEY}&units=imperial`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch weather data. Check your API key.');
  }
  
  return await response.json();
}

async function fetchAirQualityAPI() {
  const url = `https://api.openweathermap.org/data/3.0/stations/measurements?lat=${NYC_COORDS.lat}&lon=${NYC_COORDS.lon}&appid=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return await fetchAirQualityAlt();
    }
    return await response.json();
  } catch (error) {
    return await fetchAirQualityAlt();
  }
}

async function fetchAirQualityAlt() {
  const url = `https://api.waqi.info/feed/new%20york/?token=demo`;
  
  try {
    const response = await fetch(url);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    // Use mock data if API fails
  }
  
  return getMockAirQualityData();
}

function getMockAirQualityData() {
  return {
    list: [{
      components: {
        pm25: 15 + Math.random() * 20,
        pm10: 20 + Math.random() * 30,
        o3: 40 + Math.random() * 40,
        no2: 30 + Math.random() * 40
      }
    }]
  };
}

function updateWeatherDisplay(data) {
  const temp = Math.round(data.main.temp);
  const feelsLike = Math.round(data.main.feels_like);
  const humidity = data.main.humidity;
  const windSpeed = Math.round(data.wind.speed);
  const visibility = (data.visibility / 1609).toFixed(1); // Convert to miles
  const description = data.weather[0].main;
  const iconCode = data.weather[0].icon;
  const highTemp = Math.round(data.main.temp_max);
  const lowTemp = Math.round(data.main.temp_min);
  const pressure = data.main.pressure;
  const windDegree = data.wind.deg;
  const sunrise = data.sys.sunrise;
  const sunset = data.sys.sunset;

  DOM_ELEMENTS.temperature.textContent = temp;
  DOM_ELEMENTS.humidity.textContent = humidity;
  DOM_ELEMENTS.windSpeed.textContent = windSpeed;
  DOM_ELEMENTS.visibility.textContent = visibility;
  DOM_ELEMENTS.weatherDescription.textContent = data.weather[0].description;
  DOM_ELEMENTS.feelsLike.textContent = `Feels like ${feelsLike}°F`;
  DOM_ELEMENTS.cityName.textContent = `${data.name}, ${data.sys.country}`;
  DOM_ELEMENTS.tempRange.textContent = `High/Low: ${highTemp}° / ${lowTemp}°`;
  DOM_ELEMENTS.pressure.textContent = pressure;
  DOM_ELEMENTS.windDirection.textContent = `${getWindDirection(windDegree)}`;
  DOM_ELEMENTS.sunrise.textContent = formatTime(sunrise);
  DOM_ELEMENTS.sunset.textContent = formatTime(sunset);
  DOM_ELEMENTS.weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  DOM_ELEMENTS.weatherIcon.alt = data.weather[0].description;

  // Calculate UV Index (approximation based on time and weather)
  const hour = new Date().getHours();
  const uvIndex = calculateUVIndex(hour, description);
  DOM_ELEMENTS.uvIndex.textContent = uvIndex.toFixed(1);
}

function getWindDirection(degrees) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

function formatTime(timestamp) {
  return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function updateAirQualityDisplay(data) {
  let pm25 = 15, pm10 = 25, o3 = 50, no2 = 35;
  let aqi = 75;

  if (data.list && data.list[0] && data.list[0].components) {
    const components = data.list[0].components;
    pm25 = components.pm25 || pm25;
    pm10 = components.pm10 || pm10;
    o3 = components.o3 || o3;
    no2 = components.no2 || no2;
    
    // Calculate AQI from pollutants
    aqi = Math.max(pm25 * 1.2, pm10 * 0.8, o3 * 0.5, no2 * 0.9);
  } else if (data.data) {
    // Handle alternative API format
    aqi = data.data.aqi || aqi;
  }

  aqi = Math.round(aqi);
  const aqiLevel = getAQILevel(aqi);

  DOM_ELEMENTS.aqiValue.textContent = aqi;
  DOM_ELEMENTS.aqiLabel.textContent = aqiLevel.label;
  DOM_ELEMENTS.aqiLabel.style.color = aqiLevel.color;
  
  DOM_ELEMENTS.pm25.textContent = `${Math.round(pm25)} µg/m³`;
  DOM_ELEMENTS.pm10.textContent = `${Math.round(pm10)} µg/m³`;
  DOM_ELEMENTS.o3.textContent = `${Math.round(o3)} ppb`;
  DOM_ELEMENTS.no2.textContent = `${Math.round(no2)} ppb`;
}

function getAQILevel(aqi) {
  return AQI_LEVELS.find(level => aqi >= level.range[0] && aqi <= level.range[1]);
}

function calculateUVIndex(hour, weatherCondition) {
  // Base UV calculation
  let uvIndex = 0;
  
  if (hour >= 10 && hour <= 16) {
    uvIndex = 8;
  } else if ((hour >= 8 && hour < 10) || (hour > 16 && hour <= 18)) {
    uvIndex = 5;
  } else if ((hour >= 6 && hour < 8) || (hour > 18 && hour <= 20)) {
    uvIndex = 2;
  }

  // Adjust for weather conditions
  if (weatherCondition.includes('Cloud')) {
    uvIndex *= 0.5;
  } else if (weatherCondition.includes('Rain')) {
    uvIndex *= 0.3;
  } else if (weatherCondition.includes('Clear') || weatherCondition.includes('Sunny')) {
    uvIndex *= 1.2;
  }

  return Math.max(0, uvIndex);
}

function analyzeWeatherConditions(weatherData, airQualityData) {
  const conditions = [];
  const temp = weatherData.main.temp;
  const humidity = weatherData.main.humidity;
  const description = weatherData.weather[0].main.toLowerCase();
  const aqi = estimateAQI(airQualityData);
  const uvIndex = calculateUVIndex(new Date().getHours(), weatherData.weather[0].main);

  // Temperature analysis
  if (temp < 40) {
    conditions.push({ emoji: '❄️', text: 'Cold weather detected - skin may be dry and sensitive' });
    conditions.push('dry');
    conditions.push('cold');
  } else if (temp > 75) {
    conditions.push({ emoji: '🌡️', text: 'Hot weather - watch for excess oil and breakouts' });
    conditions.push('hot');
  }

  // Humidity analysis
  if (humidity < 40) {
    conditions.push({ emoji: '💧', text: `Low humidity (${humidity}%) - skin dehydration risk` });
    conditions.push('low_humidity');
  } else if (humidity > 70) {
    conditions.push({ emoji: '💦', text: `High humidity (${humidity}%) - increased oil production` });
    conditions.push('humid');
    conditions.push('high_humidity');
  }

  // Air quality analysis
  if (aqi > 150) {
    conditions.push({ emoji: '⚠️', text: 'Poor air quality - use pollution-fighting products' });
    conditions.push('poor_air_quality');
    conditions.push('high_pollution');
  } else if (aqi > 100) {
    conditions.push({ emoji: '🌫️', text: 'Moderate air quality - apply protective serum' });
    conditions.push('poor_air_quality');
  }

  // UV analysis
  if (uvIndex > 7) {
    conditions.push({ emoji: '☀️', text: `High UV index (${uvIndex.toFixed(1)}) - SPF 50+ essential` });
    conditions.push('high_uv');
  } else if (uvIndex > 3) {
    conditions.push({ emoji: '🛡️', text: 'Moderate UV exposure - SPF 30+ recommended' });
    conditions.push('moderate_uv');
  }

  // Weather description
  if (description.includes('clear') || description.includes('sunny')) {
    conditions.push('sunny');
    conditions.push('clear_sky');
  } else if (description.includes('rain')) {
    conditions.push({ emoji: '🌧️', text: 'Rainy weather - use gentle, hydrating products' });
  }

  return conditions;
}

function estimateAQI(airQualityData) {
  let aqi = 75;
  
  if (airQualityData.list && airQualityData.list[0] && airQualityData.list[0].components) {
    const { pm25, pm10, o3, no2 } = airQualityData.list[0].components;
    aqi = Math.max(pm25 * 1.2, pm10 * 0.8, o3 * 0.5, no2 * 0.9);
  } else if (airQualityData.data) {
    aqi = airQualityData.data.aqi || aqi;
  }
  
  return Math.round(aqi);
}

function updateConditionAnalysis(conditions) {
  const conditionObjects = conditions.filter(c => typeof c === 'object');
  
  if (conditionObjects.length === 0) {
    DOM_ELEMENTS.conditionAnalysis.innerHTML = '<div class="analysis-item"><span class="analysis-icon">✅</span><span class="analysis-text">Your skin looks good with current conditions!</span></div>';
    return;
  }

  DOM_ELEMENTS.conditionAnalysis.innerHTML = conditionObjects
    .map(condition => `
      <div class="analysis-item">
        <span class="analysis-icon">${condition.emoji}</span>
        <span class="analysis-text">${condition.text}</span>
      </div>
    `)
    .join('');
}

function updateRoutine(conditions) {
  const routine = generateRoutine(conditions);
  
  const routineHTML = `
    <div class="routine-item">
      <div class="routine-time">☀️ Morning Routine</div>
      <ul class="routine-steps">
        ${routine.morning.map(step => `<li>${step}</li>`).join('')}
      </ul>
    </div>
    <div class="routine-item">
      <div class="routine-time">🌙 Evening Routine</div>
      <ul class="routine-steps">
        ${routine.evening.map(step => `<li>${step}</li>`).join('')}
      </ul>
    </div>
  `;
  
  DOM_ELEMENTS.routineContainer.innerHTML = routineHTML;
}

function updateTips(conditions) {
  const conditionStrings = conditions.filter(c => typeof c === 'string');
  const tips = new Set();
  
  // Always include general tips
  SKINCARE_TIPS.general.forEach(tip => tips.add(tip));
  
  // Add skin-type tips
  if (SKINCARE_TIPS[currentSkinType]) {
    SKINCARE_TIPS[currentSkinType].forEach(tip => tips.add(tip));
  }
  
  // Add condition-specific tips
  if (conditionStrings.includes('cold')) {
    SKINCARE_TIPS.cold.forEach(tip => tips.add(tip));
  }
  if (conditionStrings.includes('hot')) {
    SKINCARE_TIPS.hot.forEach(tip => tips.add(tip));
  }
  if (conditionStrings.includes('humid') || conditionStrings.includes('high_humidity')) {
    SKINCARE_TIPS.humid.forEach(tip => tips.add(tip));
  }
  if (conditionStrings.includes('dry') || conditionStrings.includes('low_humidity')) {
    SKINCARE_TIPS.dry.forEach(tip => tips.add(tip));
  }
  if (conditionStrings.includes('poor_air_quality')) {
    SKINCARE_TIPS.pollution.forEach(tip => tips.add(tip));
  }
  if (conditionStrings.includes('high_uv')) {
    SKINCARE_TIPS.uv.forEach(tip => tips.add(tip));
  }
  
  // Limit to top 6 tips and randomize
  const tipsArray = Array.from(tips).sort(() => Math.random() - 0.5).slice(0, 6);
  
  const tipsHTML = tipsArray
    .map(tip => `
      <div class="tip-item">
        <p>${tip}</p>
      </div>
    `)
    .join('');
  
  DOM_ELEMENTS.tipsContainer.innerHTML = tipsHTML;
}

function updateProductRecommendations(conditions) {
  const recommendations = new Map();
  const conditionStrings = conditions.filter(c => typeof c === 'string');
  conditionStrings.push(currentSkinType);

  // Find matching products
  Object.values(SKINCARE_PRODUCTS).forEach(category => {
    category.forEach(product => {
      const matchCount = product.triggers.filter(trigger => conditionStrings.includes(trigger)).length;
      if (matchCount > 0) {
        const key = product.name;
        if (!recommendations.has(key)) {
          recommendations.set(key, { ...product, matchCount });
        }
      }
    });
  });

  // If no specific triggers match, add general recommendations
  if (recommendations.size === 0) {
    recommendations.set('Gentle Cleanser', { ...SKINCARE_PRODUCTS.sensitivity[0], matchCount: 1 });
    recommendations.set('Daily Moisturizer', { ...SKINCARE_PRODUCTS.moisturizers[0], matchCount: 1 });
    recommendations.set('Sunscreen SPF 30', { ...SKINCARE_PRODUCTS.sunscreen[1], matchCount: 1 });
  }

  // Sort by match count and display all products
  const topProducts = Array.from(recommendations.values())
    .sort((a, b) => b.matchCount - a.matchCount);

  DOM_ELEMENTS.productsContainer.innerHTML = topProducts
    .map(product => {
      const isFavorited = favoriteProducts.includes(product.name);
      return `
        <div class="product-card" data-product="${product.name}">
          <button class="product-favorite-btn ${isFavorited ? 'favorited' : ''}" data-product="${product.name}" title="Add to favorites">
            <i class="fas fa-heart"></i>
          </button>
          <div class="product-icon">${product.icon}</div>
          <div class="product-name">${product.name}</div>
          <div class="product-category">Skincare</div>
          <div class="product-description">${product.description}</div>
          <div class="product-reason">"${product.reason}"</div>
          <div class="product-ingredients"><strong>Key Ingredients:</strong> ${product.ingredients}</div>
        </div>
      `;
    })
    .join('');

  // Add favorite button listeners
  document.querySelectorAll('.product-favorite-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const productName = btn.dataset.product;
      if (favoriteProducts.includes(productName)) {
        favoriteProducts = favoriteProducts.filter(p => p !== productName);
      } else {
        favoriteProducts.push(productName);
      }
      localStorage.setItem('favoriteProducts', JSON.stringify(favoriteProducts));
      updateProductCards();
    });
  });
}

function updateProductCards() {
  document.querySelectorAll('.product-favorite-btn').forEach(btn => {
    const productName = btn.dataset.product;
    if (favoriteProducts.includes(productName)) {
      btn.classList.add('favorited');
    } else {
      btn.classList.remove('favorited');
    }
  });
}

function showError(message) {
  DOM_ELEMENTS.loading.style.display = 'none';
  DOM_ELEMENTS.mainContent.style.display = 'none';
  DOM_ELEMENTS.errorText.textContent = message;
  DOM_ELEMENTS.error.style.display = 'block';
  DOM_ELEMENTS.refreshBtn.disabled = false;
}
