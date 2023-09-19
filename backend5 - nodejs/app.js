const { init } = require('./trace')
const api = require('@opentelemetry/api')
init('calculator-svc', 'development')

const express = require('express')
const axios = require('axios')
const app = express()
const port = 3005;

app.use(express.json())
app.use(express.urlencoded({ extended: false }))


// app.get('/calculate', async(req, res) => {
//   const num1=90;
//   const num2=95;
//   const result = num1 + num2;

//   try {
//     // Get the weather API URL from the environment variable
//     const weatherApiUrl = `http://${process.env.WEATHER_API_HOST}:${process.env.WEATHER_API_PORT}/weather`;

//     if (!weatherApiUrl) {
//       throw new Error('WEATHER_API_URL environment variable is not set.');
//     }

//  const weatherResponse = await axios.get(weatherApiUrl)
// //   res.json({ result });
//   res.json({result,weather: weatherResponse.data });
// }catch (error) {
//     console.error('Error fetching weather data:', error.message);
//     res.status(500).json({ error: 'Failed to fetch weather data' });
//   }
// });

app.get('/getAllWeather', async(req, res) => {
 
 const weatherResponse = await axios.get(`http://${process.env.WEATHER_API_HOST}:${process.env.WEATHER_API_PORT}/weather`)
 console.log("WeatherData->",weatherResponse?.data)
//   res.json({ result });
  res.json( weatherResponse?.data );
});

app.get('/getCityWeather', async(req, res) => {
  // const num1=90;
  // const num2=95;
  // const result = num1 + num2;
 const weatherResponse = await axios.get(`http://${process.env.WEATHER_API_HOST}:${process.env.WEATHER_API_PORT}/weather?city=india`)
 console.log("WeatherData->",weatherResponse?.data)
//   res.json({ result });
  res.json( weatherResponse?.data );
});

app.get('/getWeather', async(req, res) => {
  // const num1=90;
  // const num2=95;
  // const result = num1 + num2;
 const weatherResponse = await axios.get(`http://${process.env.WEATHER_API_HOST}:${process.env.WEATHER_API_PORT}/weather?city=`)
 console.log("WeatherData->",weatherResponse?.data)
//   res.json({ result });
  res.json( weatherResponse?.data );
});


app.listen(port, () => {
  console.log(`Calculator Service is listening on port ${port}`);
});

