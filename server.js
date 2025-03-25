const express = require("express");
const cors = require("cors");
const coinsRouter = require("./routes/coins");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.use("/api/coins", coinsRouter);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
