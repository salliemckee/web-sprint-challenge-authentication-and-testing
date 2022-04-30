const db = require("../../data/dbConfig");

function find() {
  return db("users");
}

function findBy(filter) {
  return db("users").where(filter);
}

function findByUsername(username) {
  return db("users").where("username", username);
}

function findById(user_id) {
  return db("users").where("user_id", user_id).first();
}

async function add(user) {
  const [id] = await db("users").insert(user);
  return findById(id);
}

module.exports = { find, findBy, findById, add, findByUsername };
