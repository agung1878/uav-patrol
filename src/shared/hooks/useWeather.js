import { useState, useEffect } from 'react';

// Make sure to add VITE_OPENWEATHER_API_KEY to your .env file
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '';

export default function useWeather(lat, lon) {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (lat == null || lon == null) {
            return;
        }

        const fetchWeather = async () => {
            if (!API_KEY) {
                setError('API key missing. Set VITE_OPENWEATHER_API_KEY in .env');
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
                if (!response.ok) {
                    throw new Error('Failed to fetch weather');
                }
                const data = await response.json();
                
                // Fetch forecast
                let hourly = [];
                try {
                    const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
                    if (forecastRes.ok) {
                        const forecastData = await forecastRes.json();
                        hourly = forecastData.list.slice(0, 6).map(item => {
                            const date = new Date(item.dt * 1000);
                            const hours = String(date.getHours()).padStart(2, '0');
                            const mins = String(date.getMinutes()).padStart(2, '0');
                            return {
                                time: `${hours}:${mins}`,
                                temp: Math.round(item.main.temp),
                                icon: item.weather[0]?.icon || '01d',
                                main: item.weather[0]?.main
                            };
                        });
                    }
                } catch (e) {
                    console.warn('Failed to fetch forecast', e);
                }
                
                // Map the data to a friendly format
                const mappedWeather = {
                    temp: Math.round(data.main.temp),
                    description: data.weather[0]?.main || 'Unknown',
                    icon: data.weather[0]?.icon || '01d', // OpenWeatherMap icon code
                    locationName: data.name || 'Unknown Location',
                    windSpeed: data.wind.speed ? Number(data.wind.speed).toFixed(1) : '0',
                    gust: data.wind.gust ? Number(data.wind.gust).toFixed(1) : '0',
                    humidity: data.main.humidity,
                    feelsLike: Math.round(data.main.feels_like),
                    visibility: data.visibility ? (data.visibility / 1000).toFixed(1) : '10', // km
                    clouds: data.clouds?.all || 0,
                    pressure: data.main.pressure,
                    precipitation: data.rain?.['1h'] || data.snow?.['1h'] || 0,
                    isGoodCondition: data.wind.speed < 10 && data.weather[0]?.main !== 'Thunderstorm' && data.weather[0]?.main !== 'Rain',
                    hourly
                };

                setWeather(mappedWeather);
            } catch (err) {
                console.error('Weather API error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();

        // Refresh every 15 minutes
        const interval = setInterval(fetchWeather, 15 * 60 * 1000);
        return () => clearInterval(interval);
    }, [lat, lon]);

    return { weather, loading, error };
}
