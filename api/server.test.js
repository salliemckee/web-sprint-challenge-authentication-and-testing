const request = require("supertest");
const db = require("../data/dbConfig");
const server = require("./server");

// Write your tests here
test("sanity", () => {
  expect(true).toBe(true);
});

const sallieTest = { username: "salliemckee", password: "password" };
const sallieTestBad = { username: "", password: "" };
