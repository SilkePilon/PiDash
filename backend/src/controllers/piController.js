const asyncHandler = require('express-async-handler');
const { NodeSSH } = require('node-ssh');
const Pi = require('../models/piModel');
const logger = require('../utils/logger');

// @desc    Add a new Raspberry Pi
// @route   POST /api/pi
// @access  Private
const addPi = asyncHandler(async (req, res) => {
  const { name, host, port, username, authType, password, privateKey } = req.body;

  // Validate required fields
  if (!name || !host || !username || !authType) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Create the Pi in database
  const pi = await Pi.create({
    userId: req.user.id,
    name,
    host,
    port: port || 22,
    username,
    authType,
    password: authType === 'password' ? password : null,
    privateKey: authType === 'privateKey' ? privateKey : null
  });

  if (pi) {
    logger.info(`New Raspberry Pi added: ${name} by user: ${req.user.email}`);
    res.status(201).json({
      id: pi.id,
      name: pi.name,
      host: pi.host,
      port: pi.port,
      username: pi.username,
      authType: pi.authType,
      status: pi.status
    });
  } else {
    res.status(400);
    throw new Error('Invalid Raspberry Pi data');
  }
});

// @desc    Get user's Raspberry Pi's
// @route   GET /api/pi
// @access  Private
const getPis = asyncHandler(async (req, res) => {
  const pis = await Pi.findAll({
    where: { userId: req.user.id },
    attributes: { exclude: ['password', 'privateKey'] }
  });
  res.status(200).json(pis);
});

// @desc    Get a single Raspberry Pi
// @route   GET /api/pi/:id
// @access  Private
const getPi = asyncHandler(async (req, res) => {
  const pi = await Pi.findOne({
    where: { id: req.params.id, userId: req.user.id },
    attributes: { exclude: ['password', 'privateKey'] }
  });

  if (!pi) {
    res.status(404);
    throw new Error('Raspberry Pi not found');
  }

  res.status(200).json(pi);
});

// @desc    Update a Raspberry Pi
// @route   PUT /api/pi/:id
// @access  Private
const updatePi = asyncHandler(async (req, res) => {
  const pi = await Pi.findOne({
    where: { id: req.params.id, userId: req.user.id }
  });

  if (!pi) {
    res.status(404);
    throw new Error('Raspberry Pi not found');
  }

  // Update fields
  const [updated] = await Pi.update(
    { 
      ...req.body,
      // If auth type changes, handle the credential fields
      password: req.body.authType === 'password' ? req.body.password : null,
      privateKey: req.body.authType === 'privateKey' ? req.body.privateKey : null
    },
    { 
      where: { id: req.params.id, userId: req.user.id },
      returning: true
    }
  );

  if (updated) {
    const updatedPi = await Pi.findOne({
      where: { id: req.params.id },
      attributes: { exclude: ['password', 'privateKey'] }
    });
    
    logger.info(`Raspberry Pi updated: ${updatedPi.name} by user: ${req.user.email}`);
    res.status(200).json(updatedPi);
  } else {
    res.status(400);
    throw new Error('Failed to update Raspberry Pi');
  }
});

// @desc    Delete a Raspberry Pi
// @route   DELETE /api/pi/:id
// @access  Private
const deletePi = asyncHandler(async (req, res) => {
  const pi = await Pi.findOne({
    where: { id: req.params.id, userId: req.user.id }
  });

  if (!pi) {
    res.status(404);
    throw new Error('Raspberry Pi not found');
  }

  await pi.destroy();
  logger.info(`Raspberry Pi deleted: ${pi.name} by user: ${req.user.email}`);
  res.status(200).json({ id: req.params.id });
});

// @desc    Test connection to a Raspberry Pi
// @route   POST /api/pi/:id/test
// @access  Private
const testConnection = asyncHandler(async (req, res) => {
  // Get the Pi with sensitive data for connection
  const pi = await Pi.findOne({
    where: { id: req.params.id, userId: req.user.id }
  });

  if (!pi) {
    res.status(404);
    throw new Error('Raspberry Pi not found');
  }

  // Set up connection config
  const ssh = new NodeSSH();
  const sshConfig = {
    host: pi.host,
    port: pi.port,
    username: pi.username,
  };

  // Add authentication based on auth type
  if (pi.authType === 'password') {
    sshConfig.password = pi.password;
  } else {
    sshConfig.privateKey = pi.privateKey;
  }

  try {
    // Attempt to connect
    await ssh.connect(sshConfig);
    
    // Execute a simple command to verify everything works
    const result = await ssh.execCommand('uname -a');
    
    // Update Pi status in database
    pi.status = 'online';
    pi.lastConnection = new Date();
    await pi.save();
    
    // Close connection
    ssh.dispose();
    
    logger.info(`Successful connection test to Pi: ${pi.name} by user: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Connection successful',
      system: result.stdout,
      status: 'online'
    });
  } catch (error) {
    // Update Pi status in database
    pi.status = 'offline';
    await pi.save();
    
    logger.error(`Failed connection test to Pi: ${pi.name} - Error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: `Connection failed: ${error.message}`,
      status: 'offline'
    });
  }
});

module.exports = {
  addPi,
  getPis,
  getPi,
  updatePi,
  deletePi,
  testConnection
};