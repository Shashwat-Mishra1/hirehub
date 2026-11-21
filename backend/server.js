require('dotenv').config();
const express = require('express');
const connectDB = require('./src/config/db');

const app = express();
app.use(express.json());

app.get('/', (req, res) => res.send('Job Portal API is running'));

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});