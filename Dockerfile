# Compatibility Dockerfile at repo root for platforms that auto-detect ./Dockerfile.
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_ENV=production \
    PORT=5000

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements files first for better Docker layer caching and to satisfy nested -r includes.
COPY config/requirements.txt config/requirements.txt
COPY config/requirements-dev.txt config/requirements-dev.txt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app && \
    mkdir -p /app/logs && \
    chown -R appuser:appuser /app/logs

USER appuser

EXPOSE 5000

CMD ["gunicorn", "--config", "config/gunicorn.conf.py", "wsgi:app"]
