const express = require("express");

const authController = require("../controllers/authConroller");

const router = express.Router();

router
  .route("/authenticated")
  .get(authController.protect, authController.authenticated);
router.route("/signin").post(authController.signin);
router.route("/signup").post(authController.signup);
router.route("/signout").get(authController.signout);
router.route("/verify/:token").get(authController.verify);
router.route("/forgetPassword").post(authController.forgetPassword);
router.route("/resetPassword/:token").post(authController.resetPassword);

module.exports = router;
