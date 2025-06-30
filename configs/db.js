const mongoose = require("mongoose");
require("dotenv").config();

exports.connectToDB = async () => {
  try {
    console.log(process.env.MONGO_URI);
    await mongoose
      .connect(process.env.MONGO_URI)
      .then((data) => {
        console.log(`Mongodb connected with server: ${data.connection.host}`);
      })
      .catch((err) => {
        console.log(err.message);
      });
    // console.log("DB connected");
  } catch (error) {
    console.log("Error in DB connection", error.message);
  }
};
