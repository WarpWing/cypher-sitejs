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
      host: 'cypher',
      ref: 'origin/master',
      repo: 'https://github.com/CypherBot/sitejs',
      path: '/home/kcomain/sitejs-prod',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    homeserver: {
      user: 'kcomain',
      host: '192.168.2.16',
      ref: 'origin/master',
      repo: 'https://github.com/CypherBot/sitejs',
      path: '/home/kcomain/hosting/cyphersite',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
}
