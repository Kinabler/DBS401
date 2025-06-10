# Use an official Node.js runtime as the base image
FROM node:22-alpine

# Set the working directory in the container
WORKDIR /app

# Create a non-root user and group for security.
# This step ensures the 'www-data' user exists before it's used later.
RUN addgroup -S www-data && adduser -S www-data -G www-data

# Copy package.json and package-lock.json first to leverage build cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code (respecting .dockerignore)
COPY . .

# Create upload directories and set all file permissions in a single, efficient step.
# This command will now succeed because the 'www-data' user has been created.
RUN mkdir -p /app/public/uploads/memes /app/public/uploads/profiles && \
    chmod -R 770 /app/public/uploads && \
    chown -R www-data:www-data /app

# Switch to the non-root user for better security
USER www-data

# Expose the port the app will run on
EXPOSE 8080

# Command to run the application when the container starts
CMD ["npm", "run", "start"]