# Missing Backend Functionality for PiDash

This document outlines backend functionality that needs to be implemented to fully support the frontend features. These endpoints are referenced in the frontend code but may not exist in the backend implementation yet.

## API Endpoints Required

### Flow Execution Endpoints

- **POST /api/flows/execute-direct**
  - Executes a flow without saving it first
  - Receives a complete flow object with nodes and edges
  - Returns execution results for each node

- **POST /api/flows**
  - Creates a new flow
  - Saves the flow configuration to the database

- **PUT /api/flows**
  - Updates an existing flow
  - Modifies the saved flow configuration

### Device Status Endpoints

- **GET /api/devices/raspberry-pi/:id/status**
  - Checks if a Raspberry Pi is online and connectable
  - Returns status information

- **GET /api/raspberry-pis**
  - Returns a list of available Raspberry Pi devices the user has access to

### GPIO Control Endpoints

- **PUT /api/devices/raspberry-pi/:id/gpio/:pin**
  - Controls a specific GPIO pin on a Raspberry Pi
  - Sets the pin state (high/low or PWM value)

## Models and Services

The backend should implement:

1. **Flow Storage**
   - Database schema for storing flows, nodes, and edges
   - Serialization/deserialization of flow configurations

2. **Flow Execution Engine**
   - Execute nodes in sequence based on connections
   - Handle conditional paths and loops
   - Provide execution status and results

3. **Device Management**
   - Store device information including connection details
   - Manage device status (online/offline)
   - Connect to devices securely

## Implementation Notes

- Each endpoint should verify user authentication using JWT tokens
- Execution results should include status for each node (success/error)
- Consider rate limiting for GPIO control to prevent excessive pin state changes
- Add error handling for device connections
- Implement secure storage of device credentials

## Testing 

When implementing these features, test:
1. Flow execution with different node types
2. Error handling when devices are offline
3. Authentication requirements for all endpoints
4. GPIO pin control with various pin modes (input, output, PWM)