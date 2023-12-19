import express from "express";
var router = express.Router();

import { prisma } from "../app.js";

/* GET users listing. */
router.get("/", function (req, res, next) {
  prisma.authorizer_users.findMany().then((data) => {
    res.json(data);
  });
});

export default router;
