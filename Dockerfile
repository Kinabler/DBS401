# Use an official Node.js runtime as the base image
FROM node:22-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
RUN apt-get update -y && \
    apt-get install -y apt-utils && \
    apt-get upgrade -y

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies as root
RUN npm ci --omit=dev

# Copy the rest of the application
COPY . .

# Create all necessary directories and set proper permissions
RUN mkdir -p /app/src/public/uploads/memes \
    /app/src/public/uploads/profiles \
    /app/public/uploads/memes \
    /app/public/uploads/profiles && \
    chown -R www-data:www-data /app && \
    chmod -R 755 /app/src/public/uploads

# Switch to the www-data user
USER www-data

# Expose the port the app will run on
EXPOSE 8080

# Command to run the application
CMD ["npm", "run", "start"]