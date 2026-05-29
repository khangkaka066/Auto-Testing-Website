FROM mcr.microsoft.com/playwright:v1.60.0-noble

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    WORKSPACE_BASE_PATH=/app/data/workspaces \
    SOURCE_WORKSPACE_BASE_PATH=/app/data/uploaded_sources \
    UPLOAD_ARCHIVE_BASE_PATH=/app/data/uploaded_archives

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend/ai_engine

COPY backend/ai_engine/requirements.txt ./requirements.txt
RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --upgrade pip \
    && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

COPY backend/ai_engine/package.json ./package.json
RUN npm install

COPY backend/ai_engine ./

ENV PATH="/opt/venv/bin:${PATH}"

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8001}"]
