FROM node:18 AS builder

WORKDIR /app

RUN npm install -g @nestjs/cli
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:18

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY package*.json ./

### COPY firebase_auth_credentials.json ./firebase_auth_credentials.json  

RUN npm install --only=production

EXPOSE 5001

CMD ["node", "dist/main.js"]
