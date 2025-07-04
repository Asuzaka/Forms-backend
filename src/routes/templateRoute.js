const express = require("express");

const templateController = require("../controllers/templateController");
const authController = require("../controllers/authController");

const router = express.Router();

router.get("/latest", templateController.getLatestTemplates);
router.get("/popular/likes", templateController.getPopularByLikes);
router.get("/tags", templateController.getTagStatistics);

router
  .route("/templates")
  .post(
    authController.protect,
    authController.accesTo("admin"),
    templateController.deleteMultipleTemplates
  )
  .get(
    authController.protect,
    authController.accesTo("admin"),
    templateController.getAllTemplates
  );

router
  .route("/:id")
  .get(authController.optionalAuth, templateController.getTemplate)
  .patch(authController.protect, templateController.updateTemplate)
  .delete(authController.protect, templateController.deleteTemplate);

router.use(authController.protect);

router
  .route("/")
  .get(templateController.getUserTemplates)
  .post(templateController.createTemplate);

module.exports = router;
