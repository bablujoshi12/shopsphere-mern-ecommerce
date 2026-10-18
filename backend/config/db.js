const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connect DB");
  } catch (err) {
    console.log("DB ERROR:", err.message);
    process.exit(1);
  }
};

module.exports = connectDb;
