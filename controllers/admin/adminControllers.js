const adminDB = require("../../model/admin/adminModel");
const cloudinary = require("../../cloudinary/cloudinary");
const bcrypt = require("bcryptjs");
const { CurrencyCodes } = require("validator/lib/isISO4217");

// register Controller
exports.Register = async (req, res) => {
  const { name, email, mobile, password, confirmpassword } = req.body;

  if (
    !name ||
    !email ||
    !mobile ||
    !password ||
    !confirmpassword ||
    !req.file
  ) {
    res.status(400).json({ error: "all file are requird" });
  }
  const file = req.file?.path;
  const upload = await cloudinary.uploader.upload(file);
  try {
    const preuser = await adminDB.findOne({ email: email });

    const mobileverification = await adminDB.findOne({ mobile: mobile });

    if (preuser) {
      res.status(400).json({ error: "This Admin is Already exit" });
    } else if (mobileverification) {
      res.status(400).json({ error: "This Mobile is Already exit" });
    } else if (password !== confirmpassword) {
      res.status(400).json({ error: "This password is Already exit" });
    } else {
      const adminData = new adminDB({
        name,
        email,
        mobile,
        password,
        profile: upload.secure_url,
      });

      await adminData.save();
      res.status(200).json(adminData);
    }
  } catch (error) {
    res.status(400).json(error);
  }
};

//Login Controller
exports.Login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "All field are require" });
  }
  try {
    const adminValid = await adminDB.findOne({ email: email });

    if (adminValid) {
      const isMatch = await bcrypt.compare(password, adminValid.password);

      if (!isMatch) {
        res.status(400).json({ error: "Invalid details " });
      } else {
        // token generate
        const token = await adminValid.generateAuthToken();
        const result = {
          adminValid,
          token,
        };
        res.status(200).json(result);
      }
    } else {
      res.status(400).json({ error: "Invalid details" });
    }
  } catch (error) {
    res.status(400).json(error);
  }
};

exports.AdminVerify = async (req, res) => {
  try {
    const verifyAdmin = await adminDB.findOne({ _id: req.userId });
    res.status(200).json(verifyAdmin);
  } catch (error) {
    res.status(400).json({ error: "invalid Details" });
  }
};

// Admin Logout Controller
exports.Logout = async (req, res) => {
  try {
    req.rootUser.tokens = req.rootUser.tokens.filter((CurrentElement) => {
      return CurrentElement.token !== req.token;
    });
    req.rootUser.save();
    res.status(200).json({ message: "admin Succesfully Logout " });
  } catch (error) {
    res.status(400).json(error);
  }
};
