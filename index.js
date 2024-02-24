const winston = require("winston");
const express = require("express");
const app = express();
const net = require("net");
const server = net.createServer();
const fs = require("fs");

require("./logging")();
const clients = [];

const getDateTime = () => {
  const dateTime = new Date();
  dateTime.setHours(dateTime.getHours() + 5);
  dateTime.setMinutes(dateTime.getMinutes() + 30);
  return dateTime;
};

app.get("/api/clients", (req, res) => {
  if (clients.length === 0) return res.send("No connections found.");

  if (req.query.data) {
    winston.info(`HTTP_DATA: ${req.query.data}`);
    clients.forEach((client) => client.write(req.query.data));
  }

  res.send(
    clients.map(({ remoteAddress, remotePort, dateTime }) => ({
      remoteAddress,
      remotePort,
      dateTime,
    }))
  );
});

app.get("/api/logs", (req, res) => {
  fs.readFile("logfile.log", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    // console.log(data.split("\n"));

    const dataInFile = data
      .split("\n")
      .filter((item) => item)
      .map((item) => JSON.parse(item));
    const response = dataInFile
      .map(
        ({ message, timestamp }) =>
          `<li style="margin-bottom: 10px;">${timestamp} | ${message}</li>`
      )
      .reverse()
      .join("");

    console.log(response);

    res.send(
      `<ol style="font-family: Arial, sans-serif; margin-bottom: 10px">${response}</ol>`
    );
  });
});

server.on("connection", (client) => {
  // winston.info(`CONNECTED: ${client.remoteAddress} : ${client.remotePort}`);
  console.log(`CONNECTED: ${client.remoteAddress} : ${client.remotePort}`);
  // socket.pipe(socket);

  client.dateTime = getDateTime();

  clients.push(client);

  client.on("data", (data) => {
    winston.info(`TCP_DATA: ${data}`);
    // to all sockets
    for (let key of clients) key.write(data);

    // to the socket itself
    client.write(data);
  });

  // Add a 'close' event handler to this instance of socket

  client.on("close", () => {
    const index = clients.indexOf(client);

    if (index !== -1) clients.splice(index, 1);

    // winston.info(`CLOSED: ${client.remoteAddress} : ${client.remotePort}`);
    console.log(`CLOSED: ${client.remoteAddress} : ${client.remotePort}`);
  });

  client.on("error", () => {
    const index = clients.indexOf(client);

    if (index !== -1) clients.splice(index, 1);

    winston.info(`CLOSED: ${client.remoteAddress} : ${client.remotePort}`);
  });
});

const portTcp = 1337;
const portHttp = 8080;

server.listen(portTcp, () => {
  winston.info(`TCP Server is running on port ${portTcp}`);
});

app.listen(portHttp, () => {
  winston.info(`Listening on port ${portHttp}`);
});
