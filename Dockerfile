FROM node:22-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# # Build if needed
# RUN npm run build

# Start the server
CMD ["node", "index.js"]
