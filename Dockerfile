# Use an official Node.js runtime as the base image
FROM node:22-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
RUN apt-get update -y && apt-get upgrade -y

# Ensure www-data user exists (should already exist in Debian-based images)
# and create app directories with proper permissions
RUN groupadd -r www-data || true && \
    useradd -r -g www-data www-data || true && \
    mkdir -p /app/public/uploads/memes /app/public/uploads/profiles && \
    chown -R www-data:www-data /app && \
    chmod -R 755 /app

# Copy package.json and package-lock.json
COPY --chown=www-data:www-data package*.json ./

# Install dependencies
RUN npm ci --production

# Copy the rest of the application
COPY --chown=www-data:www-data . .

# Switch to the www-data user
USER www-data

# Expose the port the app will run on
EXPOSE 8080

# Command to run the application (already as www-data user)
CMD ["npm", "run", "start"]