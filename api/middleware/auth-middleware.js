const User = require("../auth/user-model");

async function checkUsernameFree(req, res, next) {
  try {
    const users = await User.findBy({ username: req.body.username });
    if (!users.length) {
      next();
    } else {
      res.status(422).json({ message: "username taken" });
    }
  } catch (err) {
    next(err);
  }
}

module.exports = { checkUsernameFree };
