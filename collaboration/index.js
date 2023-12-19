import { Hocuspocus } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";

// Prisma
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();

// Fix bigint issue 
BigInt.prototype.toJSON = function () {
  return this.toString(); // Simply converts bigints to strings
};

// Configure the server …
const server = new Hocuspocus({
  port: 8090,
  address: "localhost",
  extensions: [
    new Database({
      fetch: async ({ documentName }) => {
        return new Promise((resolve, reject) => {
            prisma.documents.findFirst({ where: { name: documentName } }).then((document) => {
                resolve(new Uint8Array(document.data()));
            }).catch((err) => {
                reject(err);
            })
        });
      },
      store: async ({ documentName, state }) => {
        return new Promise((resolve, reject) => {
            prisma.documents.upsert({
                where: { name: documentName },
                update: { data: state },
                create: { name: documentName, data: state },
            }).then((document) => {
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
      },
    }),
  ],
});

// … and run it!
server.listen();
