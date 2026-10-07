FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# escala.db (SQLite) fica fora da imagem — persiste via volume Docker,
# sobrevive a rebuild/redeploy do container.
ENV ESCALA_DB_PATH=/app/data/escala.db
VOLUME ["/app/data"]

EXPOSE 8080

# 0.0.0.0 aqui dentro é normal (rede isolada do container) — quem
# restringe o acesso é o docker-compose.yml, publicando a porta só em
# 127.0.0.1 no host (mesmo padrão do novanet-api).
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
