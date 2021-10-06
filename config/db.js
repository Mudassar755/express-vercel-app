const mongoose = require('mongoose');
const config = require('config');
const dotenv = require("dotenv");
dotenv.config();
const db = process.env.MONGO_URL;
const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      // useCreateIndex: true,
      // useFindAndModify: false,
      useUnifiedTopology: true
    })
    console.log('DB Connected')
  }
  catch (err) {
    console.error(err.message);
    //Exit process with faliure
    process.exit(1);
  }
}

module.exports = connectDB;
