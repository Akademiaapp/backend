import { Hocuspocus } from "@hocuspocus/server";

import middleware from "./middleware.js";
import * as Y from "yjs";

// Prisma
import { PrismaClient } from "../node_modules/.prisma/client/index.js";
export const prisma = new PrismaClient();

// Fix bigint issue
BigInt.prototype.toJSON = function () {
  return this.toString(); // Simply converts bigints to strings
};

prisma.$connect().then(() => {
  console.log("Prisma connected");
});

// Configure the server …
const server = new Hocuspocus({
  port: 8090,
  address: "localhost",
  onAuthenticate: async (data) => {
    const { token, documentName } = data;

    // Check if token is valid
    const decodedToken = middleware.verifyToken(token);
    if (!decodedToken) {
      throw new Error("Unauthorized - Token verification failed");
    }

    // Check if user has access to document
    const document = await prisma.documents.findFirst({
      where: { id: documentName },
    });

    const user = await prisma.authorizer_users.findFirst({
      where: { id: decodedToken.sub },
    });
    
    if (documentName == "Test") {
      return {
        user: user,
      };
    }

    if (!document) {
      throw new Error("Unauthorized - Document not found");
    }

    if (!user) {
      throw new Error("Unauthorized - User not found");
    }

    if (document.user_id == null) {
      throw new Error("Unauthorized - Document has no owner");
    }

    if (document.user_id !== user.id) {
      if (
        await prisma.document_permissions.findFirst({
          where: { document_id: document.id, user_id: user.id },
        })
      ) {
      } else {
        throw new Error("Unauthorized - User does not have access to document");
      }
    }

    // Return user id
    data.context["user"] = user;
    return {
      user: user,
    };
  },
  onLoadDocument: async (data) => {
    const { documentName } = data;
    prisma.documents
      .findFirst({ where: { id: documentName } })
      .then((document) => {
        if (!document) {
          return data.document;
        }
        Y.applyUpdate(data.document, new Uint8Array(document.data));
      })
      .catch(() => {
        return data.document;
      });
  },
  onStoreDocument: async (data) => {
    prisma.documents
      .update({
        where: { id: data.documentName },
        data: { data: Buffer.from(Y.encodeStateAsUpdate(data.document)) },
      })
      .catch((err) => {
        throw new Error(err);
      });
  },
});

// … and run it!
server.listen();
