require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const fileRouter = require('./router/file-router');

const port = 4000;
app.use(bodyParser.raw({ type: 'application/octet-stream', limit: '10mb' }));
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(express.json());
app.use('/api', fileRouter);

async function start() {
  try {
    app.listen(port, () => console.log('Server has been started on port:', port));
  } catch (error) {
    console.log(error);
  }
}
start();
