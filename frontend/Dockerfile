# Use Node Alpine image
FROM node:lts-alpine

# Set working directory
WORKDIR /app

# Copy only package files first (for layer caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source code
COPY . .

# Expose Vite's dev server port
EXPOSE 8080

# Run the dev server
CMD ["npm", "run", "dev"]
