module.exports = {
  apps: [
    {
      name: 'netmanager-api',
      script: 'dist/index.js',
      cwd: './server',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        HOST: '127.0.0.1',
      },
      env_file: './.env',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '../logs/error.log',
      out_file: '../logs/out.log',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
