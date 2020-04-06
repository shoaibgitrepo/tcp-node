const winston = require('winston');
const express = require("express");
const app = express();
const net = require("net");
const server = net.createServer();

require("./logging")();
const clients = [];

app.get("/api/clients", (req, res) => {
  if (clients.length === 0) return res.send("No connections found.");

  if (req.query.data)
    for (let key of clients) key.write(req.query.data);

  const sockets = [];
  for (let key of clients) {
    sockets.push({
      remoteAddress: key.remoteAddress,
      remotePort: key.remotePort,
      dateTime: key.dateTime
    });
  }

  res.send(sockets);
});

server.on("connection", client => {
  winston.info(`CONNECTED: ${client.remoteAddress} : ${client.remotePort}`);
  // socket.pipe(socket);

  const dateTime = new Date();
  dateTime.setHours(dateTime.getHours() + 5);
  dateTime.setMinutes(dateTime.getMinutes() + 30);
  client.dateTime = dateTime;

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

    winston.info(`CLOSED: ${client.remoteAddress} : ${client.remotePort}`);
  });

  client.on("error", () => {
    const index = clients.indexOf(client);

    if (index !== -1) clients.splice(index, 1);

    winston.info(`CLOSED: ${client.remoteAddress} : ${client.remotePort}`);
  });
});

// const port = process.env.PORT || 1337;
const portTcp = 1337;
const portHttp = 8080;
// const host = '159.65.150.41';
// const host = '0.0.0.0';

server.listen(portTcp, () => {
  winston.info(`TCP Server is running on port ${portTcp}`);
});

app.listen(portHttp, () => {
  winston.info(`Listening on port ${portHttp}`);
});
