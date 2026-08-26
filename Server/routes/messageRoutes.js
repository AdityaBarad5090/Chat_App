const express = require("express");

const {
    getMessages
} = require("../controllers/messageController");
 
const router = express.Router();
 
router.get(
    "/:userId/:otherUserId",
    getMessages
);

module.exports = router; 