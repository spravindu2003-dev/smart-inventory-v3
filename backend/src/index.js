const app = require('./app');
const config = require('./config/env');

process.on('unhandledRejection', (err) => {
  console.error(err);
});

process.on('uncaughtException', (err) => {
  console.error(err);
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
