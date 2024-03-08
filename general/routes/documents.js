import express from "express";
var router = express.Router();

import { prisma } from "../app.js";
import * as Y from "yjs"
import { yDocToProsemirrorJSON } from "y-prosemirror";

// Get all users documents
router.get("/", async function (req, res, next) {
  const file_permissions = await prisma.file_permission.findMany({
    where: {
      user_id: req.user.sub,
    },
  });

  // Get the actual documents from the document permissions 
  let documents = [];
  for (let file_permission of file_permissions) {
    try {
      let document = await prisma.document.findFirst({
        where: {
          id: file_permission.document_id,
        },
      });
      documents.push(document);
    } catch (error) {
      console.error("Error retrieving document:", error);
    }
  }
  // Remove duplicates
  documents.filter((document, index) => {
    return (
      documents.findIndex((document2) => {
        return document.id === document2.id;
      }) === index
    );
  });

  console.log("total documents: ", documents);

  res.json(documents);
});

// Create document - Create
router.post("/", function (req, res, next) {
  const { name, user_id } = req.query;
  prisma.document
    .create({
      data: {
        name: name,
        data: Buffer.from(""),
        created_at: new Date().getTime(),
        updated_at: new Date().getTime()
      },
    })
    .then((data) => {
      // Add the user to the document
      prisma.file_permission
        .create({
          data: {
            document_id: data.id,
            user_id: user_id,
            permission: "OWNER",
          },
        })
        .then(() => {
          res.json(data);
        });
    });
});

// Get document - Read
router.get("/:id", function (req, res, next) {
  let { id } = req.params;
  console.log(id);
  prisma.document
    .findFirst({
      where: {
        id: id,
      },
    })
    .then((data) => {
      res.json(data);
    });
});

// Get document json - Read
router.get("/:id/json", function (req, res, next) {
  let { id } = req.params;
  id = id.split('.')[1]
  prisma.document
    .findFirst({
      where: {
        id: id,
      },
    })
    .then((data) => {
      console.log(data);
      const ydoc = new Y.Doc()
      ydoc.applyUpdate(data.data)
      let json = yDocToProsemirrorJSON(yjsdoc);
      console.log(json);
      res.json(json);
    });
});

// Rename document - Update
router.put("/:id", function (req, res, next) {
  let { id } = req.params;
  id = id.split('.')[1]
  const { name } = req.query;
  prisma.document
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
  let { id } = req.params;
  id = id.split('.')[1]

  // Check if the user has access to the document
  const document = await prisma.document.findFirst({
    where: { id: id },
    include: {
      permissions: true,
    },
  });

  const permission = document.permissions.find((permission) => {
    return permission.user_id == req.user.sub;
  });

  if (!permission && permission.permission != "OWNER") {
    throw new Error("Unauthorized - User does not have access to document");
  }

  prisma.document
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
  let { id } = req.params;
  id = id.split('.')[1];
  const { user_email } = req.query;

  // Check if the user has access to the document
  const document = await prisma.document.findFirst({
    where: { id: id },
    include: {
      permissions: true,
    },
  });

  if (!document) {
    throw new Error("Unauthorized - document dosnt exist");
  }

  const permission = document.permissions.find((permission) => {
    return permission.user_id == req.user.sub;
  });

  if (!permission && permission.permission != "OWNER") {
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

  prisma.file_permission
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
  let { id } = req.params;

  id = id.split('.')[1]

  // Check if the user has access to the document, is the owner or has been shared the document
  const document = await prisma.document.findFirst({
    where: { id: id },
    include: {
      permissions: true,
    },
  });

  if (!document) {
    throw new Error('Document not found');
  }

  const permission = document.permissions.find((permission) => {
    return permission.user_id == req.user.sub;
  });

  if (
    !permission &&
    !prisma.file_permission.findFirst({
      where: {
        user_id: req.user.sub,
        document_id: id,
      },
    })
  ) {
    res
      .status(502)
      .json("Unauthorized - User does not have access to document");
    return;
  }

  const permissions = await prisma.file_permission.findMany({
    where: {
      document_id: id,
    },
  });

  // Get the actual users from permission
  const users = [];
  permissions.forEach(async (permission) => {
    const user = await prisma.authorizer_users.findFirst({
      where: {
        id: permission.user_id,
      },
    });
    user.permission = permission.permission;
    users.push(user);
  });

  // Add the owner of the document
  const owner = await prisma.authorizer_users.findFirst({
    where: {
      id: document.user_id,
    },
  });
  owner.permission = "OWNER";
  users.push(owner);

  res.json(users);
});

export default router;
