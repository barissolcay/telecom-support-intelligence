FROM python:3.14-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY pyproject.toml README.md ./
COPY src ./src
COPY apps/api ./apps/api
COPY scripts ./scripts
COPY knowledge_base ./knowledge_base
RUN pip install --no-cache-dir .
EXPOSE 8000
CMD ["uvicorn", "telcoassist.api.app:app", "--host", "0.0.0.0", "--port", "8000"]
