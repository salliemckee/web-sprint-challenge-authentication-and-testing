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

describe(`[POST] /api/auth/register`, () => {
  it(`creates a user given valid information`, async () => {
    await request(server)
      .post("/api/auth/register")
      .send({ username: "I Am Groot", password: "I Am Groot" });
    let groot = await db("users").where("username", "I Am Groot").first();
    expect(bcrypt.compareSync("I Am Groot", groot.password)).toBeTruthy();
    groot = await db("users")
      .where("username", "I Am Groot")
      .select("username")
      .first();
    expect(groot).toEqual({ username: "I Am Groot" });
  });

  it(`requires a valid username and password to register`, async () => {
    let res = await request(server)
      .post("/api/auth/register")
      .send({ username: "Rocket Raccoon" });
    expect(res.body.message).toMatch(/username and password required/i);
    expect(res.status).toBe(422);
  });
});

describe(`[POST] /api/auth/login`, () => {
  beforeEach(async () => {
    await db("users").insert([
      { username: "I Am Groot", password: bcrypt.hashSync("I Am Groot", 8) },
      {
        username: "Rocket Raccoon",
        password: bcrypt.hashSync("NotARabbit", 8),
      },
    ]);
  });

  it(`permits a user to log in with proper credentials`, async () => {
    let res = await request(server)
      .post("/api/auth/login")
      .send({ username: "I Am Groot", password: "I Am Groot" });
    expect(res.body.message).toMatch(/welcome, I Am Groot/i);
    res = await request(server)
      .post("/api/auth/login")
      .send({ username: "Rocket Raccoon", password: "NotARabbit" });
    expect(res.body.message).toMatch(/welcome, Rocket Raccoon/i);
  });

  it(`requires a valid username and password to log in`, async () => {
    let res = await request(server)
      .post("/api/auth/login")
      .send({ username: "I Am Groot", password: "I AM Groot" });
    expect(res.body.message).toMatch(/invalid credentials/i);
    res = await request(server)
      .post("/api/auth/login")
      .send({ username: "Rocket Raccoon" });
    expect(res.body.message).toMatch(/username and password required/i);
  });
});

describe(`[GET] /api/jokes`, () => {
  beforeEach(async () => {
    await db("users").insert([
      { username: "I Am Groot", password: bcrypt.hashSync("I Am Groot", 8) },
      {
        username: "Rocket Raccoon",
        password: bcrypt.hashSync("NotARabbit", 8),
      },
    ]);
  });

  it(`permits a user to view the jokes when logged in`, async () => {
    const login = await request(server)
      .post("/api/auth/login")
      .send({ username: "I Am Groot", password: "I Am Groot" });
    let getJokes = await request(server)
      .get("/api/jokes")
      .set("Authorization", login.body.token);
    expect(getJokes.body).toHaveLength(3);
    expect(getJokes.body).toMatchObject([
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

  it(`denies access to jokes when not logged in`, async () => {
    let getJokes = await request(server).get("/api/jokes");
    expect(getJokes.body.message).toMatch(/token required/i);

    const login = await request(server)
      .post("/api/auth/login")
      .send({ username: "I Am Groot", password: "I Am Groot" });
    getJokes = await request(server)
      .get("/api/jokes")
      .set("Authorization", login.body.token + 42);
    expect(getJokes.body.message).toMatch(/token invalid/i);
  });
});
