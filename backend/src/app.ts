import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import yamljs from 'yamljs';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import apiRouter from './routes';

const app = express();

// Enable CORS — restrict to frontend origin in production
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({
  origin: allowedOrigin === '*' ? true : allowedOrigin,
  credentials: true,
}));

// Load Swagger document
let swaggerDocument: any = null;
try {
  swaggerDocument = yamljs.load(path.join(__dirname, 'swagger.yaml'));
} catch (err) {
  try {
    swaggerDocument = yamljs.load(path.join(process.cwd(), 'src', 'swagger.yaml'));
  } catch (err2) {
    console.warn('Warning: swagger.yaml could not be loaded. API documentation will be unavailable.');
  }
}

// Mount Swagger UI
if (swaggerDocument) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} else {
  app.get('/api-docs', (req, res) => {
    res.status(404).send('API documentation is currently unavailable.');
  });
}

// Global Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Mounting API Router under /api/v1
app.use('/api/v1', apiRouter);

// Root path diagnostic route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to Backlog Management System (BMS) API Service',
    version: '1.0.0',
  });
});

// Global Error Handler Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error occurred.',
  });
});

export default app;
