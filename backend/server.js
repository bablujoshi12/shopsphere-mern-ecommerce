require("dotenv").config();

const connectDb = require("./config/db");
const app = require("./app");

const port = process.env.PORT;

const startServer = async () => {
  await connectDb();

  app.listen(port, () => {
    console.log(`app listening on port: ${port}`);
  });
};

startServer();
