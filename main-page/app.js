const { init } = require('./trace')
const api = require('@opentelemetry/api')
init('frontend-svc', 'development')


const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3000; // Use environment variable or default to 3000

app.use(cors());

const mongodbServiceHost = process.env.MONGODB_SERVICE_HOST ; // Use environment variable or default to 'localhost'
const mongodbServicePort = process.env.MONGODB_SERVICE_PORT ; // Use environment variable or default to 3001

const postgresServiceHost = process.env.POSTGRES_SERVICE_HOST ; // Use environment variable or default to 'localhost'
const postgresServicePort = process.env.POSTGRES_SERVICE_PORT ; // Use environment variable or default to 3001

const role3ServiceHost = process.env.ROLE3_SERVICE_HOST ; // Use environment variable or default to 'localhost'
const role3ServicePort = process.env.ROLE3_SERVICE_PORT ; // Use environment variable or default to 3004

app.get('/', (req, res) => {
  const table = `
    <style>
      table {
        border-collapse: collapse;
        width: 50%;
        margin: 20px auto;
      }
      th, td {
        border: 1px solid black;
        padding: 8px;
        text-align: center;
      }
    </style>
    <table border="1">
      <tr>
        <th>Get data from postgres</th>
        <th>Get data from mongodb</th>
        <th>Get data from Elasticsearchdb</th>
      </tr>
      <tr>
        <td>/proxy-get-data/postgres</td>
        <td>/proxy-mongodb/mongodb</td>
        <td>/add</td>
      </tr>
    </table>
  `;

  res.send(table);
});

app.get('/mongodb', (req, res) => {
  const mongodbUrl = `http://${mongodbServiceHost}:${mongodbServicePort}/proxy-mongodb/mongodb?name=`;

  axios
    .get(mongodbUrl)
    .then((response) => {
      res.json(response.data);
    })
    .catch((error) => {
      console.error('Error fetching data from MongoDB:', error);
      res.status(500).json({ error: 'no param given' });
    });
});
app.get('/mongodb/nouser', (req, res) => {
  const mongodbUrl = `http://${mongodbServiceHost}:${mongodbServicePort}/proxy-mongodb/mongodb?name=kandhu`;

  axios
    .get(mongodbUrl)
    .then((response) => {
      res.json(response.data);
    })
    .catch((error) => {
      console.error('Error fetching data from MongoDB:', error);
      res.status(500).json({ error: 'no user in these name' });
    });
});
app.get('/mongodb/fail', (req, res) => {
  const mongodbUrl = `http://${mongodbServiceHost}:${mongodbServicePort}/proxy-mongodb/mong`;

  axios
    .get(mongodbUrl)
    .then((response) => {
      res.json(response.data);
    })
    .catch((error) => {
      console.error('Error fetching data from MongoDB:', error);
      res.status(500).json({ error: 'no user in these name' });
    });
});

app.get('/postgres', (req, res) => {
  const postgresUrl = `http://${postgresServiceHost}:${postgresServicePort}/proxy-get-data/postgres`;

  axios
    .get(postgresUrl)
    .then((response) => {
      res.json(response.data);
    })
    .catch((error) => {
      console.error('Error fetching data from Postgres:', error);
      res.status(500).json({ error: 'Error fetching data from Postgres' });
    });
});

app.get('/postgres/one', (req, res) => {
  const postgresUrl = `http://${postgresServiceHost}:${postgresServicePort}/proxy-get-data/postgres?nameofuser=surya`;

  axios
    .get(postgresUrl)
    .then((response) => {
      res.json(response.data);
    })
    .catch((error) => {
      console.error('Error fetching data from Postgres:', error);
      res.status(500).json({ error: 'Error fetching data from Postgres' });
    });
});
app.get('/postgres/fail', (req, res) => {
  const postgresUrl = `http://${postgresServiceHost}:${postgresServicePort}/proxy-get-data/postgres?nameofuser=nand`;

  axios
    .get(postgresUrl)
    .then((response) => {
      res.json(response.data);
    })
    .catch((error) => {
      console.error('Error fetching data from Postgres:', error);
      res.status(500).json({ error: 'no users found' });
    });
});
app.get('/add', (req, res) => {
  const role3Url = `http://${role3ServiceHost}:${role3ServicePort}/add`;

  axios
    .get(role3Url)
    .then((response) => {
      res.json(response.data);
    })
    .catch((error) => {
      console.error('Error fetching data for Role 3:', error);
      res.status(500).json({ error: 'Error fetching data for Role 3' });
    });
});

app.listen(port, () => {
  console.log(`Node.js server is running on port ${port}`);
});