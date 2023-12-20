import { Hocuspocus } from "@hocuspocus/server";

import middleware from "./middleware.js";

// Prisma
import { PrismaClient } from "@prisma/client";
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
    console.log(data)
    const { token, documentName } = data;

    // Check if token is valid
    const decodedToken = middleware.verifyToken(token);
    if (!decodedToken) {
      throw new Error("Unauthorized - Token verification failed");
    }
    console.log(decodedToken);
    
    // Check if user has access to document
    const document = await prisma.documents.findFirst({
      where: { name: documentName },
    });

    console.log(document);

    const user = await prisma.authorizer_users.findFirst({
      where: { id: decodedToken.sub },
    });

    if (!document) {
      return user.id;
    }

    if (!user) {
      throw new Error("Unauthorized - User not found");
    }
    
    if (document.user_id == null) {
      return user.id;
    }

    if (document.user_id !== user.id) {
      throw new Error("Unauthorized - User does not have access to document");
    }

    // Return user id
    return user.id;
  },
  onLoadDocument: async (data) => {
    console.log(data);
    prisma.documents
      .findFirst({ where: { name: documentName } })
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
      .upsert({
        where: { name: documentName },
        update: { data: Buffer.from(Y.encodeStateAsUpdate(data.document)) },
        create: { name: documentName, data: state },
      })
  },
});

// … and run it!
server.listen();
