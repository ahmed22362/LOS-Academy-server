import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";

dotenv.config();
const app = express();

// middleware for parsing application/x-www-form-urlencoded
app.use("/stripe/webhook", bodyParser.raw({ type: "application/json" }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());
// middleware for json body parsing

//logging
if (process.env.NODE_ENV?.trim() === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan(
      ":date[web] :remote-addr :method :url :status :response-time ms - :res[content-length]",
    ),
  );
}
// Set default engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(
  cors({
    origin: [
      /http:\/\/localhost:\d*/,
      "https://los-academy.vercel.app",
      "https://www.los-academy.net/",
    ],
    optionsSuccessStatus: 200,
  }),
);

export default app;
