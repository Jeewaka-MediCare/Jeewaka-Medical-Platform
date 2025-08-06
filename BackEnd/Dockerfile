# BackEnd/Dockerfile
FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

# Start development server with nodemon
CMD ["npm", "run", "dev"]