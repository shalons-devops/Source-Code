const { init } = require('./tracing')
const api = require('@opentelemetry/api')
init('backend-svc', 'development')

const express = require('express');
const cors = require('cors');
const proxy = require('express-http-proxy');



const app = express();
const port = 3001;

app.use(cors());

app.get("/get",(req,res)=>{
  res.send("Welcome")
})

app.get('/api/data', (req, res) => {
  // Your data retrieval logic here
  const dataToSend = { message: 'Hello from Express!' };

  // Send the data as JSON
  res.json(dataToSend);
});

// Proxy requests to MongoDB server using environment variables
app.use('/proxy-mongodb', proxy(`http://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}`));

// Proxy requests to another server using environment variables
app.use('/proxy-get-data', proxy(`http://${process.env.POSTGRESQL_HOST}:${process.env.POSTGRESQL_HOST_PORT}`));

app.listen(port, () => {
  console.log(`Main server is running on port ${port}`);
});