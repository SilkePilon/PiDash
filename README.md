# PiDash 🎛️

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%234a4a4a.svg?style=for-the-badge&logo=pnpm&logoColor=f69220)](https://pnpm.io/)

> 🚀 A powerful flow-based dashboard for Raspberry Pi management and automation. It provides a visual interface to connect to, monitor, and control Raspberry Pi devices through an intuitive node-based workflow system.

<div align="center">

![GitHub last commit](https://img.shields.io/github/last-commit/yourusername/pidash)
![GitHub issues](https://img.shields.io/github/issues/yourusername/pidash)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/pidash)
![License](https://img.shields.io/github/license/yourusername/pidash)

</div>

---

## ✨ Features

### 🔧 Node Categories

<details>
<summary><strong>1. Basic Nodes</strong></summary>

- ▶️ **Start Node**: Beginning point of the flow
- ⏹️ **End Node**: Ending point of the flow
</details>

<details>
<summary><strong>2. Control Flow Nodes</strong></summary>

- 🔄 **Loop Node**: Execute connected nodes repeatedly with configurable delay
- 🌳 **Conditional Path Node**: Create branching logic based on various conditions
</details>

<details>
<summary><strong>3. Raspberry Pi Nodes</strong></summary>

- 🥧 **Connect Raspberry Pi Node**: Establish connection to Raspberry Pi devices
- ⚡ **GPIO Node**: Control and monitor GPIO pins with support for:
  - Input/Output/PWM modes
  - BCM and Physical pin numbering
  - Basic and advanced GPIO pins
  - Real-time pin state monitoring
</details>

<details>
<summary><strong>4. Code Execution Nodes</strong></summary>

- 📜 **Run JavaScript Node**: Execute JavaScript code on connected devices
- 🐍 **Run Python Node**: Execute Python scripts on connected devices
- 💻 **Run Command Node**: Execute shell commands on connected devices
</details>

<details>
<summary><strong>5. Integration Nodes</strong></summary>

- 🐙 **GitHub Node**: Interact with GitHub repositories (pull, push, commit, webhook)
- 💬 **Text Message Node**: Send messages through various channels
</details>

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16
- pnpm >= 8
- Raspberry Pi with SSH access

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the server
npm start
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

## 📁 Project Structure

<details>
<summary>Click to expand</summary>

```
backend/
  ├── src/
  │   ├── controllers/     # Request handlers
  │   ├── middleware/      # Authentication middleware
  │   ├── models/         # Database models
  │   ├── routes/         # API routes
  │   ├── services/       # Business logic
  │   └── utils/          # Helper functions
frontend/
  ├── src/
  │   ├── modules/
  │   │   ├── auth/       # Authentication
  │   │   ├── flow-builder/# Flow editor
  │   │   ├── nodes/      # Node definitions
  │   │   ├── sidebar/    # UI panels
  │   │   └── toaster/    # Notifications
  │   ├── stores/         # State management
  │   └── utils/          # Helper functions
```
</details>

## 🎛️ Node Properties

<details>
<summary><strong>Connect Raspberry Pi Node</strong></summary>

| Property | Description | Default |
|----------|-------------|---------|
| Hostname/IP | The address of your Raspberry Pi | - |
| Port | SSH port number | 22 |
| Username | SSH username | pi |
| Password | SSH password | - |
| Status | Connection status monitoring | - |
</details>

<details>
<summary><strong>GPIO Node</strong></summary>

| Property | Description | Options |
|----------|-------------|---------|
| Pin Mode | Operating mode for GPIO pin | Input/Output/PWM |
| Pin State | Current state of the pin | High/Low/PWM value |
| Numbering | Pin numbering scheme | BCM/Physical |
| Status | Real-time updates | Connected/Disconnected |
</details>

<details>
<summary><strong>Loop Node</strong></summary>

| Property | Description | Default |
|----------|-------------|---------|
| Iterations | Number of loop repetitions | 5 |
| Delay | Time between iterations (ms) | 1000 |
| Controls | Execution control buttons | Start/Pause/Resume |
</details>

<details>
<summary><strong>Conditional Path Node</strong></summary>

| Category | Conditions | Example Paths |
|----------|------------|---------------|
| Network | Connectivity, Signal Strength | Connected/Disconnected |
| CPU | Temperature, Usage | Above/Below Threshold |
| Memory | Usage, Available | Low/Normal/Critical |
| Storage | Space, Health | Sufficient/Warning/Full |
</details>

## 🔐 Authentication

The application implements secure user authentication:

- ✅ User registration with email verification
- 🔒 Secure password hashing
- 🎫 JWT-based session management
- 🚪 Protected API endpoints

## 🛠️ Development

- ⚛️ Built with React + TypeScript
- 📦 Uses pnpm for efficient package management
- 🔍 Includes ESLint and TypeScript configurations
- 🔄 Features live reload during development

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📞 Support

If you have any questions or need help with setup, please open an issue or reach out to the maintainers.

