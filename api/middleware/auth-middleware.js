const User = require("../auth/user-model");
const { findBy } = require("../auth/user-model");

async function checkUsernameFree(req, res, next) {
  try {
    const users = await User.findBy({ username: req.body.username });
    if (!users.length) {
      next();
    } else {
      next({ message: "username taken", status: 422 });
    }
  } catch (err) {
    next(err);
  }
}

const checkUsernameExists = async (req, res, next) => {
  try {
    const [user] = await findBy({ username: req.body.username });
    if (!user) {
      next({ status: 401, message: "invalid credentials" });
    } else {
      req.user = user;
    }
  } catch (err) {
    next(err);
  }
};

module.exports = { checkUsernameFree, checkUsernameExists };
