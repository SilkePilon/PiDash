const asyncHandler = require('express-async-handler');
const Flow = require('../models/flowModel');
const Pi = require('../models/piModel');
const logger = require('../utils/logger');
const { executeFlow } = require('../services/flowExecutionService');

// @desc    Create a new flow
// @route   POST /api/flows
// @access  Private
const createFlow = asyncHandler(async (req, res) => {
  const { name, description, nodes, edges, piId } = req.body;

  // Validate required fields
  if (!name || !nodes || !edges) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Check if raspberry_pi exists if provided
  if (piId) {
    const pi = await Pi.findOne({
      where: { id: piId, userId: req.user.id }
    });
    
    if (!pi) {
      res.status(400);
      throw new Error('Invalid Raspberry Pi ID');
    }
  }

  // Create the flow
  const flow = await Flow.create({
    userId: req.user.id,
    name,
    description,
    nodes,
    edges,
    piId: piId || null
  });

  if (flow) {
    logger.info(`New flow created: ${name} by user: ${req.user.email}`);
    res.status(201).json(flow);
  } else {
    res.status(400);
    throw new Error('Invalid flow data');
  }
});

// @desc    Get all user flows
// @route   GET /api/flows
// @access  Private
const getFlows = asyncHandler(async (req, res) => {
  const flows = await Flow.findAll({
    where: { userId: req.user.id },
    include: [{
      model: Pi,
      attributes: ['id', 'name', 'host', 'status']
    }]
  });
  res.status(200).json(flows);
});

// @desc    Get a single flow
// @route   GET /api/flows/:id
// @access  Private
const getFlow = asyncHandler(async (req, res) => {
  const flow = await Flow.findOne({
    where: { id: req.params.id, userId: req.user.id },
    include: [{
      model: Pi,
      attributes: ['id', 'name', 'host', 'status']
    }]
  });

  if (!flow) {
    res.status(404);
    throw new Error('Flow not found');
  }

  res.status(200).json(flow);
});

// @desc    Update a flow
// @route   PUT /api/flows/:id
// @access  Private
const updateFlow = asyncHandler(async (req, res) => {
  const flow = await Flow.findOne({
    where: { id: req.params.id, userId: req.user.id }
  });

  if (!flow) {
    res.status(404);
    throw new Error('Flow not found');
  }

  // Check if raspberry_pi exists if provided
  if (req.body.piId) {
    const pi = await Pi.findOne({
      where: { id: req.body.piId, userId: req.user.id }
    });
    
    if (!pi) {
      res.status(400);
      throw new Error('Invalid Raspberry Pi ID');
    }
  }

  const [updated] = await Flow.update(req.body, {
    where: { id: req.params.id, userId: req.user.id }
  });

  if (updated) {
    const updatedFlow = await Flow.findOne({
      where: { id: req.params.id },
      include: [{
        model: Pi,
        attributes: ['id', 'name', 'host', 'status']
      }]
    });
    
    logger.info(`Flow updated: ${updatedFlow.name} by user: ${req.user.email}`);
    res.status(200).json(updatedFlow);
  } else {
    res.status(400);
    throw new Error('Failed to update flow');
  }
});

// @desc    Delete a flow
// @route   DELETE /api/flows/:id
// @access  Private
const deleteFlow = asyncHandler(async (req, res) => {
  const flow = await Flow.findOne({
    where: { id: req.params.id, userId: req.user.id }
  });

  if (!flow) {
    res.status(404);
    throw new Error('Flow not found');
  }

  await flow.destroy();
  logger.info(`Flow deleted: ${flow.name} by user: ${req.user.email}`);
  res.status(200).json({ id: req.params.id });
});

// @desc    Execute a flow
// @route   POST /api/flows/:id/execute
// @access  Private
const runFlow = asyncHandler(async (req, res) => {
  const flow = await Flow.findOne({
    where: { id: req.params.id, userId: req.user.id }
  });

  if (!flow) {
    res.status(404);
    throw new Error('Flow not found');
  }

  // Make sure flow is not already running
  if (flow.executionStatus === 'running') {
    res.status(400);
    throw new Error('Flow is already running');
  }

  // Mark flow as running
  flow.executionStatus = 'running';
  flow.executionResults = {};
  await flow.save();

  // Start execution in the background (non-blocking)
  executeFlow(flow.id, req.user.id)
    .then(() => {
      logger.info(`Flow execution completed: ${flow.name}`);
    })
    .catch(error => {
      logger.error(`Flow execution failed: ${flow.name} - ${error.message}`);
    });

  res.status(200).json({
    message: 'Flow execution started',
    flowId: flow.id,
    executionStatus: flow.executionStatus
  });
});

// @desc    Get flow execution status
// @route   GET /api/flows/:id/status
// @access  Private
const getFlowStatus = asyncHandler(async (req, res) => {
  const flow = await Flow.findOne({
    where: { id: req.params.id, userId: req.user.id }
  });

  if (!flow) {
    res.status(404);
    throw new Error('Flow not found');
  }

  res.status(200).json({
    flowId: flow.id,
    executionStatus: flow.executionStatus,
    lastExecuted: flow.lastExecuted,
    executionResults: flow.executionResults || {}
  });
});

module.exports = {
  createFlow,
  getFlows,
  getFlow,
  updateFlow,
  deleteFlow,
  runFlow,
  getFlowStatus
};