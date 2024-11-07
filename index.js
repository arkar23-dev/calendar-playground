require('dotenv').config();

const express = require('express');
const { setupQueue, serverAdapter } = require('./queue/index');
const connectDB = require('./mongodb');

const syncRouter = require('./routes/sync');

const app = express();
const PORT = 3000;

connectDB();
setupQueue();

app.use('/',syncRouter);
app.use('/queue', serverAdapter.getRouter());


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
