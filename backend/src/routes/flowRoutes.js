const express = require('express');
const { 
  createFlow, 
  getFlows, 
  getFlow, 
  updateFlow, 
  deleteFlow, 
  runFlow,
  getFlowStatus
} = require('../controllers/flowController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All flow routes are protected
router.use(protect);

// GET all flows for the logged in user
router.get('/', getFlows);

// GET a single flow
router.get('/:id', getFlow);

// POST create a new flow
router.post('/', createFlow);

// PUT update a flow
router.put('/:id', updateFlow);

// DELETE a flow
router.delete('/:id', deleteFlow);

// POST run a flow
router.post('/:id/execute', runFlow);

// GET flow execution status
router.get('/:id/status', getFlowStatus);

module.exports = router;