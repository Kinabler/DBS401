# Use an official Node.js runtime as the base image
FROM node:22-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
RUN  apt-get update -y && apt-get upgrade -y

# Copy package.json and package-lock.json
COPY package*.json ./
# Copy the rest of the application
COPY ./src ./src

# Install dependencies
RUN npm install

# Expose the port the app will run on
EXPOSE 8080

# Command to run the application
CMD ["npm", "run", "start"]