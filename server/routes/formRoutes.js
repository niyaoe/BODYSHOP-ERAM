const express = require("express");

const {
  createFormRecord,
  getFormRecords,
  updateFormRecord,
} = require("../controllers/formController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

//get records
router.get("/", protect, authorize("admin", "user"), getFormRecords);

// Admin + User
router.post("/", protect, authorize("admin", "user"), createFormRecord);

// Update record
router.put("/:id", protect, authorize("admin", "user"), updateFormRecord);

module.exports = router;
