import express from "express";
var router = express.Router();

import { prisma } from "../app.js";

// Get all users assignments
router.get("/", function (req, res, next) {
  const user_id = req.user.sub;
  
  prisma.assignment_answers.findMany({
    where: {
      student_id: user_id,
    },
  }).then((data) => {
    res.json(data);
  });
});

// Create assignment - Create
router.post("/", function (req, res, next) {
  const user_id = req.user.sub;
  
  // Validate that the user is a teacher
  prisma.authorizer_users.findFirst({
    where: {
      id: user_id,
    },
  }).then((data) => {
    if (data == null) {
      res.status(401).json({ message: "Unauthorized - User is not a teacher" });
      return;
    } else {
      const { name, document_id, due_date } = req.query;

      // Validate that name and document are provided
      if (name == null || document_id == null || due_date == null) {
        res
          .status(400)
          .json({ message: "Bad request - Missing name, document_id or due_date" });
        return;
      }

      // Validate that the due_date is a valid iso date
      if (!BigInt(new Date(due_date).valueOf())) {
        res.status(400).json({ message: "Bad request - Invalid due_date" });
        return;
      }

      // Validate that the document exists
      prisma.documents
        .findFirst({
          where: {
            id: document_id,
          },
        })
        .then((data) => {
          if (data == null) {
            res.status(404).json({ message: "Document not found" });
            return;
          }
        });

      prisma.assignments
        .create({
          data: {
            name: name,
            assignment_document_id: document_id,
            teacher_id: user_id,
            due_date: BigInt(Date.parse(due_date).valueOf()),
          },
        })
        .then((assignment_data) => {
          // Create assignment answers for all students
          prisma.authorizer_users
            .findMany({
              where: {
                roles: { contains: "student" },
              },
            })
            .then((students) => {
              students.forEach((student) => {
                prisma.assignment_answers
                  .create({
                    data: {
                      assignment_id: assignment_data.id,
                      student_id: student.id,
                      status: "NOT_STARTED",
                    },
                  });
              });
            });
        });
    }
  });

  res.status(201).json({ message: "Assignment created" });
});

export default router;
