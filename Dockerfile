FROM node:18-slim

# Install Chromium and required libraries
RUN apt-get update && apt-get install -y \
  chromium \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libnss3 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  wget \
  --no-install-recommends && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all other files (including the src/ folder)
COPY . .

# Start the app
CMD ["node", "src/index.js"]
