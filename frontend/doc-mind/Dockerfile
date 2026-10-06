# Stage 1: Build React/Vite app
FROM node:22-alpine AS builder
LABEL author="Pranit Bhangale"
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Run frontend Node container
FROM node:22-alpine
LABEL author="Pranit Bhangale"
WORKDIR /app
COPY --from=builder /app /app
EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]