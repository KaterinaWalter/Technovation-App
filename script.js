// NYC Weather and Skincare Recommendation App
// Uses OpenWeatherMap API for weather and air quality data

const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'; // Get free key from openweathermap.org
const NYC_COORDS = { lat: 40.7128, lon: -74.0060 }; // NYC coordinates

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
  aqiValue: document.getElementById('aqiValue'),
  aqiLabel: document.getElementById('aqiLabel'),
  pm25: document.getElementById('pm25'),
  pm10: document.getElementById('pm10'),
  o3: document.getElementById('o3'),
  no2: document.getElementById('no2'),
  conditionAnalysis: document.getElementById('conditionAnalysis'),
  productsContainer: document.getElementById('productsContainer'),
  lastUpdated: document.getElementById('lastUpdated'),
  refreshBtn: document.getElementById('refreshBtn')
};

// Skincare product database based on weather conditions
const SKINCARE_PRODUCTS = {
  moisturizers: [
    {
      name: 'Hydrating Face Serum',
      icon: '💧',
      triggers: ['dry', 'cold', 'low_humidity'],
      description: 'Lightweight serum with hyaluronic acid for deep hydration',
      reason: 'Perfect for dry, cold weather conditions',
      ingredients: 'Hyaluronic Acid, Glycerin, Vitamin E'
    },
    {
      name: 'Rich Night Moisturizer',
      icon: '🌙',
      triggers: ['dry', 'cold'],
      description: 'Intensive overnight cream to repair and nourish',
      reason: 'Cold weather can dehydrate skin; use at night',
      ingredients: 'Ceramides, Peptides, Squalane'
    },
    {
      name: 'Gel Moisturizer',
      icon: '✨',
      triggers: ['hot', 'humid', 'high_humidity'],
      description: 'Lightweight, non-greasy gel formula',
      reason: 'Best for humid weather to avoid excess oil buildup',
      ingredients: 'Niacinamide, Centella Asiatica'
    }
  ],
  sunscreen: [
    {
      name: 'Broad Spectrum SPF 50',
      icon: '☀️',
      triggers: ['high_uv', 'clear_sky', 'sunny'],
      description: 'Daily sunscreen to prevent UV damage',
      reason: 'High UV index requires protection from sun damage',
      ingredients: 'Zinc Oxide, Titanium Dioxide'
    },
    {
      name: 'Lightweight Daily SPF 30',
      icon: '🛡️',
      triggers: ['moderate_uv'],
      description: 'Daily sunscreen with antioxidants',
      reason: 'Moderate UV protection for everyday use',
      ingredients: 'Avobenzone, Octinoxate, Polyphenols'
    }
  ],
  acne: [
    {
      name: 'Salicylic Acid Cleanser',
      icon: '🧼',
      triggers: ['humid', 'high_humidity', 'poor_air_quality'],
      description: 'Deep-cleaning facial wash for oily skin',
      reason: 'Humidity increases oil production and breakouts',
      ingredients: 'Salicylic Acid 2%, Tea Tree Oil'
    },
    {
      name: 'BHA Exfoliating Toner',
      icon: '🔄',
      triggers: ['humid', 'poor_air_quality'],
      description: 'Exfoliating toner to unclog pores',
      reason: 'Poor air quality clogs pores; exfoliate to clear',
      ingredients: 'Beta Hydroxy Acid, Witch Hazel'
    }
  ],
  pollution: [
    {
      name: 'Detoxifying Mask',
      icon: '🎭',
      triggers: ['poor_air_quality', 'high_pollution'],
      description: 'Deep-cleansing mask with activated charcoal',
      reason: 'Air pollution deposits toxins on skin; detoxify weekly',
      ingredients: 'Activated Charcoal, Clay, Vitamin C'
    },
    {
      name: 'Antioxidant Serum',
      icon: '🔬',
      triggers: ['poor_air_quality', 'high_uv'],
      description: 'Serum protecting against environmental damage',
      reason: 'Protects skin from pollution and UV damage',
      ingredients: 'Vitamin C, Green Tea Extract, Resveratrol'
    }
  ],
  sensitivity: [
    {
      name: 'Gentle Cleanser',
      icon: '🍃',
      triggers: ['dry', 'cold', 'low_humidity'],
      description: 'Sulfate-free, pH-balanced cleanser',
      reason: 'Dry weather can irritate sensitive skin',
      ingredients: 'Oat Extract, Chamomile, Aloe Vera'
    },
    {
      name: 'Barrier Repair Cream',
      icon: '🛡️',
      triggers: ['dry', 'cold'],
      description: 'Strengthens skin barrier with ceramides',
      reason: 'Cold weather damages skin barrier; repair daily',
      ingredients: 'Ceramides, Centella Asiatica, Panthenol'
    }
  ]
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

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  DOM_ELEMENTS.refreshBtn.addEventListener('click', fetchWeatherData);
  checkAPIKey();
  fetchWeatherData();
});

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

  DOM_ELEMENTS.temperature.textContent = temp;
  DOM_ELEMENTS.humidity.textContent = humidity;
  DOM_ELEMENTS.windSpeed.textContent = windSpeed;
  DOM_ELEMENTS.visibility.textContent = visibility;
  DOM_ELEMENTS.weatherDescription.textContent = data.weather[0].description;
  DOM_ELEMENTS.feelsLike.textContent = `Feels like ${feelsLike}°F`;

  // Calculate UV Index (approximation based on time and weather)
  const hour = new Date().getHours();
  const uvIndex = calculateUVIndex(hour, description);
  DOM_ELEMENTS.uvIndex.textContent = uvIndex.toFixed(1);
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

function updateProductRecommendations(conditions) {
  const recommendations = new Map();
  const conditionStrings = conditions.filter(c => typeof c === 'string');

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

  // Sort by match count and display top recommendations
  const topProducts = Array.from(recommendations.values())
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 6);

  DOM_ELEMENTS.productsContainer.innerHTML = topProducts
    .map(product => `
      <div class="product-card">
        <div class="product-icon">${product.icon}</div>
        <div class="product-name">${product.name}</div>
        <div class="product-category">Skincare</div>
        <div class="product-description">${product.description}</div>
        <div class="product-reason">"${product.reason}"</div>
        <div class="product-ingredients"><strong>Key Ingredients:</strong> ${product.ingredients}</div>
      </div>
    `)
    .join('');
}

function showError(message) {
  DOM_ELEMENTS.loading.style.display = 'none';
  DOM_ELEMENTS.mainContent.style.display = 'none';
  DOM_ELEMENTS.errorText.textContent = message;
  DOM_ELEMENTS.error.style.display = 'block';
  DOM_ELEMENTS.refreshBtn.disabled = false;
}
