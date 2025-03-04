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
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/flows', flowRoutes);
app.use('/api/pi', piRoutes);
app.use('/api/nodes', nodeRoutes);

// Home route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to PiDash API' });
});

// 404 handler
app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});