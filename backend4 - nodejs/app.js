const { init } = require('./trace')
const api = require('@opentelemetry/api')
init('first-svc', 'development')

const express = require('express') 
const axios = require('axios')
const cors = require ('cors')
const app = express()
const port = 3004;
const urlPathList = ['getAllWeather','getCityWeather','getWeather']
const max = 3

app.use(express.json())
app.use(express.urlencoded({ extended: false }))


app.use(cors());

app.get('/add', async (req, res) => {
    try {
    //   const num1=90;
    //   const num2=95;
    //   result=num1+num2;
      // Make a request to the Calculator Service
      let randomNum = Math.floor(Math.random() * max)
     const calculatorResponse = await axios.get(`http://${process.env.CALCULATOR_API_URL}:${process.env.CALCULATOR_API_PORT}/${urlPathList[randomNum]}`);
      // const result = calculatorResponse.data.result;
      console.log("Calculate->",calculatorResponse.data)
     const weather=calculatorResponse?.data;
    //  res.json(result)
      res.json({weather:weather});
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

app.listen(port, () => {
  console.log(`Calculator Service is listening on port ${port}`);
});


// const calculatorApiUrl = `http://${process.env.CALCULATOR_API_URL}:${process.env.CALCULATOR_API_PORT}/getWeather`;
