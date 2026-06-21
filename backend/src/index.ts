import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env.local if it exists, otherwise fallback to .env
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
// Always load .env to fill in missing variables
dotenv.config();

import app from './app';
import { connectDatabase } from './db';

// Connect to Database (This will happen when Vercel boots the function)
connectDatabase().catch((error) => {
  console.error('Fatal: Database connection issue.', error);
});

// If NOT running in Vercel, start the server normally
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`BMS backend server is running on port ${PORT}`);
  });
}

// Export the app for Vercel Serverless
export default app;
