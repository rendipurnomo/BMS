import app from '../src/app';
import { connectDatabase } from '../src/db';

export default async (req: any, res: any) => {
  try {
    await connectDatabase();
  } catch (err) {
    console.error('Database connection failed in serverless entry point:', err);
  }
  return app(req, res);
};
