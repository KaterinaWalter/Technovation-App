const NYC = {
	name: "New York City, NY",
	latitude: 40.7128,
	longitude: -74.0060,
};

const elements = {
	status: document.getElementById("status"),
	updated: document.getElementById("last-updated"),
	refreshBtn: document.getElementById("refresh-btn"),
	skinTypeFilter: document.getElementById("skin-type-filter"),
	metricsGrid: document.getElementById("metrics-grid"),
	summaryBanner: document.getElementById("summary-banner"),
	makeupNotes: document.getElementById("makeup-notes"),
	recommendations: document.getElementById("recommendations"),
	userModal: document.getElementById("user-modal"),
	modalForm: document.getElementById("user-profile-form"),
	genderSelect: document.getElementById("gender-select"),
	modalSubmitBtn: document.getElementById("modal-submit-btn"),
};

let latestData = null;
let userProfile = {
	gender: "female",
	makeupTips: true,
};

const weatherCodeMap = {
	0: "Clear sky",
	1: "Mostly clear",
	2: "Partly cloudy",
	3: "Overcast",
	45: "Fog",
	48: "Rime fog",
	51: "Light drizzle",
	53: "Drizzle",
	55: "Heavy drizzle",
	56: "Freezing drizzle",
	57: "Heavy freezing drizzle",
	61: "Light rain",
	63: "Rain",
	65: "Heavy rain",
	66: "Freezing rain",
	67: "Heavy freezing rain",
	71: "Light snow",
	73: "Snow",
	75: "Heavy snow",
	77: "Snow grains",
	80: "Light showers",
	81: "Showers",
	82: "Violent showers",
	85: "Light snow showers",
	86: "Snow showers",
	95: "Thunderstorm",
	96: "Thunderstorm and hail",
	99: "Strong thunderstorm and hail",
};

async function fetchNYCData() {
	const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
	weatherUrl.searchParams.set("latitude", NYC.latitude);
	weatherUrl.searchParams.set("longitude", NYC.longitude);
	weatherUrl.searchParams.set(
		"current",
		"temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m"
	);
	weatherUrl.searchParams.set("hourly", "uv_index");
	weatherUrl.searchParams.set("timezone", "auto");

	const airUrl = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
	airUrl.searchParams.set("latitude", NYC.latitude);
	airUrl.searchParams.set("longitude", NYC.longitude);
	airUrl.searchParams.set("current", "us_aqi,pm2_5");
	airUrl.searchParams.set("timezone", "auto");

	const [weatherResp, airResp] = await Promise.all([
		fetch(weatherUrl),
		fetch(airUrl),
	]);

	if (!weatherResp.ok || !airResp.ok) {
		throw new Error("Unable to fetch live weather data right now.");
	}

	const weatherData = await weatherResp.json();
	const airData = await airResp.json();

	const currentTime = weatherData.current?.time;
	const uvIndex = getUvForCurrentHour(weatherData.hourly, currentTime);

	return {
		weather: weatherData.current,
		air: airData.current,
		uvIndex,
		currentTime,
	};
}

function getUvForCurrentHour(hourly, currentTime) {
	if (!hourly || !Array.isArray(hourly.time) || !Array.isArray(hourly.uv_index)) {
		return null;
	}

	const exactMatchIndex = hourly.time.indexOf(currentTime);
	if (exactMatchIndex >= 0) {
		return hourly.uv_index[exactMatchIndex];
	}

	let closestIndex = 0;
	let smallestDiff = Infinity;

	for (let i = 0; i < hourly.time.length; i += 1) {
		const diff = Math.abs(new Date(hourly.time[i]).getTime() - new Date(currentTime).getTime());
		if (diff < smallestDiff) {
			smallestDiff = diff;
			closestIndex = i;
		}
	}

	return hourly.uv_index[closestIndex] ?? null;
}

function getAqiTag(aqi) {
	if (aqi <= 50) {
		return { label: "Good", levelClass: "good" };
	}
	if (aqi <= 100) {
		return { label: "Moderate", levelClass: "warn" };
	}
	return { label: "Unhealthy", levelClass: "bad" };
}

function weatherDescription(code) {
	return weatherCodeMap[code] || "Mixed conditions";
}

function round(value) {
	if (value == null || Number.isNaN(value)) {
		return "--";
	}
	return Math.round(value);
}

function celsiusToFahrenheit(value) {
	if (value == null || Number.isNaN(value)) {
		return null;
	}
	return (value * 9) / 5 + 32;
}

function formatSkinTypeLabel(skinType) {
	if (skinType === "all") {
		return "all skin types";
	}
	if (skinType === "acne-prone") {
		return "acne-prone skin";
	}
	return `${skinType} skin`;
}

function openUserModal() {
	elements.userModal.classList.add("active");
	elements.genderSelect.focus();
}

function closeUserModal() {
	elements.userModal.classList.remove("active");
}

function collectUserProfile() {
	const formData = new FormData(elements.modalForm);
	userProfile.gender = formData.get("gender");
	userProfile.makeupTips = formData.get("makeup-tips") === "yes";
}

function showUserModal() {
	return new Promise((resolve) => {
		elements.modalForm.addEventListener(
			"submit",
			(event) => {
				event.preventDefault();
				collectUserProfile();
				closeUserModal();
				resolve();
			},
			{ once: true }
		);

		openUserModal();
	});
}

function buildRecommendations(data, skinType = "all") {
	const humidity = data.weather.relative_humidity_2m;
	const aqi = data.air.us_aqi;
	const pm25 = data.air.pm2_5;
	const uv = data.uvIndex;
	const temp = celsiusToFahrenheit(data.weather.temperature_2m);

	const items = new Map();
	const reasons = [];
	const profileReasons = [];

	function addItem(key, product) {
		items.set(key, {
			...product,
			skinTypes: product.skinTypes || ["all"],
		});
	}

	if (humidity < 35) {
		reasons.push("Low humidity can pull water from your skin barrier.");
		addItem("hydrating-cleanser", {
			title: "Hydrating Cleanser",
			tag: "Dry-Air Essential",
			levelClass: "warn",
			note: "Use a non-foaming cleanser with glycerin to avoid tightness after washing.",
			skinTypes: ["all"],
		});
		addItem("ceramide-cream", {
			title: "Ceramide Moisturizer",
			tag: "Barrier Repair",
			levelClass: "good",
			note: "Lock in moisture with a ceramide-rich cream morning and night.",
			skinTypes: ["all"],
		});
	}

	if (humidity > 70) {
		reasons.push("High humidity can increase sweat and clog-prone shine.");
		addItem("gel-moisturizer", {
			title: "Gel Moisturizer",
			tag: "Humidity Friendly",
			levelClass: "good",
			note: "Choose a lightweight, non-comedogenic gel so skin stays balanced.",
			skinTypes: ["all"],
		});
		addItem("niacinamide", {
			title: "Niacinamide Serum (4-10%)",
			tag: "Oil Balance",
			levelClass: "good",
			note: "Apply once daily to reduce excess oil and visible pores.",
			skinTypes: ["oily", "acne-prone"],
		});
	}

	if (aqi > 100 || pm25 > 35) {
		reasons.push("Elevated pollution can increase oxidative stress on skin.");
		addItem("antioxidant", {
			title: "Antioxidant Serum",
			tag: "Pollution Shield",
			levelClass: "bad",
			note: "Use vitamin C or green tea antioxidants in the morning before sunscreen.",
			skinTypes: ["all"],
		});
		addItem("double-cleanse", {
			title: "Evening Double Cleanse",
			tag: "Air Quality Support",
			levelClass: "warn",
			note: "Break down sunscreen and particulate buildup with an oil cleanse first.",
			skinTypes: ["all"],
		});
	}

	if (uv >= 6) {
		reasons.push("UV is high, so stronger daily sun protection is needed.");
		addItem("spf50", {
			title: "Broad-Spectrum SPF 50",
			tag: "High UV",
			levelClass: "bad",
			note: "Use two finger-lengths for face and neck, then reapply every 2 hours outdoors.",
			skinTypes: ["all"],
		});
	} else if (uv >= 3) {
		reasons.push("Moderate UV still requires daily sunscreen.");
		addItem("spf30", {
			title: "Broad-Spectrum SPF 30+",
			tag: "Daily Defense",
			levelClass: "warn",
			note: "Apply every morning as your last skincare step.",
			skinTypes: ["all"],
		});
	}

	if (temp <= 41) {
		reasons.push("Cold air can increase transepidermal water loss.");
		addItem("occlusive", {
			title: "Occlusive Night Balm",
			tag: "Cold Weather",
			levelClass: "warn",
			note: "Seal in hydration at night with petrolatum or squalane.",
			skinTypes: ["dry", "sensitive"],
		});
	}

	if (temp >= 82) {
		reasons.push("Hot weather favors sweat-resistant, lightweight formulas.");
		addItem("light-lotion", {
			title: "Lightweight Lotion",
			tag: "Heat Friendly",
			levelClass: "good",
			note: "Swap heavy creams for water-based hydration in daytime.",
			skinTypes: ["oily", "acne-prone"],
		});
	}

	const makeupNotes = [];
	if (userProfile.makeupTips) {
		if (humidity > 70) {
			makeupNotes.push("High humidity can make makeup melt, so use a mattifying primer and blot oil through the day.");
		}
		if (humidity < 35) {
			makeupNotes.push("Dry air can make powder products cling and appear patchy, so hydrate well before makeup.");
		}
		if (temp >= 82) {
			makeupNotes.push("Hot weather can cause makeup to slide, so choose long-wear formulas and set with a light mist.");
		}
		if (temp <= 41) {
			makeupNotes.push("Cold weather can dry skin and disturb foundation finish, so prep with rich moisturizer and a hydrating primer.");
		}
		addItem("makeup-prep", {
			title: "Makeup Prep Routine",
			tag: "Skin + Makeup",
			levelClass: "good",
			note: "Start with clean, hydrated skin and primer suited for the current weather.",
			skinTypes: ["all"],
		});
	}

	if (skinType === "oily") {
		profileReasons.push("Oily skin benefits from lightweight, sebum-balancing textures.");
		addItem("oily-bha", {
			title: "BHA Leave-On Exfoliant (0.5-2%)",
			tag: "Oily Skin Focus",
			levelClass: "good",
			note: "Use 2-4 nights weekly to keep pores clear and control shine.",
			skinTypes: ["oily", "acne-prone"],
		});
	}

	if (skinType === "dry") {
		profileReasons.push("Dry skin needs humectants and stronger barrier support.");
		addItem("dry-hyaluronic", {
			title: "Hyaluronic + Panthenol Serum",
			tag: "Dry Skin Focus",
			levelClass: "good",
			note: "Apply to damp skin, then seal with cream to reduce dehydration.",
			skinTypes: ["dry"],
		});
	}

	if (skinType === "sensitive") {
		profileReasons.push("Sensitive skin does best with calming, fragrance-free formulas.");
		addItem("sensitive-cica", {
			title: "Cica or Oat Barrier Cream",
			tag: "Sensitive Skin Focus",
			levelClass: "good",
			note: "Choose fragrance-free creams with centella, oat, or allantoin.",
			skinTypes: ["sensitive"],
		});
	}

	if (skinType === "acne-prone") {
		profileReasons.push("Acne-prone skin needs clear-pore support with non-comedogenic hydration.");
		addItem("acne-azelaic", {
			title: "Azelaic Acid (10-15%)",
			tag: "Acne-Prone Focus",
			levelClass: "warn",
			note: "Use once daily to support clearer skin and calmer post-blemish marks.",
			skinTypes: ["acne-prone"],
		});
	}

	if (items.size === 0) {
		reasons.push("Current conditions are fairly balanced.");
		addItem("maintenance", {
			title: "Simple Maintenance Routine",
			tag: "Steady Conditions",
			levelClass: "good",
			note: "Keep a gentle cleanser, daily moisturizer, and SPF 30+ routine.",
			skinTypes: ["all"],
		});
	}

	const filteredProducts = Array.from(items.values()).filter((product) => {
		if (skinType === "all") {
			return true;
		}
		return product.skinTypes.includes("all") || product.skinTypes.includes(skinType);
	});

	if (filteredProducts.length === 0) {
		filteredProducts.push({
			title: "Basic Gentle Routine",
			tag: "Fallback",
			levelClass: "good",
			note: "Use a gentle cleanser, lightweight moisturizer, and broad-spectrum SPF.",
		});
	}

	const summaryBase = reasons[0] || "Conditions are fairly balanced.";
	const profileSummary =
		skinType === "all"
			? "Showing recommendations for all skin types."
			: profileReasons[0] || `Filtered for ${formatSkinTypeLabel(skinType)}.`;
	const makeupSummary = userProfile.makeupTips
		? ` Makeup prep and makeup-wear tips are active for ${userProfile.gender}.`
		: "";

	return {
		summary: `${summaryBase} ${profileSummary}${makeupSummary}`,
		products: filteredProducts,
		makeupNotes,
	};
}

function renderMetrics(data) {
	const aqiTag = getAqiTag(data.air.us_aqi);

	const cards = [
		{
			label: "Temperature",
			value: `${round(celsiusToFahrenheit(data.weather.temperature_2m))}°F`,
			note: `Feels like ${round(celsiusToFahrenheit(data.weather.apparent_temperature))}°F`,
		},
		{
			label: "Humidity",
			value: `${round(data.weather.relative_humidity_2m)}%`,
			note: "Relative humidity",
		},
		{
			label: "US AQI",
			value: `${round(data.air.us_aqi)}`,
			note: `${aqiTag.label} air quality`,
		},
		{
			label: "PM2.5",
			value: `${round(data.air.pm2_5)} ug/m3`,
			note: "Fine particulate matter",
		},
		{
			label: "UV Index",
			value: `${round(data.uvIndex)}`,
			note: data.uvIndex >= 6 ? "High protection needed" : "Monitor sun exposure",
		},
		{
			label: "Wind",
			value: `${round(data.weather.wind_speed_10m)} km/h`,
			note: weatherDescription(data.weather.weather_code),
		},
	];

	elements.metricsGrid.innerHTML = cards
		.map(
			(card, index) => `
				<article class="metric-card" style="animation-delay:${index * 90}ms">
					<p class="metric-label">${card.label}</p>
					<p class="metric-value">${card.value}</p>
					<p class="metric-note">${card.note}</p>
				</article>
			`
		)
		.join("");
}

function renderRecommendations(data) {
	const selectedSkinType = elements.skinTypeFilter.value;
	const rec = buildRecommendations(data, selectedSkinType);

	elements.summaryBanner.textContent = rec.summary;
	elements.makeupNotes.innerHTML = "";
	elements.makeupNotes.classList.add("visually-hidden");

	if (rec.makeupNotes && rec.makeupNotes.length) {
		elements.makeupNotes.classList.remove("visually-hidden");
		elements.makeupNotes.innerHTML = `<strong>Makeup weather tips:</strong> ${rec.makeupNotes.join(" ")}`;
	}

	elements.recommendations.innerHTML = rec.products
		.map(
			(product, index) => `
				<article class="rec-card" style="animation-delay:${index * 110}ms">
					<h3>${product.title}</h3>
					<span class="tag ${product.levelClass}">${product.tag}</span>
					<p>${product.note}</p>
				</article>
			`
		)
		.join("");
}

function updateTimestamp(isoTime) {
	const date = new Date(isoTime);
	const formatted = new Intl.DateTimeFormat("en-US", {
		weekday: "short",
		hour: "numeric",
		minute: "2-digit",
	}).format(date);

	elements.updated.textContent = `Updated ${formatted}`;
}

function setStatus(message, isError = false) {
	elements.status.textContent = message;
	elements.status.classList.toggle("error", isError);
}

async function loadWeatherAndAdvice() {
	setStatus("Loading live weather and air quality...");
	elements.refreshBtn.disabled = true;

	try {
		const data = await fetchNYCData();
		latestData = data;
		renderMetrics(data);
		renderRecommendations(data);
		updateTimestamp(data.currentTime);
		setStatus("Data synced. Recommendations are live for current NYC conditions.");
	} catch (error) {
		console.error(error);
		setStatus("Could not load live data. Please try again in a moment.", true);
		elements.updated.textContent = "Live update unavailable";
	} finally {
		elements.refreshBtn.disabled = false;
	}
}

elements.refreshBtn.addEventListener("click", loadWeatherAndAdvice);
elements.skinTypeFilter.addEventListener("change", () => {
	if (!latestData) {
		return;
	}
	renderRecommendations(latestData);
	setStatus(`Filter applied: ${formatSkinTypeLabel(elements.skinTypeFilter.value)}.`);
});

showUserModal().then(loadWeatherAndAdvice);
