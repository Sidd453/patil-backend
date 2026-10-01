import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

const start = async () => {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`Website:     http://localhost:${env.port}`);
    console.log(`Admin panel: http://localhost:${env.port}/admin`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
