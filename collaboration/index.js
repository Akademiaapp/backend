"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("@hocuspocus/server");
// Configure the server …
const server = new server_1.Hocuspocus({
    port: 1234,
});
// … and run it!
server.listen();
