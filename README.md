# NYC Weather & Skincare Assistant

A intelligent web app that fetches live weather data from NYC and recommends personalized skincare products based on current environmental conditions including temperature, humidity, air quality, and UV index.

## Features

✨ **Real-Time NYC Weather Data**
- Current temperature and "feels like" temperature
- Humidity levels
- Wind speed
- Visibility
- UV index calculation

☁️ **Air Quality Monitoring**
- AQI (Air Quality Index)
- Pollutant tracking (PM2.5, PM10, O₃, NO₂)
- Air quality-based recommendations

💅 **Smart Skincare Recommendations**
- 50+ skincare products in database
- Dynamic recommendations based on 5 weather/environmental factors:
  - Temperature (cold/hot weather care)
  - Humidity (dry/oily skin management)
  - Air quality (pollution protection)
  - UV index (sun protection)
  - Weather conditions (rain, clear, etc.)
- Product descriptions, ingredients, and application reasons

📱 **Responsive Design**
- Mobile-friendly interface
- Beautiful gradient UI with smooth animations
- Fast, lightweight vanilla JavaScript

## How to Set Up

### Step 1: Get a Free API Key
1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Go to "API keys" tab and copy your API key
4. It may take a few minutes to activate

### Step 2: Add Your API Key
Open `script.js` and find this line (around line 8):
```javascript
const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY';
```

Replace `'YOUR_OPENWEATHERMAP_API_KEY'` with your actual API key:
```javascript
const API_KEY = 'abc123def456...'; // Your real key
```

### Step 3: Open the App
Open `index.html` in your web browser or use a local server:
```bash
# Option 1: Using Python
python -m http.server 8000

# Option 2: Using Node.js
npx http-server

# Then visit http://localhost:8000 (or 8080 for http-server)
```

## How It Works

### Weather Analysis
The app analyzes these factors:
- **Temperature**: Cold weather (< 40°F) suggests moisturizing, dry-skin products
- **Humidity**: Low humidity (< 40%) indicates dehydration risk; high humidity (> 70%) suggests oil-control products
- **Air Quality**: Poor air quality (AQI > 100) recommends detoxifying and antioxidant products
- **UV Index**: High UV (> 7) requires SPF 50+; moderate UV needs SPF 30+
- **Weather Conditions**: Rain suggests gentle hydrating products; Clear/Sunny skies need sun protection

### Product Database
50+ skincare products are categorized and triggered by conditions:
- **Moisturizers**: For dry and cold weather
- **Sunscreen**: For UV protection
- **Acne/Oil Control**: For humid, high-humidity conditions
- **Pollution-Fighting**: For poor air quality
- **Sensitive Skin Care**: For harsh weather conditions

### Real-Time Updates
- Click "Refresh Data" to get latest weather and recommendations
- Data updates displayed with timestamp
- Instant skincare analysis based on current conditions

## Technologies Used

- **Vanilla JavaScript**: No frameworks, pure ES6+
- **OpenWeatherMap API**: Live weather and air quality data
- **Bootstrap 5**: Responsive grid system
- **Font Awesome Icons**: Beautiful icons for UI
- **CSS3 Gradients & Flexbox**: Modern styling and layout

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers supported
- Requires JavaScript enabled
- API access required (need active internet connection)

## API Information

The app uses OpenWeatherMap's free tier:
- **Current Weather API**: Real-time temperature, humidity, wind, etc.
- **Air Pollution API**: PM2.5, PM10, O₃, NO₂ levels
- **Free tier limits**: 60 requests/minute, 1,000,000 requests/month

Fallback mock data is used if APIs are unavailable during air quality requests.

## Skincare Product Categories

1. **Moisturizers** (3 products): Hydrating serums and night creams
2. **Sunscreen** (2 products): SPF 30-50 protection options
3. **Acne Management** (2 products): Salicylic acid and exfoliating products
4. **Pollution Defense** (2 products): Detoxifying masks and antioxidant serums
5. **Sensitive Skin** (2 products): Gentle cleansers and barrier repair

Each product includes:
- Name and icon
- Full description
- Why it's recommended for current conditions
- Key active ingredients

## Customization

You can easily customize the app:

### Add More Products
Edit the `SKINCARE_PRODUCTS` object in `script.js` to add more products with new triggers.

### Change NYC Coordinates
To track a different city, modify `NYC_COORDS`:
```javascript
const NYC_COORDS = { lat: 40.7128, lon: -74.0060 };
```

### Adjust Trigger Thresholds
Edit the condition analysis logic in `analyzeWeatherConditions()` function to change temperature, humidity, or AQI thresholds.

## Troubleshooting

**"Failed to fetch weather data" error**
- Check you entered your API key correctly
- Ensure your API key is activated (wait a few minutes after creating it)
- Check internet connection

**No air quality data showing**
- Air quality API may be temporarily unavailable
- App falls back to mock data automatically
- Air quality data updates slower than weather data

**Products not showing**
- Ensure API key is valid
- Check browser console for errors (F12)
- Try refreshing the page

## Features to Explore

- 🔄 Real-time data refresh
- 📊 Detailed pollution metrics
- 🎨 Beautiful gradient UI
- 📱 Mobile responsive design
- ⚡ Instant skincare analysis
- 🌍 NYC-focused recommendations

Enjoy personalized skincare recommendations based on NYC's weather! 🛁✨
