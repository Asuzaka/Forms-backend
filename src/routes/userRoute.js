const express = require("express");

const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect);

router
  .route("/")
  .get(authController.accesTo("admin"), userController.getAllUsers)
  .post(userController.getUsers);
router.post(
  "/block",
  authController.accesTo("admin"),
  userController.blockUsers
);
router.post(
  "/unblock",
  authController.accesTo("admin"),
  userController.unBlockUsers
);
router.post(
  "/admin",
  authController.accesTo("admin"),
  userController.changeToAdmin
);
router.post(
  "/user",
  authController.accesTo("admin"),
  userController.changeToUser
);
router.post(
  "/delete",
  authController.accesTo("admin"),
  userController.deleteUsers
);

module.exports = router;
