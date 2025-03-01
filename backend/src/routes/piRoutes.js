const express = require('express');
const { addPi, getPis, getPi, updatePi, deletePi, testConnection } = require('../controllers/piController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All Pi routes are protected
router.use(protect);

// GET all Pis for the logged in user
router.get('/', getPis);

// GET a single Pi
router.get('/:id', getPi);

// POST a new Pi
router.post('/', addPi);

// PUT update a Pi
router.put('/:id', updatePi);

// DELETE a Pi
router.delete('/:id', deletePi);

// POST test connection to a Pi
router.post('/:id/test', testConnection);

module.exports = router;