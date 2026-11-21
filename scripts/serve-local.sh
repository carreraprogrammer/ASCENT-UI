#!/usr/bin/env bash
# TCW-5: sirve Ascent en local con datos de ejemplo, sin red (para QA con capturas de la oficina).
# API simulada en memoria (VITE_LOCAL_FIXTURES=1), usuario de ejemplo fijo, todo en 127.0.0.1:5173. No llama a
# api.ascent.thecyborgway.dev ni a ningún servicio externo, y no usa secretos. Queda en primer plano hasta que lo maten.
# Entrar: http://localhost:5173/login (botón "Entrar con la sesión de ejemplo").
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
[ -d node_modules ] || npm ci --no-audit --no-fund
export VITE_LOCAL_FIXTURES=1
# Un puerto sin servicio: si alguna pantalla pidiera algo sin fixture, falla rápido y visible en vez de salir a internet.
export VITE_API_URL="${VITE_API_URL:-http://127.0.0.1:1}"
exec npx vite --host 127.0.0.1 --port 5173 --strictPort
