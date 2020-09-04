FROM node:latest
# make a place to put the stuff in
RUN mkdir -p /usr/src/cypher-backend
WORKDIR '/usr/src/cypher-backend'
COPY . /usr/src/cypher-backend
RUN npm install -g yarn
RUN yarn install
EXPOSE 8080/tcp
EXPOSE 8081/tcp