const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./utils/db');
const { errorHandler } = require('./utils/errorHandler');
const logger = require('./utils/logger');

// Routes
const userRoutes = require('./routes/userRoutes');
const flowRoutes = require('./routes/flowRoutes');
const piRoutes = require('./routes/piRoutes');
const nodeRoutes = require('./routes/nodeRoutes');

// Load environment variables
dotenv.config();

// Connect to SQLite database
connectDB();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/flows', flowRoutes);
app.use('/api/pi', piRoutes);
app.use('/api/nodes', nodeRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to PiDash API' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});