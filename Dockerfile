# Use an official Node.js runtime as the base image
FROM node:22-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Create www-data user and group for running the application
# Using numeric IDs for better compatibility across systems
RUN addgroup -g 82 www-data && \
    adduser -u 82 -G www-data -s /bin/sh -D www-data

# Copy only necessary files (src and public will be mounted as volumes)
COPY . .

# Make the uploads directory writable
RUN mkdir -p /app/public/uploads/memes /app/public/uploads/profiles && \
    chown -R www-data:www-data /app && \
    chmod -R 755 /app && \
    chmod -R 770 /app/public/uploads

# Switch to the non-root user
USER www-data

# Expose the port the app will run on
EXPOSE 8080

# Command to run the application
CMD ["npm", "run", "start"]