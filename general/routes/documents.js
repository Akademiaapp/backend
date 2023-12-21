import express from "express";
var router = express.Router();

import { prisma } from "../app.js";

// Get all users documents
router.get("/", function (req, res, next) {
  prisma.documents
    .findMany({
      where: {
        user_id: req.user.sub,
      },
    })
    .then((data) => {
      res.json(data);
    });
});

// Create document - Create
router.post("/", function (req, res, next) {
  const { name, user_id } = req.query;
  prisma.documents
    .create({
      data: {
        name: name,
        data: Buffer.from(""),
        created_at: new Date().getTime(),
        updated_at: new Date().getTime(),
        user_id: user_id,
      },
    })
    .then((data) => {
      res.json(data);
    });
});

// Get document - Read
router.get("/:name", function (req, res, next) {
  const { name } = req.params;
  prisma.documents
    .findFirst({
      where: {
        name: name,
      },
    })
    .then((data) => {
      res.json(data);
    });
});

// Rename document - Update
router.put("/:name", function (req, res, next) {
  const { name } = req.params;
  const { new_name } = req.query;
  prisma.documents
    .update({
      where: {
        name: name,
      },
      data: {
        name: new_name,
      },
    })
    .then((data) => {
      res.json(data);
    });
});

// Delete document - Delete
router.delete("/:name", function (req, res, next) {
  const { name } = req.params;
  prisma.documents
    .delete({
      where: {
        name: name,
      },
    })
    .then((data) => {
      res.json(data);
    });
});

// Add user to document - Update
// Create a new document_permissions for a user to the document
router.put("/:name/users", function (req, res, next) {
  const { name } = req.params;
  const { user_id } = req.query;
  prisma.document_permissions
    .create({
      data: {
        document_name: name,
        user_id: user_id,
        permission: "WRITE",
      },
    })
    .then((data) => {
      res.json(data);
    });
});

export default router;
