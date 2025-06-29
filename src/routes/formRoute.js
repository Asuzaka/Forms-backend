const express = require("express");
const formController = require("../controllers/formController");
const { protect } = require("../controllers/authController");

const router = express.Router();

router.use(protect);

router.route("/").post(formController.submitForm);
router.route("/template/:templateId").get(formController.getTemplateForms);
router.route("/:id").get(formController.getForm);

module.exports = router;
