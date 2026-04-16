# apps/api

Backend central da STLAI.

## Responsabilidades

- autenticacao
- autorizacao
- gestao de projetos
- persistencia do sistema
- controle de creditos
- integracao com storage
- disparo de jobs para o `n8n`
- recebimento de callbacks internos

## Sugestao de stack

- Node.js
- TypeScript
- Fastify ou NestJS
- Prisma ou Drizzle
- PostgreSQL
- Zod

## Estrutura sugerida

```text
src/
  app/
  config/
  modules/
    auth/
    users/
    projects/
    uploads/
    product-context/
    generations/
    text-results/
    image-results/
    credits/
    webhooks/
  lib/
    db/
    queue/
    storage/
    providers/
      openai/
      gemini/
      image/
  middlewares/
  utils/
```

## Regra importante

O backend e a fonte oficial de verdade do sistema. O `n8n` apenas executa os workflows.

## Banco

O backend usa `PostgreSQL` via `pg` e le a conexao da variavel `DATABASE_URL`.

### Arquivos principais

- `src/lib/db/database.ts`
- `src/config/env.ts`
- `sql/001_initial_schema.sql`
