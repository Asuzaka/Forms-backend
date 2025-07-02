const express = require("express");
const commentController = require("../controllers/commentController");

const router = express.Router();

router.get("/:templateId", commentController.getCommentsByTemplate);

module.exports = router;
