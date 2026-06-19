#!/usr/bin/env bash
# Gera um certificado autoassinado para rodar o backend em HTTPS localmente.
# Uso: bash gerar-certificado.sh  (ou: npm run gerar-certificado)
set -e

DIRETORIO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/certs"
mkdir -p "$DIRETORIO"

openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout "$DIRETORIO/localhost-key.pem" \
  -out "$DIRETORIO/localhost.pem" \
  -days 365 \
  -subj "/C=BR/ST=PR/L=Cornelio Procopio/O=Radar Cripto/CN=localhost"

echo ""
echo "Certificado gerado em: $DIRETORIO"
echo "Reinicie o servidor (npm run dev) para que ele suba automaticamente em HTTPS."
