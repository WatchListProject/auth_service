# Fase de construcción
FROM node:18 AS builder

WORKDIR /app

# Instalar @nestjs/cli y las dependencias
RUN npm install -g @nestjs/cli
COPY package*.json ./
RUN npm install

# Copiar el resto del código y construir la aplicación
COPY . .
RUN npm run build

# Fase de producción
FROM node:18

WORKDIR /app

# Copiar la compilación desde la fase de construcción
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Instalar solo las dependencias de producción
RUN npm install --only=production

EXPOSE 5001

CMD ["node", "dist/main.js"]
