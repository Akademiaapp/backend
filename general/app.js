import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";

import middleware from "./middleware.js";
import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";
import documentsRouter from "./routes/documents.js";
import assignmentsRouter from "./routes/assignments.js";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Prisma
import { PrismaClient } from "../node_modules/.prisma/client/index.js";
export const prisma = new PrismaClient();

// Fix bigint issue 
BigInt.prototype.toJSON = function () {
  return this.toString(); // Simply converts bigints to strings
};

var app = express();

app.use(cors()); // Enable CORS

app.get('/test_colab', async (req, res, next) => {
  const status = await fetch('http://localhost:8090/')
  if (status.statusText == "OK") {
    res.status(200).json('All good');
  } else {
    res.status(500).json('Not good');
  }
});

app.use(middleware.verifyToken); // Apply the middleware to all routes

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/documents", documentsRouter);
app.use("/assignments", assignmentsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
});

export default app;
