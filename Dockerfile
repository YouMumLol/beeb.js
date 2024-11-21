# Use official Node.js image as the base image
FROM node:22

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install FFmpeg and any required dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*  # Clean up the cache to reduce image size

# Copy package.json and package-lock.json (if available) into the container
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of your bot code into the container
COPY . .

# Expose the port your bot might use (usually not required for Discord bots, but useful if your bot has HTTP endpoints)
# EXPOSE 8080

# Command to run your bot when the container starts
CMD ["npm", "start"]
