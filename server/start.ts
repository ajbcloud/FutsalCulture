// Server entry point for production deployment
// This ensures the server starts properly in production environment

// Set production environment if not already set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// Ensure we bind to 0.0.0.0 for cloud deployments
if (!process.env.HOST) {
  process.env.HOST = '0.0.0.0';
}

// Import and start the main server
require('./index');

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});