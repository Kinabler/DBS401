# Use an official Node.js runtime as the base image
FROM node:22-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy only necessary files (src and public will be mounted as volumes)
COPY . .

# Make the uploads directory writable
RUN mkdir -p /app/public/uploads/memes /app/public/uploads/profiles
RUN chmod -R 777 /app/public/uploads

# Expose the port the app will run on
EXPOSE 8080

# Command to run the application
CMD ["npm", "run", "start"]
