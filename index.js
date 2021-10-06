const express = require('express')
const auth = require("./api/auth")
const connectDB = require('./config/db');
// var cors = require("cors");
// var helmet = require('helmet')
// const dotenv = require("dotenv");

// dotenv.config();

const app = express();
// app.use(helmet())
//Connect MongoDB
connectDB();
app.use(express.json({extended: false}))

app.use("/api/auth", auth)
const PORT = process.env.PORT || 5002;

app.listen(PORT, () => console.log(`Server is up and running on the port ${PORT}`));