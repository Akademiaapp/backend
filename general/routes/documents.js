import express from "express";
var router = express.Router();

import { prisma } from "../app.js";

// Get all users documents
router.get("/", async function (req, res, next) {
  const owned_documents = (await prisma.documents
    .findMany({
      where: {
        user_id: req.user.sub,
      },
  }));

  const shared_documents = (await prisma.document_permissions.findMany({
    where: {
      user_id: req.user.sub,
    },
  }));

  const test_document = (await prisma.documents.findFirst({
    where: {
      name: "Test",
    },
  }));

  // Combine the owned_documents and shared_documents and test_document
  const documents = owned_documents.concat(shared_documents).concat(test_document);

  res.json(documents);
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
router.delete("/:name", async function (req, res, next) {
  const { name } = req.params;

  // Check if the user has access to the document
  const document = await prisma.documents.findFirst({
    where: { name: name },
  });
  if (req.user.sub != document.user_id) {
    throw new Error("Unauthorized - User does not have access to document");
  }

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
router.put("/:name/users", async function (req, res, next) {
  const { name } = req.params;
  const { user_email } = req.query;

  // Check if the user has access to the document
  const document = await prisma.documents.findFirst({
    where: { name: name },
  });
  if (req.user.sub != document.user_id) {
    throw new Error("Unauthorized - User does not have access to document");
  }

  // Get user_id from user_email
  const user = await prisma.users.findFirst({
    where: { email: user_email },
  });

  prisma.document_permissions
    .create({
      data: {
        document_name: name,
        user_id: user.id,
        permission: "WRITE",
      },
    })
    .then((data) => {
      res.json(data);
    });
});

export default router;
