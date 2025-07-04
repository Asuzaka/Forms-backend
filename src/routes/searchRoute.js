const express = require("express");
const searchController = require("../controllers/searchController");
const authController = require("../controllers/authController");

const router = express.Router();

router.route("/").get(searchController.globalSearch);
router.route("/tags").get(searchController.searchTags);
router.route("/user").get(searchController.userSearch);

router.use(authController.protect);
router.route("/template").get(searchController.searchTemplate);
router
  .route("/stats")
  .get(authController.accesTo("admin"), searchController.getDashboardStats);

module.exports = router;
