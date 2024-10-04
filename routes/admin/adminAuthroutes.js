const express = require("express");
const router = new express.Router();
const adminAuthcontrollers = require("../../controllers/admin/adminControllers");
const adminUpload = require("../../multerconfig/admin/adminStorageConfig");
const adminauthenticate = require("../../middleware/admin/adminauthenticate");

// admin auth routes
router.post(
  "/register",
  adminUpload.single("admin_profile"),
  adminAuthcontrollers.Register
);
router.post("/login", adminAuthcontrollers.Login);
router.get("/logout", adminauthenticate, adminAuthcontrollers.Logout);

// admin verify
router.get("/adminverify", adminauthenticate, adminAuthcontrollers.AdminVerify);
module.exports = router;
