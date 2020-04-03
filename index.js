const express = require("express");
const app = express();
const net = require("net");
const server = net.createServer();

const clients = [];

app.get("/api/clients", (req, res) => {
  if (clients.length === 0) return res.send("No connections found.");

  for (let key of clients) key.write(req.query.data);

  const sockets = [];
  for (let client of clients) {
    sockets.push({
      remoteAddress: client.remoteAddress,
      remotePort: client.remotePort
    });
  }

  res.send(sockets);
});

server.on("connection", client => {
  console.log(`CONNECTED: ${client.remoteAddress} : ${client.remotePort}`);
  // socket.pipe(socket);
  clients.push(client);

  client.on("data", data => {
    // to all sockets
    for (let key of clients) key.write(data);

    // to the socket itself
    client.write(data);
  });

  // Add a 'close' event handler to this instance of socket

  client.on("close", () => {
    const index = clients.indexOf(client);

    if (index !== -1) clients.splice(index, 1);

    console.log(`CLOSED: ${client.remoteAddress} : ${client.remotePort}`);
  });

  client.on("error", () => {
    const index = clients.indexOf(client);

    if (index !== -1) clients.splice(index, 1);

    console.log(`CLOSED: ${client.remoteAddress} : ${client.remotePort}`);
  });
});

// const port = process.env.PORT || 1337;
const portTcp = 1337;
const portHttp = 8080;

server.listen(portTcp, () => {
  console.log(`TCP Server is running on port ${portTcp}`);
});

app.listen(portHttp, () => {
  console.log(`Listening on port ${portHttp}`);
});
