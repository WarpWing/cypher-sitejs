cat docker_token.key | docker login docker.pkg.github.com -u kcomain --password-stdin
docker tag 055e4a02367d docker.pkg.github.com/tempus-dev/cypher-sitejs/cypher-backend:develop
docker push docker.pkg.github.com/tempus-dev/cypher-sitejs/cypher-backend:develop