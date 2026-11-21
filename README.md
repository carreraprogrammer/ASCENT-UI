# daniel15k-ui

## Correr en local con datos de ejemplo

```bash
scripts/serve-local.sh
```

Levanta la app en http://localhost:5173 (abre `/login` y pulsa "Entrar con la sesión de ejemplo"). Sin red: una API
simulada en memoria responde con datos inventados en COP (usuario `ejemplo@ascent.local`); no llama a
api.ascent.thecyborgway.dev ni a ningún servicio externo. Los cambios que hagas (editar una transacción, etc.) viven
solo en la memoria del navegador y se pierden al recargar. Queda en primer plano; Ctrl+C lo detiene.

La simulación solo se activa con `VITE_LOCAL_FIXTURES=1` (la define el script) y nunca entra al build de producción:
`npm run check:bundle` lo comprueba y corre en CI. El código está en `src/local-fixtures/`.
