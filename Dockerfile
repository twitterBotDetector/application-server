FROM node:8.9-alpine

# Create app directory
WORKDIR /usr/src/app

COPY ["package.json", "package-lock.json*", "./"]
RUN npm install

# Copy app source code
COPY . .

#Expose port and start application
EXPOSE 8085
CMD npm start