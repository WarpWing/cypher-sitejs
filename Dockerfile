FROM node:latest
LABEL maintainer="kcomain@member.fsf.org"
# Define workdir
WORKDIR '/usr/src/cypher-backend'
#Copy Section 
COPY package.json yarn.lock /usr/src/cypher-backend/
COPY . /usr/src/cypher-backend
# RUN Command Array
RUN npm install pm2 -g
RUN mkdir -p /usr/src/cypher-backend
RUN yarn install --production
# RUN pm2-runtime ./ecosystem.config.js --env production
#Expose 8080/tcp
EXPOSE 8080/tcp
#Run pm2 ecosystem 
CMD ["pm2-runtime", "ecosystem.config.js", "--env", "production"]
