import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';

const app = express();

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 3080;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, () => {
  console.log(`Admin API server listening on http://${HOST}:${PORT}`);
});
