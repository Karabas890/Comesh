FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get -o Acquire::Retries=2 -o Acquire::http::Timeout=30 update && apt-get -o Acquire::Retries=2 -o Acquire::http::Timeout=30 install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build
ENV NODE_ENV=production
EXPOSE 3000
RUN mkdir -p /app/.data && chown -R node:node /app/.next /app/.data
USER node
CMD ["sh","-c","npx prisma migrate deploy && npm run start"]
