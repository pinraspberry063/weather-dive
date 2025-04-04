import { Permissions, webMethod } from "wix-web-module";
import {fetch} from 'wix-fetch';
import {getSecret} from 'wix-secrets-backend';

// Get current weather in selected city
export const getCurrentWeather = webMethod(
  Permissions.Anyone,
  async (city) => {
    const API_KEY = await getSecret("WEATHER_API_KEY");
    const API_ENDPOINT = `http://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=id:${city}` // current API Method

    try {
      const response = await fetch(API_ENDPOINT, { method: "GET" });
      if (!response.ok) throw new Error(`Weather API error: ${response.statusText}`);
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching weather data:", error);
      throw error;
    }
  }
);

// Get search results based on user input
export const getSearchResults = webMethod(
  Permissions.Anyone,
  async (userInput) => {
    const API_KEY = await getSecret("WEATHER_API_KEY");
    const API_ENDPOINT = `http://api.weatherapi.com/v1/search.json?key=${API_KEY}&q=${encodeURIComponent(userInput)}`; // search/Lookup API Method

    try {
        const response = await fetch(API_ENDPOINT, { method: "GET" });
        if (!response.ok) throw new Error("Failed to fetch data");

        const cities = await response.json();
        if (cities.length === 0) return; // No results, keep dropdown empty

        // Map API results to dropdown options
        let options = cities.map(city => ({
            label: `${city.name}, ${city.region || ""}, ${city.country}`, // Help users choose correct city
            value: `${city.id}` // Used to retrieve the weather and forecast
            
        }));

        return options;

    } catch (error) {
        console.error("Error fetching cities:", error);
    }
  }

);

// Get 6-day forecast
export const getForecast = webMethod(
  Permissions.Anyone,
  async (city) => {
    const API_KEY = await getSecret("WEATHER_API_KEY");
    const API_ENDPOINT = `http://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=id:${city}&days=6` // Forecast API Method

    try {
      const response = await fetch(API_ENDPOINT, { method: "GET" });
      if (!response.ok) throw new Error(`Weather API error: ${response.statusText}`);
      
      const data = await response.json();

      return data;
    } catch (error) {
      console.error("Error fetching weather data:", error);
      throw error;
    }
  }
);

	
        

