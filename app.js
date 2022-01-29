const express = require("express");
const app = express();
app.use(express.json());
const axios = require("axios");
const {
  models: { User, Note },
} = require("./db");
const path = require("path");

app.use(express.json());

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.post("/api/auth", async (req, res, next) => {
  try {
    res.send({ token: await User.authenticate(req.body) });
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/auth", async (req, res, next) => {
  try {
    res.send(await User.byToken(req.headers.authorization));
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/users/:id/notes", async (req, res, next) => {
  try {
    const user = await User.byToken(req.headers.authorization);
    console.log(req.headers, "THIS IS THE REQBODY");
    const notes = await Note.findAll({
      where: {
        userId: user.id,
      },
    });
    res.send(notes);
  } catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
