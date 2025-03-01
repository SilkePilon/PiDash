const express = require('express');
const { executeCommand, controlGPIO } = require('../controllers/nodeController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All node routes are protected
router.use(protect);

// Execute a command on a Raspberry Pi
router.post('/run-command', executeCommand);

// Control GPIO pins on a Raspberry Pi
router.post('/gpio', controlGPIO);

module.exports = router;