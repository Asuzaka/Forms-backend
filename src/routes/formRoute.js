const express = require("express");
const formController = require("../controllers/formController");
const authConroller = require("../controllers/authController");

const router = express.Router();

router.use(authConroller.protect);

router.route("/formTemplate/:id").get(formController.TemplateForForm);
router.route("/template/:templateId").get(formController.getTemplateForms);
router
  .route("/:id")
  .get(formController.getForm)
  .post(formController.submitForm);

module.exports = router;
