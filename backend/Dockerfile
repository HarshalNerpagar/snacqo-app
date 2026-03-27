FROM node:20-alpine

WORKDIR /app

# bcrypt requires native compilation on Alpine (musl libc)
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm install prisma \
    && npm rebuild bcrypt --build-from-source

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=30s \
    CMD wget --spider -q http://localhost:3001/health || exit 1

CMD npx prisma db push && npm start
