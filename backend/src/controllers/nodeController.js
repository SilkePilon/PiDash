const asyncHandler = require('express-async-handler');
const { NodeSSH } = require('node-ssh');
const Pi = require('../models/piModel');
const logger = require('../utils/logger');

// @desc    Execute a command on a Raspberry Pi (for single node execution)
// @route   POST /api/nodes/run-command
// @access  Private
const executeCommand = asyncHandler(async (req, res) => {
  const { piId, command } = req.body;

  if (!piId || !command) {
    res.status(400);
    throw new Error('Please provide Raspberry Pi ID and command');
  }

  // Get Pi with auth details
  const pi = await Pi.findOne({
    where: { id: piId, userId: req.user.id }
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
    // Connect to the Pi
    await ssh.connect(sshConfig);
    
    // Execute the command
    const result = await ssh.execCommand(command);
    
    // Update Pi status
    pi.status = 'online';
    pi.lastConnection = new Date();
    await pi.save();
    
    // Close connection
    ssh.dispose();
    
    logger.info(`Command executed on Pi: ${pi.name} - Command: ${command}`);
    res.status(200).json({
      stdout: result.stdout,
      stderr: result.stderr,
      code: result.code,
      piId: pi.id
    });
  } catch (error) {
    // Update Pi status
    pi.status = 'offline';
    await pi.save();
    
    logger.error(`Command execution failed on Pi: ${pi.name} - Error: ${error.message}`);
    res.status(400).json({
      error: error.message,
      piId: pi.id
    });
  }
});

// @desc    Control GPIO pins on a Raspberry Pi
// @route   POST /api/nodes/gpio
// @access  Private
const controlGPIO = asyncHandler(async (req, res) => {
  const { piId, pin, state } = req.body;

  if (!piId || pin === undefined || state === undefined) {
    res.status(400);
    throw new Error('Please provide Raspberry Pi ID, pin number, and state');
  }

  // Get Pi with auth details
  const pi = await Pi.findOne({
    where: { id: piId, userId: req.user.id }
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
    // Connect to the Pi
    await ssh.connect(sshConfig);
    
    // Prepare the GPIO command (using Python)
    const pythonCommand = `python3 -c "
import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
GPIO.setup(${pin}, GPIO.OUT)
GPIO.output(${pin}, ${state ? 'True' : 'False'})
print('GPIO pin ${pin} set to ${state ? 'HIGH' : 'LOW'}')
"`;
    
    // Execute the command
    const result = await ssh.execCommand(pythonCommand);
    
    // Update Pi status
    pi.status = 'online';
    pi.lastConnection = new Date();
    await pi.save();
    
    // Close connection
    ssh.dispose();
    
    logger.info(`GPIO control on Pi: ${pi.name} - Pin: ${pin}, State: ${state}`);
    res.status(200).json({
      stdout: result.stdout,
      stderr: result.stderr,
      pin,
      state,
      piId: pi.id
    });
  } catch (error) {
    // Update Pi status
    pi.status = 'offline';
    await pi.save();
    
    logger.error(`GPIO control failed on Pi: ${pi.name} - Error: ${error.message}`);
    res.status(400).json({
      error: error.message,
      piId: pi.id
    });
  }
});

module.exports = {
  executeCommand,
  controlGPIO
};