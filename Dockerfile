# Use an official Node.js runtime as the base image
FROM node:22-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Create a non-root user and group
RUN addgroup -S www-data && adduser -S www-data -G www-data

# Copy only necessary files (src and public will be mounted as volumes)
COPY . .

# Change ownership of the app directory
RUN chown -R www-data:www-data /app

# Make the uploads directory writable by www-data
# This needs to happen after chown and before switching user if uploads is part of /app
RUN mkdir -p /app/public/uploads/memes /app/public/uploads/profiles
RUN chown -R www-data:www-data /app/public/uploads
RUN chmod -R 770 /app/public/uploads

# Switch to the non-root user
USER www-data

# Expose the port the app will run on
EXPOSE 8080

# Command to run the application
CMD ["npm", "run", "start"]
