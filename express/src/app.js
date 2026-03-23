require('dotenv').config();

const express        = require('express');
const helmet         = require('helmet');
const { rateLimit }  = require('express-rate-limit');
const { errorHandler } = require('./middleware/error-handler');
const { logger }     = require('./utils/logger');

const app = express();

app.disable('x-powered-by');

app.use(helmet());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
}));

app.use(express.json({ limit: '50kb' }));

app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url }, 'request');
  next();
});

app.use('/api/users', require('./routes/users'));
app.use('/api/sync',  require('./routes/sync'));

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

app.use(errorHandler);

module.exports = app;
