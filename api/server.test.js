const db = require("../data/dbConfig");
const request = require("supertest");
const server = require("./server");
const bcrypt = require("bcryptjs");

beforeAll(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
});
beforeEach(async () => {
  await db("users").truncate();
});
afterAll(async () => {
  await db.destroy();
});

test("sanity", () => {
  expect(true).toBe(true);
});

describe(`[POST] - /api/auth/register`, () => {
  it(`creates a user with valid credentials`, async () => {
    await request(server)
      .post("/api/auth/register")
      .send({ username: "sallie", password: "sallie" });
    let sallieTest = await db("users").where("username", "sallie").first();
    expect(bcrypt.compareSync("sallie", sallieTest.password)).toBeTruthy();
    sallieTest = await db("users")
      .where("username", "sallie")
      .select("username")
      .first();
    expect(sallieTest).toEqual({ username: "sallie" });
  });

  it(`requires a valid username and password to register`, async () => {
    let res = await request(server)
      .post("/api/auth/register")
      .send({ username: "zuko" });
    expect(res.body.message).toMatch(/username and password required/i);
    expect(res.status).toBe(422);
  });
});

describe(`[POST] - /api/auth/login`, () => {
  beforeEach(async () => {
    await db("users").insert([
      { username: "sallie", password: bcrypt.hashSync("sallie", 8) },
      {
        username: "zuko",
        password: bcrypt.hashSync("zuko", 8),
      },
    ]);
  });

  it(`user can log in with valid credentials`, async () => {
    let res = await request(server)
      .post("/api/auth/login")
      .send({ username: "sallie", password: "sallie" });
    expect(res.body.message).toMatch(/welcome, sallie/i);
    res = await request(server)
      .post("/api/auth/login")
      .send({ username: "zuko", password: "zuko" });
    expect(res.body.message).toMatch(/welcome, zuko/i);
  });

  it(`requires a valid username and password to log in`, async () => {
    let res = await request(server)
      .post("/api/auth/login")
      .send({ username: "sallie", password: "SaLlIe" });
    expect(res.body.message).toMatch(/invalid credentials/i);
    res = await request(server)
      .post("/api/auth/login")
      .send({ username: "zuko" });
    expect(res.body.message).toMatch(/username and password required/i);
  });
});

describe(`[GET] /api/jokes`, () => {
  beforeEach(async () => {
    await db("users").insert([
      { username: "sallie", password: bcrypt.hashSync("sallie", 8) },
      {
        username: "zuko",
        password: bcrypt.hashSync("zuko", 8),
      },
    ]);
  });

  it(`user can view jokes while logged in`, async () => {
    const login = await request(server)
      .post("/api/auth/login")
      .send({ username: "sallie", password: "sallie" });
    let jokes = await request(server)
      .get("/api/jokes")
      .set("Authorization", login.body.token);
    expect(jokes.body).toHaveLength(3);
    expect(jokes.body).toMatchObject([
      {
        id: "0189hNRf2g",
        joke: "I'm tired of following my dreams. I'm just going to ask them where they are going and meet up with them later.",
      },
      {
        id: "08EQZ8EQukb",
        joke: "Did you hear about the guy whose whole left side was cut off? He's all right now.",
      },
      {
        id: "08xHQCdx5Ed",
        joke: "Why didn’t the skeleton cross the road? Because he had no guts.",
      },
    ]);
  });

  it(`blocks access to jokes when not logged in`, async () => {
    let jokes = await request(server).get("/api/jokes");
    expect(jokes.body.message).toMatch(/token required/i);

    const login = await request(server)
      .post("/api/auth/login")
      .send({ username: "sallie", password: "sallie" });
    jokes = await request(server)
      .get("/api/jokes")
      .set("Authorization", login.body.token + 42);
    expect(jokes.body.message).toMatch(/token invalid/i);
  });
});
