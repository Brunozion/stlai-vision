# Deploy Guide STLAI

## Estrategia recomendada

Para o estado atual do projeto:

- `apps/web` -> Vercel
- `apps/api` -> Railway

Essa divisao e a mais segura porque:

- o frontend e Next.js e encaixa muito bem na Vercel
- a API e Fastify rodando como servidor Node tradicional
- manter os dois separados reduz friccao e evita adaptar a API para serverless agora

## 1. GitHub antes do deploy

Recomendado fazer primeiro:

1. criar repositorio no GitHub
2. subir este monorepo
3. conectar Vercel ao repo
4. conectar Railway ao repo

Motivo:

- historico de alteracoes
- rollback
- CI/CD mais limpo
- integracao nativa com Vercel e Railway

## 2. Deploy do frontend na Vercel

Projeto a deployar:

- `apps/web`

### Configuracoes sugeridas na Vercel

- Framework Preset: `Next.js`
- Root Directory: `apps/web`
- Install Command: `corepack pnpm install --frozen-lockfile`
- Build Command: `corepack pnpm --filter web build`
- Output Directory: deixar padrao

### Environment Variables do frontend

Obrigatoria:

- `NEXT_PUBLIC_API_BASE_URL`

Exemplo:

```env
NEXT_PUBLIC_API_BASE_URL=https://api-seu-projeto.up.railway.app
```

## 3. Deploy da API no Render

Projeto a deployar:

- `apps/api`

Arquivo de apoio:

- [render.yaml](C:/Users/NDB/Documents/New%20project/render.yaml)

### Importante sobre monorepo no Render

Nao use `Root Directory=apps/api` neste projeto, porque a API depende de `packages/shared`, que esta fora dessa pasta.

Use o repositorio inteiro e deixe o build no root com:

- `corepack pnpm install --frozen-lockfile && corepack pnpm --filter api build`
- `corepack pnpm --filter api start`

### Variaveis de ambiente da API

Obrigatorias:

- `NODE_ENV=production`
- `PORT=10000`
- `APP_BASE_URL=https://api-seu-projeto.onrender.com`
- `CORS_ORIGIN=https://seu-frontend.vercel.app`
- `DATABASE_URL=...`
- `JWT_SECRET=...`
- `INTERNAL_API_TOKEN=...`
- `N8N_BASE_URL=https://n8n.stlflix.com`
- `N8N_INTERNAL_TOKEN=...`
- `N8N_ENABLED=true`
- `N8N_TEXT_WEBHOOK_PATH=/webhook/vision-1-text`
- `N8N_IMAGE_WEBHOOK_PATH=/webhook/vision-1-image`
- `OPENAI_API_KEY=...`
- `DEV_USER_EMAIL=...`
- `DEV_USER_NAME=...`

## 4. Configuracao do n8n em producao

O `n8n` deve receber callbacks apontando para a API publicada, nunca para `localhost`.

Por isso `APP_BASE_URL` da API precisa ser a URL publica final.

O frontend publicado na Vercel tambem precisa estar liberado no CORS da API:

- `CORS_ORIGIN=https://seu-frontend.vercel.app`

Se quiser permitir preview deployments da Vercel depois, podemos evoluir isso para uma lista separada por virgula.

## 5. Ordem recomendada

1. GitHub
2. Render para API
3. validar `/api/v1/health` e `/api/v1/health/db`
4. Vercel para frontend
5. apontar `NEXT_PUBLIC_API_BASE_URL` para a API publicada
6. rodar teste ponta a ponta

## 6. O que nao fazer agora

- nao subir `.env`
- nao publicar segredos no GitHub
- nao tentar colocar a API Fastify inteira na Vercel agora
