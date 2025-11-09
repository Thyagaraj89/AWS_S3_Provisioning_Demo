FROM hashicorp/terraform:1.8 as tf
FROM node:20-slim

# terraform
COPY --from=tf /bin/terraform /usr/local/bin/terraform

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Provide repo root at runtime:
#  docker run -e RUNNER_REPO_ROOT=/workspace -v $(pwd):/workspace ...
CMD ["npm","start"]
