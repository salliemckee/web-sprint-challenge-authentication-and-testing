const router = require("express").Router();
const { JWT_SECRET } = require("../secrets");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./user-model");
const { checkUsernameFree } = require("../middleware/auth-middleware");

router.post("/register", checkUsernameFree, (req, res, next) => {
  if (!req.body.username || !req.body.password) {
    res.status(422).json({ message: "username and password required" });
  } else {
    const hash = bcrypt.hashSync(req.body.password, 8);
    User.add({ username: req.body.username, password: hash })
      .then((newUser) => {
        res.status(201).json(newUser);
      })
      .catch(next);
  }
});

router.post("/login", (req, res, next) => {
  if (!req.body.username || !req.body.password) {
    res.status(422).json({ message: "username and password required" });
  } else {
    const username = req.body.username;
    User.findByUsername(username)
      .then(([user]) => {
        const token = buildToken(user);
        if (bcrypt.compareSync(req.body.password, user.password)) {
          res.json({ message: `welcome ${req.body.username}`, token });
        }
      })
      .catch(res.status(401).json({ message: "invalid credentials" }));
  }
});

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
