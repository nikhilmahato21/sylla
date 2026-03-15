module.exports = {
  apps: [
    {
      name: "sylla-api",
      script: "./backend/dist/index.js",
      instances: "max",
      exec_mode: "cluster",
      watch: false,
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      error_file: "./logs/api-error.log",
      out_file: "./logs/api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      max_memory_restart: "500M",
    },
  ],
};
