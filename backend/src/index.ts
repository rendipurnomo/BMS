import app from './app';
import { connectDatabase } from './db';

const PORT = process.env.PORT || 5000;
async function startServer() {
  try {
    // Connect to Database
    await connectDatabase();

    // Start Express HTTP Server
    app.listen(PORT, () => {
      console.log(`BMS backend server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Fatal: Server startup failed due to database connection issue.', error);
    process.exit(1);
  }
}

startServer();
