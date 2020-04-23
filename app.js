var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");

var indexRouter = require("./routes/index");
var apiRouter = require("./routes/api");

var app = express();
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

function checkOrigin(origin) {
  console.log("origin: ", (origin ? origin : "DIRECT API CALL"));
  if (!origin || origin.includes("livecovid.in") > 0 || origin.includes("localhost") || origin.includes("netlify.app")) {
    return true;
  } else {
    return false;
  }
}

app.use(function(req, res, next) {
  if (checkOrigin(req.get('origin'))) {
    next();
  } else {
    res.sendStatus(403);
    res.end();
  }
});

app.use(cookieParser());
// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/api", apiRouter);

module.exports = app;
