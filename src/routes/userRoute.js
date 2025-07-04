const express = require("express");

const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect, authController.accesTo("admin"));

router.route("/").get(userController.getAllUsers).post(userController.getUsers);
router.post("/block", userController.blockUsers);
router.post("/unblock", userController.unBlockUsers);
router.post("/admin", userController.changeToAdmin);
router.post("/user", userController.changeToUser);
router.post("/delete", userController.deleteUsers);

module.exports = router;
