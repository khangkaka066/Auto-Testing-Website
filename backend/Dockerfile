FROM node:20-slim

# Install Playwright system dependencies + Docker CLI (for DB bootstrap)
RUN apt-get update && apt-get install -y \
    wget curl ca-certificates \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
    libxdamage1 libxrandr2 libgbm1 libpango-1.0-0 \
    libasound2 libxshmfence1 \
    docker.io \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Install Playwright browsers
RUN npx playwright install chromium --with-deps

COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]
