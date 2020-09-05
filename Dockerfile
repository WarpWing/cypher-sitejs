FROM node:latest
RUN npm install pm2 -g

# make a place to put the stuff in
RUN mkdir -p /usr/src/cypher-backend

# cwd to /usr/src/cypher-backend, install dependencies
WORKDIR '/usr/src/cypher-backend'
COPY package.json yarn.lock /usr/src/cypher-backend/
RUN yarn install --production

# copy code to location defined above
COPY . /usr/src/cypher-backend

#RUN npm install -g yarn --force

# Export port
EXPOSE 8080/tcp

# Disallow dev version port
# EXPOSE 8081/tcp

# RUN echo "a"
# Run the ecosystem file with pm2
CMD ["pm2-runtime", "ecosystem.config.js", "--env", "production"]
