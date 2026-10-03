/**
 * Weather Configuration & Dispatch Data
 * File: src/data/weatherData.js
 * 
 * Yeh file default weather data provide karti hai.
 * Sath hi isme auto-fetch helper (Free Open-Meteo API / 2hr caching) bhi prepared hai
 * jisse future me live weather bina kisi API key ke auto update ho sake.
 */

export const defaultWeatherData = {
    city: "New Delhi",
    country: "India",
    temperature: "26°C",
    condition: "Pleasant & Clear Sky",
    icon: "☀️",
    humidity: "45%",
    wind: "12 km/h",
    lastUpdated: "Today's Print Edition",
    // Time-of-day specific weather descriptions
    timeSlots: {
        morning: {
            temp: "23°C",
            condition: "Crisp Morning Breeze",
            icon: "🌅",
        },
        afternoon: {
            temp: "31°C",
            condition: "Warm & Sunny Tandoor Weather",
            icon: "☀️",
        },
        evening: {
            temp: "27°C",
            condition: "Golden Dusk & Pleasant Dining",
            icon: "🌇",
        },
        night: {
            temp: "22°C",
            condition: "Cool Night Sky",
            icon: "🌙",
        },
    },
};

/**
 * Weather code to condition mapping (Standard WMO Weather interpretation codes)
 */
const getWeatherCondition = (code) => {
    if (code === 0) return { condition: "Clear Sky", icon: "☀️" };
    if (code >= 1 && code <= 3) return { condition: "Partly Cloudy", icon: "🌤️" };
    if (code >= 45 && code <= 48) return { condition: "Misty & Foggy", icon: "🌫️" };
    if (code >= 51 && code <= 67) return { condition: "Light Rain Showers", icon: "🌦️" };
    if (code >= 71 && code <= 77) return { condition: "Cool Breeze", icon: "❄️" };
    if (code >= 80 && code <= 82) return { condition: "Rain Showers", icon: "🌧️" };
    if (code >= 95) return { condition: "Thunderstorm", icon: "⛈️" };
    return { condition: "Pleasant Dining", icon: "☀️" };
};

/**
 * Free Live Weather Fetcher with 2-Hour (or 6-Hour) LocalStorage Caching
 * Uses 100% Free Open-Meteo API (No API key needed)
 * Coordinates: New Delhi (Lat: 28.6139, Long: 77.2090)
 */
export const fetchLiveWeather = async (cacheHours = 2) => {
    try {
        const CACHE_KEY = "newspaper_weather_cache";
        const CACHE_TIME_KEY = "newspaper_weather_cache_time";

        const cached = localStorage.getItem(CACHE_KEY);
        const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
        const cacheDurationMs = cacheHours * 60 * 60 * 1000;

        // Agar cache valid hai (e.g. within 2 hours), toh cached data use karo
        if (cached && cachedTime && Date.now() - Number(cachedTime) < cacheDurationMs) {
            return JSON.parse(cached);
        }

        // Open-Meteo Free Public API for New Delhi (No Key Required)
        const res = await fetch(
            "https://api.open-meteo.com/v1/forecast?latitude=28.6139&longitude=77.2090&current_weather=true"
        );

        if (!res.ok) throw new Error("Weather service unreachable");

        const data = await res.json();
        const currentWeather = data?.current_weather;

        if (currentWeather) {
            const temp = Math.round(currentWeather.temperature);
            const { condition, icon } = getWeatherCondition(currentWeather.weathercode);

            const result = {
                city: "New Delhi",
                country: "India",
                temperature: `${temp}°C`,
                condition,
                icon,
                wind: `${currentWeather.windspeed} km/h`,
                lastUpdated: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };

            // Save to localStorage cache
            localStorage.setItem(CACHE_KEY, JSON.stringify(result));
            localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());

            return result;
        }

        return defaultWeatherData;
    } catch (err) {
        console.warn("Weather fetch fallback to local file:", err);
        // Fallback to local default file data
        return defaultWeatherData;
    }
};

export default defaultWeatherData;
