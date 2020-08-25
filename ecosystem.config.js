module.exports = {
  apps: [{
    script: 'index.js',
    watch: '.',
    instances: 4,
    exec_mode: 'cluster'
  }],
  env: {
    NODE_ENV: 'development'
  },
  env_production: {
    NODE_ENV: 'production'
  },
  deploy: {
    production: {
      user: 'kcomain',
      host: 'cyphersite',
      ref: 'origin/master',
      repo: 'https://github.com/tempus-dev/cypher-sitejs',
      path: '/home/kcomain/sitejs-prod',
      'pre-deploy-local': '',
      'post-deploy': 'yarn install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    alpha: {
      user: 'kcomain',
      host: 'cyphersite',
      ref: 'origin/develop',
      repo: 'https://github.com/tempus-dev/cypher-sitejs',
      path: '/home/kcomain/sitejs-develop',
      'pre-deploy-local': '',
      'post-deploy': 'yarn install && pm2 reload ecosystem.config.js',
      'pre-setup': ''
    }
  }
}
