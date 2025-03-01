const { NodeSSH } = require('node-ssh');
const Flow = require('../models/flowModel');
const Pi = require('../models/piModel');
const User = require('../models/userModel');
const logger = require('../utils/logger');

// Node types from frontend
const NODE_TYPES = {
  START: 'start',
  END: 'end',
  RUN_COMMAND: 'run-command',
  GPIO: 'gpio',
  LOOP: 'loop',
  CONDITIONAL_PATH: 'conditional-path',
  CONNECT_RASPBERRY_PI: 'connect-raspberry-pi',
  TEXT_MESSAGE: 'text-message'
};

/**
 * Execute a flow by running its nodes in the correct sequence
 * @param {string} flowId - The ID of the flow to execute
 * @param {string} userId - The ID of the user who owns the flow
 */
async function executeFlow(flowId, userId) {
  try {
    // Get flow with all data
    const flow = await Flow.findOne({
      where: { id: flowId, userId },
      include: [{
        model: Pi,
        attributes: ['id', 'name', 'host', 'status']
      }]
    });
    
    if (!flow) {
      throw new Error('Flow not found or unauthorized');
    }

    // Get user for notifications
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Initialize execution state
    flow.executionStatus = 'running';
    flow.lastExecuted = new Date();
    flow.executionResults = {};
    await flow.save();

    logger.info(`Starting flow execution: ${flow.name} (${flow.id})`);

    // Find the start node
    const startNode = flow.nodes.find(node => node.type === NODE_TYPES.START);
    if (!startNode) {
      throw new Error('No start node found in the flow');
    }

    // Execute the flow starting from the start node
    await executeNode(flow, startNode, null);
    
    // Update flow status to success if no errors occurred
    flow.executionStatus = 'success';
    await flow.save();
    
    logger.info(`Flow execution completed successfully: ${flow.name} (${flow.id})`);
    return flow;
  } catch (error) {
    // Update flow status to error
    const flow = await Flow.findOne({ where: { id: flowId } });
    if (flow) {
      flow.executionStatus = 'error';
      flow.executionResults = { error: error.message };
      await flow.save();
    }
    
    logger.error(`Flow execution error: ${error.message}`);
    throw error;
  }
}

/**
 * Execute a single node and then any connected nodes
 * @param {Object} flow - The flow document
 * @param {Object} node - The current node to execute
 * @param {Object|null} sshConnection - SSH connection if already established
 */
async function executeNode(flow, node, sshConnection) {
  try {
    logger.debug(`Executing node: ${node.id} (${node.type})`);
    
    // Update the node status in the flow results
    flow.executionResults.set(`${node.id}_status`, 'running');
    await flow.save();
    
    // Execute the node based on its type
    let result = null;
    let shouldContinue = true;
    let newSshConnection = sshConnection;
    
    switch(node.type) {
      case NODE_TYPES.START:
        result = { success: true, message: 'Flow started' };
        break;
      
      case NODE_TYPES.END:
        result = { success: true, message: 'Flow ended' };
        shouldContinue = false;
        break;
      
      case NODE_TYPES.CONNECT_RASPBERRY_PI:
        if (newSshConnection) {
          // Close existing connection before creating a new one
          newSshConnection.dispose();
        }
        
        newSshConnection = await connectToPi(flow, node);
        result = { 
          success: true, 
          message: 'Connected to Raspberry Pi',
          host: node.data.host
        };
        break;
      
      case NODE_TYPES.RUN_COMMAND:
        if (!newSshConnection) {
          throw new Error('No active SSH connection. Add a Connect Raspberry Pi node before Run Command.');
        }
        
        result = await executeCommand(newSshConnection, node.data.command);
        break;
      
      case NODE_TYPES.GPIO:
        if (!newSshConnection) {
          throw new Error('No active SSH connection. Add a Connect Raspberry Pi node before GPIO control.');
        }
        
        result = await controlGPIO(newSshConnection, node.data.pin, node.data.state);
        break;
      
      case NODE_TYPES.LOOP:
        // Execute loop based on node settings
        result = await executeLoop(flow, node, newSshConnection);
        break;
      
      case NODE_TYPES.CONDITIONAL_PATH:
        // Evaluate condition and determine next path
        result = await evaluateCondition(flow, node, newSshConnection);
        break;
      
      case NODE_TYPES.TEXT_MESSAGE:
        // Simulated text message
        result = { 
          success: true, 
          message: `Message sent: ${node.data.message}`, 
          recipient: node.data.recipient 
        };
        break;
      
      default:
        result = { success: false, message: `Unknown node type: ${node.type}` };
        break;
    }
    
    // Save the result
    flow.executionResults.set(node.id, result);
    flow.executionResults.set(`${node.id}_status`, result.success ? 'success' : 'error');
    await flow.save();
    
    // If we shouldn't continue or there was an error, stop here
    if (!shouldContinue || !result.success) {
      return result;
    }
    
    // Find next nodes to execute
    const edges = flow.edges.filter(edge => edge.source === node.id);
    
    // If this is a conditional node, only follow the right path
    if (node.type === NODE_TYPES.CONDITIONAL_PATH) {
      const conditionMet = result.conditionMet;
      
      // Find the specific edge for the condition result (true/false)
      const nextEdge = edges.find(edge => {
        return (conditionMet && edge.sourceHandle === 'true') || 
               (!conditionMet && edge.sourceHandle === 'false');
      });
      
      if (nextEdge) {
        const nextNode = flow.nodes.find(n => n.id === nextEdge.target);
        if (nextNode) {
          await executeNode(flow, nextNode, newSshConnection);
        }
      }
    } else {
      // For regular nodes, follow all connected edges
      for (const edge of edges) {
        const nextNode = flow.nodes.find(n => n.id === edge.target);
        if (nextNode) {
          await executeNode(flow, nextNode, newSshConnection);
        }
      }
    }
    
    return result;
  } catch (error) {
    // Handle node execution error
    logger.error(`Error executing node ${node.id}: ${error.message}`);
    flow.executionResults.set(node.id, { success: false, error: error.message });
    flow.executionResults.set(`${node.id}_status`, 'error');
    await flow.save();
    
    // Close SSH connection if it exists
    if (sshConnection) {
      sshConnection.dispose();
    }
    
    throw error;
  }
}

/**
 * Connect to a Raspberry Pi using the node's configuration
 * @param {Object} flow - The flow document
 * @param {Object} node - The connect raspberry pi node
 * @returns {Promise<NodeSSH>} - The SSH connection
 */
async function connectToPi(flow, node) {
  try {
    // If the node references a saved Pi by ID
    if (node.data.piId) {
      const pi = await Pi.findById(node.data.piId).select('+password +privateKey');
      
      if (!pi || pi.user.toString() !== flow.user.toString()) {
        throw new Error('Raspberry Pi not found or unauthorized');
      }
      
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
      
      await ssh.connect(sshConfig);
      
      // Update Pi status
      pi.status = 'online';
      pi.lastConnection = Date.now();
      await pi.save();
      
      return ssh;
    } 
    // If the node contains connection details directly
    else {
      const ssh = new NodeSSH();
      
      const sshConfig = {
        host: node.data.host,
        port: node.data.port || 22,
        username: node.data.username,
      };
      
      // Add authentication based on auth type
      if (node.data.authType === 'password') {
        sshConfig.password = node.data.password;
      } else {
        sshConfig.privateKey = node.data.privateKey;
      }
      
      await ssh.connect(sshConfig);
      return ssh;
    }
  } catch (error) {
    logger.error(`Failed to connect to Pi: ${error.message}`);
    throw new Error(`Connection failed: ${error.message}`);
  }
}

/**
 * Execute a shell command via SSH
 * @param {NodeSSH} ssh - The SSH connection
 * @param {string} command - The command to execute
 * @returns {Promise<Object>} - The command result
 */
async function executeCommand(ssh, command) {
  try {
    if (!command || command.trim() === '') {
      throw new Error('Command cannot be empty');
    }
    
    const result = await ssh.execCommand(command);
    
    return {
      success: result.code === 0,
      stdout: result.stdout,
      stderr: result.stderr,
      code: result.code,
      command
    };
  } catch (error) {
    logger.error(`Command execution failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      command
    };
  }
}

/**
 * Control a GPIO pin on the Raspberry Pi
 * @param {NodeSSH} ssh - The SSH connection
 * @param {number} pin - The GPIO pin number
 * @param {boolean} state - The state to set (true=HIGH, false=LOW)
 * @returns {Promise<Object>} - The result of the operation
 */
async function controlGPIO(ssh, pin, state) {
  try {
    // Prepare the Python command to control GPIO
    const pythonCommand = `python3 -c "
import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
GPIO.setup(${pin}, GPIO.OUT)
GPIO.output(${pin}, ${state ? 'True' : 'False'})
print('GPIO pin ${pin} set to ${state ? 'HIGH' : 'LOW'}')
"`;
    
    const result = await ssh.execCommand(pythonCommand);
    
    return {
      success: result.code === 0,
      stdout: result.stdout,
      stderr: result.stderr,
      pin,
      state
    };
  } catch (error) {
    logger.error(`GPIO control failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      pin,
      state
    };
  }
}

/**
 * Execute a loop node
 * @param {Object} flow - The flow document
 * @param {Object} node - The loop node
 * @param {NodeSSH} ssh - The SSH connection
 * @returns {Promise<Object>} - The result of the operation
 */
async function executeLoop(flow, node, ssh) {
  try {
    const count = parseInt(node.data.iterations) || 1;
    const results = [];
    
    // Find the outgoing edge from the loop node
    const loopEdge = flow.edges.find(edge => edge.source === node.id);
    
    if (!loopEdge) {
      return { 
        success: true, 
        message: `Loop completed 0 iterations (no outgoing connections)` 
      };
    }
    
    // Find the target node to execute in the loop
    const targetNode = flow.nodes.find(n => n.id === loopEdge.target);
    
    if (!targetNode) {
      return { 
        success: true, 
        message: `Loop completed 0 iterations (no target node)` 
      };
    }
    
    // Execute the loop
    for (let i = 0; i < count; i++) {
      if (node.data.delay) {
        // Add delay between iterations if specified
        await new Promise(resolve => setTimeout(resolve, node.data.delay * 1000));
      }
      
      // Execute the target node
      const result = await executeNode(flow, targetNode, ssh);
      results.push({
        iteration: i + 1,
        result
      });
      
      // Store iteration results in flow
      flow.executionResults.set(`${node.id}_iteration_${i}`, {
        iteration: i + 1,
        nodeId: targetNode.id,
        result
      });
      await flow.save();
      
      // If any iteration fails, break the loop if configured to do so
      if (!result.success && node.data.stopOnError) {
        break;
      }
    }
    
    return {
      success: true,
      message: `Loop completed ${results.length} iterations`,
      iterations: results
    };
  } catch (error) {
    logger.error(`Loop execution failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Evaluate a conditional node
 * @param {Object} flow - The flow document
 * @param {Object} node - The conditional node
 * @param {NodeSSH} ssh - The SSH connection
 * @returns {Promise<Object>} - The result of the operation
 */
async function evaluateCondition(flow, node, ssh) {
  try {
    let conditionMet = false;
    
    // For command output condition
    if (node.data.conditionType === 'command') {
      // Execute the command
      const result = await executeCommand(ssh, node.data.command);
      
      if (!result.success) {
        throw new Error(`Command execution failed: ${result.error || result.stderr}`);
      }
      
      // Check if output contains the expected value
      if (node.data.comparison === 'contains') {
        conditionMet = result.stdout.includes(node.data.value);
      }
      // Check if output equals the expected value
      else if (node.data.comparison === 'equals') {
        conditionMet = result.stdout.trim() === node.data.value.trim();
      }
      // Check if output doesn't contain the expected value
      else if (node.data.comparison === 'notContains') {
        conditionMet = !result.stdout.includes(node.data.value);
      }
      // Check if output doesn't equal the expected value
      else if (node.data.comparison === 'notEquals') {
        conditionMet = result.stdout.trim() !== node.data.value.trim();
      }
    } 
    // For file exists condition
    else if (node.data.conditionType === 'fileExists') {
      const result = await executeCommand(ssh, `test -f "${node.data.filepath}" && echo "true" || echo "false"`);
      conditionMet = result.stdout.trim() === 'true';
    }
    // For GPIO input condition
    else if (node.data.conditionType === 'gpio') {
      const result = await executeCommand(ssh, `python3 -c "
import RPi.GPIO as GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setup(${node.data.pin}, GPIO.IN)
print(GPIO.input(${node.data.pin}))
"`);
      
      const pinState = result.stdout.trim() === '1';
      conditionMet = pinState === node.data.expectedState;
    }
    
    return {
      success: true,
      conditionMet,
      message: `Condition evaluated to ${conditionMet}`
    };
  } catch (error) {
    logger.error(`Condition evaluation failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = { executeFlow };