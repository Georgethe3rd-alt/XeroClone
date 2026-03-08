FROM node:22-alpine

WORKDIR /app

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

COPY package*.json ./
RUN npm install --production

COPY server.js ./
COPY public ./public

# Create Claude wrapper script
RUN echo '#!/bin/sh' > /app/claude-exec.sh && \
    echo 'TASK_FILE="$1"' >> /app/claude-exec.sh && \
    echo 'OUTPUT_FILE="$2"' >> /app/claude-exec.sh && \
    echo 'TASK=$(cat "$TASK_FILE")' >> /app/claude-exec.sh && \
    echo '/usr/local/bin/claude --print "$TASK" > "$OUTPUT_FILE" 2>&1' >> /app/claude-exec.sh && \
    chmod +x /app/claude-exec.sh

ENV PORT=80
ENV ANTHROPIC_API_KEY=""
ENV DASH_PASSWORD="Wayne2026#"

EXPOSE 80

CMD ["node", "server.js"]
