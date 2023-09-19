require('dotenv').config(); // Load environment variables from a .env file if available

const { init } = require('./tracer')
const api = require('@opentelemetry/api')
init('weather-svc', 'development')

const express = require('express');
const app = express();
const port = process.env.PORT ; // Use the PORT environment variable or default to 3006

const { Client } = require('elasticsearch');

const axios = require('axios')

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const client = new Client({ 
  host: process.env.ELASTICSEARCH_URL, // Use the ELASTICSEARCH_URL environment variable
  log: 'trace', // Set the logging level as needed
});

app.get("/weather", async (req, res) => {
    
  let queryParam = req.query.city;
  let singleCityQuery = {match: {"city":queryParam}}
  let allDataQuery = {match_all: {}}
  let errorQuery = {}

  let query;
  if(Object.keys(req.query).length == 0){
    query = allDataQuery
  }else if(Object.keys(req.query).length > 0 && queryParam?.length == 0){
    query = errorQuery
  }else{
    query = singleCityQuery
  }
 

  try{
    const result = await client.search({
      index: "weather",
      body: {
        query:  query 
      }
      
    });

    res.status(200).json({status:"Success",data:result})
  }catch(e){
    res.json({status:"Failure",message:"Internal server error"})
  }

  // res.send(result);
});



app.listen(port, () => {
  console.log(`Weather Service is listening on port ${port}`);
});