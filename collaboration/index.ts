import { Hocuspocus } from "@hocuspocus/server";

// Configure the server …
const server = new Hocuspocus({
  port: 1234,
  address: 'localhost',
});

// … and run it!
server.listen();