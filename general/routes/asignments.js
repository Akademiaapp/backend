import express from "express";
var router = express.Router();

import { prisma } from "../app.js";

// Get all users assignments
router.get("/", function (req, res, next) {
  // TODO add actual asignments
  res.json([]);
});

export default router;
