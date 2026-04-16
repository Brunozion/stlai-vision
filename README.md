# STLAI MVP

Base inicial de arquitetura e organizacao do MVP da plataforma de geracao de anuncios para marketplaces.

## Objetivo

Receber de 1 a 5 imagens do produto, contexto estruturado do item e gerar:

- titulos otimizados
- descricao
- imagens derivadas
- no futuro, videos

## Estrutura do repositorio

```text
apps/
  web/                -> frontend Next.js
  api/                -> backend da STLAI
infra/
  n8n/                -> workflows, docs e assets do n8n
packages/
  shared/             -> schemas, tipos e contratos compartilhados
docs/                 -> arquitetura, banco, API, fluxos e seguranca
```

## Principio tecnico central

O frontend nunca conversa diretamente com provedores de IA nem com o `n8n`.

Fluxo correto:

`frontend -> api -> banco/storage -> n8n -> provedores -> api -> frontend`

## Seguranca

- nenhum segredo deve ser commitado
- usar apenas variaveis de ambiente locais
- subir ao GitHub somente `.env.example`
- `n8n` e backend devem usar tokens internos para callbacks

## Proximos passos

1. scaffold do frontend `apps/web`
2. scaffold do backend `apps/api`
3. criar banco PostgreSQL
4. configurar storage
5. conectar workflows do `n8n`
