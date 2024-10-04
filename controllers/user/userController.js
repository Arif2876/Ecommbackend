const cloudinary = require("../../cloudinary/cloudinary");
const userDB = require("../../model/user/userModels");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.USER_SECRET_KEY;
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const { transporter } = require("../../helper");
const { error, info } = require("console");
const usercontactDB = require("../../model/user/userContactModel");
// register
exports.userRegister = async (req, res) => {
  const { firstname, lastname, email, password, confirmpassword } = req.body;

  if (
    !firstname ||
    !lastname ||
    !email ||
    !password ||
    !confirmpassword ||
    !req.body
  ) {
    res.status(400).json({ error: "All field are required" });
  }

  const file = req.file?.path;
  const upload = await cloudinary.uploader.upload(file);

  try {
    const preuser = await userDB.findOne({ email: email });
    if (preuser) {
      res.status(400).json({ error: "this user is already exist" });
    } else if (password !== confirmpassword) {
      res.status(400).json({ error: "password and confirmpassword not match" });
    } else {
      const userData = new userDB({
        firstname,
        lastname,
        email,
        password,
        userprofile: upload.secure_url,
      });

      // here password  hashing
      await userData.save();
      res.status(200).json(userData);
    }
  } catch (error) {
    res.status(400).json(error);
  }
};

// login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "All field are require" });
  }
  try {
    const userValid = await userDB.findOne({ email: email });

    if (userValid) {
      const isMatch = await bcrypt.compare(password, userValid.password);

      if (!isMatch) {
        res.status(400).json({ error: "Invalid details " });
      } else {
        // token generate
        const token = await userValid.generateuserAuthToken();
        const result = {
          userValid,
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

//user Verify

exports.userverify = async (req, res) => {
  try {
    const verifyUser = await userDB.findOne({ _id: req.userId });
    res.status(200).json(verifyUser);
  } catch (error) {
    res.status(400).json(error);
  }
};

exports.logout = async (req, res) => {
  try {
    req.rootUser.tokens = req.rootUser.tokens.filter((CurrentElement) => {
      return CurrentElement.token !== req.token;
    });
    req.rootUser.save();
    res.status(200).json({ message: "user Succesfully Logout " });
  } catch (error) {
    res.status(400).json(error);
  }
};

// forgotpassword
exports.forgotpassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "enter your email" });
  }
  try {
    const userfind = await userDB.findOne({ email: email });

    if (userfind) {
      //token  generate for password  change
      const token = jwt.sign({ _id: userfind._id }, SECRET_KEY, {
        expiresIn: "120s",
      });
      const setusertoken = await userDB.findByIdAndUpdate(
        { _id: userfind._id },
        { verifytoken: token },
        { new: true }
      );

      // join email path
      const emailTemplatepath = path.join(
        __dirname,
        "../../EmailTemplate/ForgotTemplate.ejs"
      );
      const emailtemplateread = fs.readFileSync(emailTemplatepath, "utf8");

      //set token and logo value in ejs file
      const data = {
        passwordresetlink: `http://localhost:3000/resetpassword/${userfind.id}/${setusertoken.verifytoken}`,
        logo: "https://cdn-icons-png.flaticon.com/128/732/732200.png",
      };

      // set dynamic datavalue in ejs
      const renderTemplate = ejs.render(emailtemplateread, data);

      if (setusertoken) {
        const mailOptions = {
          from: process.env.EMAIL,
          to: email,
          subject: "Sending Emai For password Reset",
          html: renderTemplate,
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log("error", error);
            res.status(400).json({ error: "email not send " });
          } else {
            console.log("email sent ", info.response);
            res.status(200).json({ message: "Email sent Succesfully" });
          }
        });
      }
    } else {
      res.status(400).json({ error: "this user is not exist" });
    }
  } catch (error) {
    res.status(400).json(error);
  }
};

// forgotpasswordverify

exports.forgotpasswordverify = async (req, res) => {
  const { id, token } = req.params;

  try {
    const validuser = await userDB.findOne({ _id: id, verifytoken: token });
    const verifytoken = jwt.verify(token, SECRET_KEY);

    if (validuser && verifytoken._id) {
      res.status(200).json({ message: "valid user" });
    } else {
      res.status(400).json({ error: "user not exist" });
    }
  } catch (error) {
    res.status(400).json(error);
  }
};

// resetpassword and update password
exports.resetpassword = async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  try {
    const validuser = await userDB.findOne({ _id: id, verifytoken: token });
    const verifytoken = jwt.verify(token, SECRET_KEY);
    if (validuser && verifytoken._id) {
      const newpassword = await bcrypt.hash(password, 12);
      const setnewpassword = await userDB.findByIdAndUpdate(
        { _id: id },
        { password: newpassword },
        { new: true }
      );
      await setnewpassword.save();

      res.status(200).json({ message: "password sucessfully update" });
    } else {
      res
        .status(400)
        .json({ message: "your session time out please generate new link" });
    }
  } catch (error) {
    res.status(400).json(error);
  }
};

//getAlluser
exports.getAlluser = async (req, res) => {
  const page = req.query.page || 1;
  const ITEM_PER_PAGE = 4;
  try {
    const skip = (page - 1) * ITEM_PER_PAGE;
    const count = await userDB.countDocuments();
    const pageCount = Math.ceil(count / ITEM_PER_PAGE);

    const usersdata = await userDB
      .find()
      .limit(ITEM_PER_PAGE)
      .skip(skip)
      .sort({ _id: -1 });
    res.status(200).json({
      pagination: {
        count,
        pageCount,
      },
      usersdata,
    });
  } catch (error) {
    res.status(400).json(error);
  }
};

// userDelete
exports.userDelete = async (req, res) => {
  const { userid } = req.params;
  try {
    const deleteuser = await userDB.findByIdAndDelete({ _id: userid });
    res.status(200).json(deleteuser);
  } catch (error) {
    res.status(400).json(error);
  }
};

// userContact

exports.userContact = async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    res.status(400).json({ error: "all fields are required" });
  }

  try {
    const usermessageData = new usercontactDB({
      name,
      email,
      message,
    });

    await usermessageData.save();
    res.status(200).json(usermessageData);
  } catch (error) {
    res.status(400).json(error);
  }
};
