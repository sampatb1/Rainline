// Simple test script to demonstrate weather functionality
const { weatherService } = require('./frontend/src/services/weather.ts');

async function testWeather() {
  console.log('Testing weather service...');
  
  const locations = ['Richardson, TX', 'Seattle, WA', 'Miami, FL', 'Los Angeles, CA'];
  
  for (const location of locations) {
    try {
      console.log(`\nFetching weather for: ${location}`);
      const weather = await weatherService.getWeatherByLocation(location);
      console.log(`Temperature: ${weather.temperature}°C`);
      console.log(`Recent Rainfall: ${weather.rainfall}mm`);
      console.log(`Location: ${weather.location}`);
    } catch (error) {
      console.error(`Error fetching weather for ${location}:`, error.message);
    }
  }
}

testWeather();