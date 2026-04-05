FROM mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm

WORKDIR /workspace

USER root

RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    git \
    curl \
    vim \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

USER node
