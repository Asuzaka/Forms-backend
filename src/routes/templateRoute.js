const express = require("express");

const templateController = require("../controllers/templateController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect);

router
  .route("/")
  .get(templateController.getUserTemplates)
  .post(templateController.createTemplate);
router
  .route("/templates")
  .post(
    authController.accesTo("admin"),
    templateController.deleteMultipleTemplates
  )
  .get(authController.accesTo("admin"), templateController.getAllTemplates);
router
  .route("/:id")
  .get(templateController.getTemplate)
  .patch(templateController.updateTemplate)
  .delete(templateController.deleteTemplate);

module.exports = router;
