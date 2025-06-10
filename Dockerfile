# Use an official Node.js runtime as the base image
FROM node:22-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage build cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Create a non-root user and group for security
RUN addgroup -S www-data && adduser -S www-data -G www-data

# Copy application source code (respecting .dockerignore)
COPY . .

# Create and set permissions for upload directories
RUN mkdir -p /app/public/uploads/memes /app/public/uploads/profiles && \
    chown -R www-data:www-data /app/public/uploads && \
    chmod -R 770 /app/public/uploads

# Change ownership of the app directory
RUN chown -R www-data:www-data /app

# Switch to the non-root user
USER www-data

# Expose the port the app will run on
EXPOSE 8080

# Command to run the application
CMD ["npm", "run", "start"]
