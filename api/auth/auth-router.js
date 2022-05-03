const router = require("express").Router();
const {
  checkUsernameFree,
  checkCredentials,
  checkRegisteredUser,
} = require("../middleware/auth-middleware");
const User = require("./user-model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../secrets");

router.post(
  "/register",
  checkUsernameFree,
  checkCredentials,
  (req, res, next) => {
    const { username, password } = req.body;
    const trimUser = username.trim();
    const hash = bcrypt.hashSync(password, 8);

    User.add({ username: trimUser, password: hash })
      .then((user) => {
        res.status(201).json(user);
      })
      .catch(next);
  }
);

router.post(
  "/login",
  checkCredentials,
  checkRegisteredUser,
  (req, res, next) => {
    const { username } = req.body;

    User.findBy({ username })
      .then(([user]) => {
        const token = buildToken(user);
        res.json({
          message: `welcome, ${user.username}`,
          token,
        });
      })
      .catch(next);
  }
);

function buildToken(user) {
  const payload = {
    subject: user.id,
    username: user.username,
  };
  const options = {
    expiresIn: "1d",
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

module.exports = router;
