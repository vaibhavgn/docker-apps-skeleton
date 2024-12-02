# Use Node.js image
FROM node:alpine

# Set working directory
# WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the port your server uses
EXPOSE 3000

# Command to start the server
CMD ["node", "index.js"]