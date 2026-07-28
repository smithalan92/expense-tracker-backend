module.exports = {
  apps: [
    {
      name: 'expense-tracker-backend',
      script: 'index.js',
      cwd: '/var/www/apps/expense-tracker-backend',
      node_args: '--env-file=/var/www/apps/env/.expense-tracker-backend.env',
      // Resolved by the deploy script from .node-version via fnm, so the node
      // version lives in the repo rather than in a hardcoded server path.
      interpreter: process.env.PM2_INTERPRETER || 'node',
      time: true,
    },
  ],
};
