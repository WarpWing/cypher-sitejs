module.exports = {
    apps: [
        {
            script: 'index.js',
            watch: '.',
            instances: 4,
            exec_mode: 'cluster',
            max_memory_restart: '500M',
            env: {
                NODE_ENV: 'development',
                DEBUG: 1,
                PORT: 8081
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 8080
            },
            env_dev: {
                NODE_ENV: 'development',
                DEBUG: 1,
                PORT: 8080
            },
        }
    ],
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
        beta: {
            user: 'kcomain',
            host: 'cyphersite',
            ref: 'origin/develop',
            repo: 'https://github.com/tempus-dev/cypher-sitejs',
            path: '/home/kcomain/sitejs-develop',
            'pre-deploy-local': '',
            'post-deploy': 'yarn install && pm2 reload ecosystem.config.js --env dev',
            'pre-setup': ''
        }
    }
}
