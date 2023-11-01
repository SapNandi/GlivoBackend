const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const cors = require("cors");

const errorMiddleware = require("./Middleware/error");

// Middleware
// app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(
  cors({ origin: "https://glivo-frontend-testing.vercel.app", credentials: true })
);
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

// Route Imports
const lawyerRoute = require("./routes/LawyerRoute");
const userRoute = require("./routes/UserRoute");
const orderRoute = require("./routes/OrderRoute");
app.use("/api/v1", lawyerRoute);
app.use("/api/v1", userRoute);
app.use("/api/v1", orderRoute);

// Error Middleware
app.use(errorMiddleware);

module.exports = app;
