# Build and serve static frontend with Nginx

# 1) Build stage
FROM node:20-slim AS build
WORKDIR /app
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci
COPY frontend/ /app/frontend/

# Build with API URL passed via build-arg
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN VITE_API_URL=$VITE_API_URL npm run build

# 2) Serve stage
FROM nginx:alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]


