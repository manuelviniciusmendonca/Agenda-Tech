const express = require("express");

const router = express.Router();

const {
  receberWebhook,
} = require("../controllers/asaasWebhookController");

router.post("/", receberWebhook);

module.exports = router;