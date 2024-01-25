import express from "express";
var router = express.Router();

import { prisma } from "../app.js";

// Get all users documents
router.get("/", async function (req, res, next) {
  const owned_documents = await prisma.documents.findMany({
    where: {
      user_id: req.user.sub,
    },
  });

  const shared_documents = await prisma.document_permissions.findMany({
    where: {
      user_id: req.user.sub,
    },
  });

  const test_document = await prisma.documents.findFirst({
    where: {
      id: "Test",
    },
  });

  // Combine the owned_documents and shared_documents and test_document
  const documents = owned_documents
    .concat(shared_documents)
    .concat(test_document);

  // Remove duplicates
  documents.filter((document, index) => {
    return (
      documents.findIndex((document2) => {
        return document.id === document2.id;
      }) === index
    );
  });

  // Remove documents that have assignments
  const assignments = await prisma.assignments.findMany();
  assignments.forEach((assignment) => {
    documents.forEach((document, index) => {
      if (document.id === assignment.document_id) {
        documents.splice(index, 1);
      }
    });
  });

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
router.get("/:id", function (req, res, next) {
  const { id } = req.params;
  console.log(id);
  prisma.documents
    .findFirst({
      where: {
        id: id,
      },
    })
    .then((data) => {
      res.json(data);
    });
});

// Rename document - Update
router.put("/:id", function (req, res, next) {
  const { id } = req.params;
  const { name } = req.query;
  prisma.documents
    .update({
      where: {
        id: id,
      },
      data: {
        name: name,
      },
    })
    .then((data) => {
      res.json(data);
    });
});

// Delete document - Delete
router.delete("/:id", async function (req, res, next) {
  const { id } = req.params;

  // Check if the user has access to the document
  const document = await prisma.documents.findFirst({
    where: { id: id },
  });
  if (req.user.sub != document.user_id) {
    throw new Error("Unauthorized - User does not have access to document");
  }

  prisma.documents
    .delete({
      where: {
        id: id,
      },
    })
    .then((data) => {
      res.json(data);
    });
});

// Add user to document - Update
// Create a new document_permissions for a user to the document
router.put("/:id/users", async function (req, res, next) {
  const { id } = req.params;
  const { user_email } = req.query;

  // Check if the user has access to the document
  const document = await prisma.documents.findFirst({
    where: { id: id },
  });
  if (req.user.sub != document.user_id) {
    throw new Error("Unauthorized - User does not have access to document");
  }

  // Get user_id from user_email
  const user = await prisma.authorizer_users.findFirst({
    where: { email: user_email },
  });
  console.log(user)
  if (!user) {
    res.status(502).json('User not found')

  }

  prisma.document_permissions
    .create({
      data: {
        document_id: id,
        user_id: user.id,
        permission: "WRITE",
      },
    })
    .then((data) => {
      res.json(data);
    });
});

// Get users with access to document - Read
router.get("/:id/users", async function (req, res, next) {
  const { id } = req.params;

  // Check if the user has access to the document
  const document = await prisma.documents.findFirst({
    where: { id: id },
  });
  if (req.user.sub != document.user_id) {
    throw new Error("Unauthorized - User does not have access to document");
  }

  const users = await prisma.document_permissions.findMany({
    where: {
      document_id: id,
    },
  });

  res.json(users);
});

export default router;
