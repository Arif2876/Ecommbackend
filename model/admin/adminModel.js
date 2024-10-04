const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.ADMIN_SECRET_KEY;

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("not valid Email");
      }
    },
  },

  profile: {
    type: String,
    require: true,
  },
  mobile: {
    type: String,
    require: true,
    unique: true,
    minlength: 10,
    maxlength: 10,
  },
  password: {
    type: String,
    require: true,
  },
  tokens: [
    {
      token: {
        type: String,
        require: true,
      },
    },
  ],
});

// password hashing
adminSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});
// token generate
adminSchema.methods.generateAuthToken = async function () {
  try {
    let newtoken = jwt.sign({ _id: this._id }, SECRET_KEY, {
      expiresIn: "1d",
    });
    this.tokens = this.tokens.concat({ token: newtoken });
    await this.save();
    return newtoken;
  } catch (error) {
    res.status(400).json({ error, error });
  }
};

const adminDB = new mongoose.model("admins", adminSchema);
module.exports = adminDB;

// this.tokens=this.tokens.concat({token:newtoken})
// [].concat({token:"djjdskgvsvv"})
// [[token:"djjdskgvsvv"]]
