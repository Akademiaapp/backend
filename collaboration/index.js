import { Hocuspocus } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";

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
      return;
    }
    console.log(decodedToken);
    
    // Check if user has access to document
    const document = await prisma.documents.findFirst({
      where: { name: documentName },
    });

    console.log(document);

    if (!document) {
      throw new Error("Unauthorized - Document not found");
      return;
    }

    const user = await prisma.authorizer_users.findFirst({
      where: { id: decodedToken.sub },
    });

    if (!user) {
      throw new Error("Unauthorized - User not found");
      return;
    }

    if (document.userId !== user.id) {
      throw new Error("Unauthorized - User does not have access to document");
      return;
    }

    // Return user id
    return user.id;
  },
  extensions: [
    new Database({
      fetch: async ({ documentName }) => {
        return new Promise((resolve, reject) => {
          prisma.documents
            .findFirst({ where: { name: documentName } })
            .then((document) => {
              if (!document) {
                return resolve(null);
              }
              resolve(new Uint8Array(document.data));
            })
            .catch((err) => {
              reject(err);
            });
        });
      },
      store: async ({ documentName, state }) => {
        return new Promise((resolve, reject) => {
          prisma.documents
            .upsert({
              where: { name: documentName },
              update: { data: state },
              create: { name: documentName, data: state },
            })
            .then((document) => {
              resolve();
            })
            .catch((err) => {
              reject(err);
            });
        });
      },
    }),
  ],
});

// … and run it!
server.listen();
