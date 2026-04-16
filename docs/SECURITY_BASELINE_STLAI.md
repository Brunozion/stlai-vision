# Baseline de Seguranca STLAI MVP

## Objetivo

Estabelecer o minimo de seguranca necessario para o MVP nao nascer com vazamento de segredo ou arquitetura fragil.

## Regras obrigatorias

### 1. Segredos nunca entram no repositorio

Inclui:

- chave OpenAI
- chave Gemini
- chave Nano Banana
- `DATABASE_URL` real
- segredos JWT
- token interno do `n8n`
- access keys de storage

### 2. Frontend nao pode expor segredo de provider

Toda chamada para provider deve sair do backend ou do `n8n`.

### 3. Upload deve usar URL assinada

O usuario envia o arquivo ao storage com URL temporaria gerada pela API.

### 4. Callback interno deve ser autenticado

O `n8n` precisa chamar a API com um token interno exclusivo.

### 5. Creditos e autorizacao ficam na API

Nunca no frontend e nunca somente no `n8n`.

## Padrão de arquivos de ambiente

### Arquivos permitidos localmente

- raiz: `.env.example`
- `apps/web/.env.local`
- `apps/api/.env`
- `infra/n8n/.env`

### Arquivos proibidos no Git

- qualquer `.env` real
- export do `n8n` com credenciais embutidas

## Recomendacao para GitHub

Antes de subir:

1. revisar `.gitignore`
2. confirmar que nao existe `.env` rastreado
3. confirmar que nenhuma chave esta hardcoded
4. revisar commits antes de push

## Checklist minimo antes do primeiro push

- `.gitignore` configurado
- `.env.example` sem segredo real
- nenhum token no codigo
- nenhum endpoint interno sem auth
- nenhum console log com segredo

## Recomendacao para o backend

- usar schema de validacao para env
- falhar ao subir se faltar segredo obrigatorio
- diferenciar config publica e privada

## Recomendacao para o `n8n`

- guardar credenciais no proprio cofre do `n8n` ou via env local
- nao exportar workflow com segredo embutido para o repo

## Recomendacao para futuro proximo

Quando formos conectar tudo, vale implementar:

- rotacao de segredos
- rate limit
- auditoria de jobs
- monitoramento de falha de callback
