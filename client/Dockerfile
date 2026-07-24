FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_APP_URL
ARG VITE_API_URL
ENV VITE_APP_URL=${VITE_APP_URL:-https://strideto.com}
ENV VITE_API_URL=${VITE_API_URL:-/api}
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
