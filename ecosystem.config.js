module.exports = {
  apps : [{
    script: 'index.js',
    watch: '.',
    instances: 4,
    exec_mode: 'cluster'
  }, {
    script: './service-worker/',
    watch: ['./service-worker']
  }],
  env: {
    "NODE_ENV": "development",
  },
  env_production:{
    "NODE_ENV": 'production'
  },
  deploy : {
    production : {
      user : 'kcomain',
      host : 'cypher',
      ref  : 'origin/master',
      repo : 'https://github.com/CypherBot/sitejs',
      path : '/home/kcomain/sitejs-prod',
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
