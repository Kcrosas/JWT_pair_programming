const Sequelize = require("sequelize");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const axios = require("axios");

const { STRING } = Sequelize;
const config = {
  logging: false,
};

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || "postgres://localhost/acme_db",
  config
);

const Note = conn.define("note", {
  text: STRING,
});

const User = conn.define("user", {
  username: STRING,
  password: STRING,
});

Note.belongsTo(User);
User.hasMany(Note);

User.addHook("beforeSave", async function (user) {
  if (user._changed.has("password")) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

User.byToken = async (token) => {
  try {
    console.log("THIS IS THE token in byToken", token);
    const { id } = await jwt.verify(token, process.env.JWT);
    console.log("THIS IS THE ID in byToken", id);
    const user = await User.findByPk(id);
    if (user) {
      return user;
    }
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
  const user = await User.findOne({
    where: {
      username,
    },
  });
  console.log("THIS IS THE USER ID in authenticate", user.id);
  if (user && bcrypt.compare(password, user.password)) {
    return jwt.sign({ id: user.id }, process.env.JWT);
  }
  const error = Error("bad credentials");
  error.status = 401;
  throw error;
};

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: "lucy", password: "lucy_pw" },
    { username: "moe", password: "moe_pw" },
    { username: "larry", password: "larry_pw" },
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  const notes = ["Pie", "Custard", "Ball"];
  const [Pie, Custard, Ball] = await Promise.all(
    notes.map((note) => Note.create({ text: note }))
  );
  Pie.userId = lucy.id;
  Pie.save();
  Custard.userId = moe.id;
  Custard.save();
  Ball.userId = larry.id;
  Ball.save();

  return {
    users: {
      lucy,
      moe,
      larry,
    },
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note,
  },
};
