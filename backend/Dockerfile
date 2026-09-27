FROM node:20-slim

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDeps needed for prisma generate)
RUN npm ci

# Generate Prisma client using the PostgreSQL schema for production
RUN npx prisma generate --schema=prisma/schema.postgres.prisma

COPY src ./src

EXPOSE 5000

# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=prisma/schema.postgres.prisma && node src/app.js"]
