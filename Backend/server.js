import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import returnsRouter from './routes/returns.js';
import p2pRouter from './routes/p2p.js';
import donationsRouter from './routes/donations.js';
import profileRouter from './routes/profile.js';
import gradingRouter from './routes/grading.js';
import configRouter from './routes/config.js';
import tryonRouter from './routes/tryon.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite default ports
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/returns', returnsRouter);
app.use('/api/p2p', p2pRouter);
app.use('/api/donations', donationsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/grading', gradingRouter);
app.use('/api/config', configRouter);
app.use('/api/tryon', tryonRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Amazon Grading API Server running at http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📦 Returns API: http://localhost:${PORT}/api/returns`);
  console.log(`🛍️  P2P API:     http://localhost:${PORT}/api/p2p/products`);
  console.log(`💚 Donations:   http://localhost:${PORT}/api/donations/campaigns`);
  console.log(`👤 Profile:     http://localhost:${PORT}/api/profile`);
  console.log(`🤖 Grading:     http://localhost:${PORT}/api/grading`);
  console.log(`👗 Try-On:      http://localhost:${PORT}/api/tryon\n`);
});
