const userDB = require("../../model/user/userModels");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "arifkhan1234dkkdsfskds";

const userauthenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization;

    const verifyToken = jwt.verify(token, SECRET_KEY);

    const rootUser = await userDB.findOne({ _id: verifyToken._id });

    if (!rootUser) {
      throw new Error("user not found");
    }
    req.token = token;
    req.rootUser = rootUser;
    req.userId = rootUser._id;
    req.userMainId = rootUser.id;
    next();
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "Unauthorized No Token Provide" });
  }
};
module.exports = userauthenticate;
