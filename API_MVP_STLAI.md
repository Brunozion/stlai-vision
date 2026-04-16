# API do MVP STLAI

## Objetivo

Definir uma API clara para o frontend conversar com a plataforma sem depender do `n8n`.

Padrao recomendado:

- API REST
- autenticacao por JWT ou sessao
- jobs assincronos para geracao
- respostas curtas e previsiveis

## Fluxo macro da API

```text
Frontend
  -> cria projeto
  -> envia imagens
  -> salva contexto
  -> dispara geracao de texto
  -> aprova texto
  -> dispara geracao de imagem
  -> consulta status
  -> lista resultados
  -> regenera imagens
```

## Convencoes

Base path:

`/api/v1`

Formato de erro:

```json
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Voce nao possui creditos suficientes para gerar imagens."
  }
}
```

## 1. Projetos

## Criar projeto

`POST /api/v1/projects`

Request:

```json
{
  "name": "Chaveiro cachorro",
  "language": "pt-BR",
  "planType": "basic"
}
```

Response:

```json
{
  "id": "project_uuid",
  "status": "draft",
  "language": "pt-BR",
  "planType": "basic"
}
```

## Listar projetos

`GET /api/v1/projects`

## Buscar projeto

`GET /api/v1/projects/:projectId`

Response esperada:

```json
{
  "id": "project_uuid",
  "name": "Chaveiro cachorro",
  "status": "text_review",
  "language": "pt-BR",
  "planType": "basic",
  "coverImageUrl": "https://...",
  "createdAt": "2026-04-15T12:00:00Z"
}
```

## 2. Upload de imagens

## Obter URL de upload

`POST /api/v1/projects/:projectId/uploads/presign`

Request:

```json
{
  "files": [
    {
      "fileName": "produto-1.jpg",
      "mimeType": "image/jpeg",
      "sizeBytes": 123456
    }
  ]
}
```

Response:

```json
{
  "uploads": [
    {
      "uploadUrl": "https://storage...",
      "storageKey": "projects/project_uuid/source/1.jpg",
      "publicUrl": "https://cdn..."
    }
  ]
}
```

## Confirmar upload

`POST /api/v1/projects/:projectId/assets`

Request:

```json
{
  "assets": [
    {
      "storageKey": "projects/project_uuid/source/1.jpg",
      "fileUrl": "https://cdn...",
      "mimeType": "image/jpeg",
      "width": 1200,
      "height": 1200,
      "sizeBytes": 123456,
      "sortOrder": 1
    }
  ]
}
```

## 3. Contexto do produto

## Salvar contexto

`PUT /api/v1/projects/:projectId/context`

Request:

```json
{
  "productName": "Chaveiro cachorro articulado",
  "category": "Acessorios",
  "shortContext": "Produto artesanal para bolsa, mochila, chave e decoracao",
  "dimensionsXcm": 3.0,
  "dimensionsYcm": 2.0,
  "dimensionsZcm": 1.5,
  "weightGrams": 25,
  "voltage": null,
  "color": "Bege",
  "material": "Madeira",
  "targetMarketplaces": ["shopee", "mercado_livre"],
  "extraAttributes": {
    "handmade": true,
    "giftable": true
  }
}
```

## Buscar contexto

`GET /api/v1/projects/:projectId/context`

## 4. Geracao de texto

## Disparar geracao de texto

`POST /api/v1/projects/:projectId/generations/text`

Request:

```json
{
  "mode": "default"
}
```

Response:

```json
{
  "jobId": "job_uuid",
  "status": "queued",
  "creditsReserved": 5
}
```

## Buscar resultado atual de texto

`GET /api/v1/projects/:projectId/text-result`

Response:

```json
{
  "id": "text_result_uuid",
  "titles": [
    "Titulo 1",
    "Titulo 2",
    "Titulo 3",
    "Titulo 4"
  ],
  "description": "Descricao completa...",
  "bullets": [
    "Beneficio 1",
    "Beneficio 2",
    "Beneficio 3"
  ],
  "approvedByUser": false
}
```

## Aprovar texto

`POST /api/v1/projects/:projectId/text-result/:textResultId/approve`

Request:

```json
{
  "approved": true
}
```

## Regenerar texto

`POST /api/v1/projects/:projectId/generations/text/regenerate`

## 5. Geracao de imagem

## Disparar geracao de imagem

`POST /api/v1/projects/:projectId/generations/images`

Request:

```json
{
  "preset": "default_8_pack",
  "aspectRatio": "1:1",
  "sizes": [800, 1000]
}
```

Response:

```json
{
  "jobId": "job_uuid",
  "status": "queued",
  "creditsReserved": 20
}
```

## Listar imagens atuais

`GET /api/v1/projects/:projectId/image-results`

Response:

```json
{
  "items": [
    {
      "id": "image_uuid",
      "imageKind": "white_background",
      "title": "Catalogo",
      "fileUrl": "https://cdn...",
      "width": 1000,
      "height": 1000
    }
  ]
}
```

## Regenerar imagens

`POST /api/v1/projects/:projectId/generations/images/regenerate`

Request:

```json
{
  "preset": "default_8_pack",
  "reason": "user_requested_new_variations"
}
```

## Deletar imagem de resultado

`DELETE /api/v1/projects/:projectId/image-results/:imageResultId`

Observacao:

- eu so permitiria isso se fizer sentido na UX
- para MVP pode ser melhor apenas esconder visualmente ou manter o historico

## 6. Jobs e status

## Buscar job

`GET /api/v1/jobs/:jobId`

Response:

```json
{
  "id": "job_uuid",
  "jobType": "image_generation",
  "status": "processing",
  "provider": "nano-banana-2",
  "startedAt": "2026-04-15T12:05:00Z",
  "completedAt": null,
  "errorMessage": null
}
```

## Listar jobs do projeto

`GET /api/v1/projects/:projectId/jobs`

## 7. Webhook interno do n8n

Essas rotas nao sao para o frontend. Sao para o `n8n` atualizar o backend.

## Callback de sucesso

`POST /api/v1/internal/generation-callbacks/success`

Request:

```json
{
  "jobId": "job_uuid",
  "jobType": "image_generation",
  "provider": "nano-banana-2",
  "result": {
    "images": [
      {
        "imageKind": "lifestyle",
        "fileUrl": "https://cdn..."
      }
    ]
  }
}
```

## Callback de erro

`POST /api/v1/internal/generation-callbacks/failure`

Request:

```json
{
  "jobId": "job_uuid",
  "jobType": "image_generation",
  "provider": "nano-banana-2",
  "errorCode": "PROVIDER_TIMEOUT",
  "errorMessage": "Timeout while generating image"
}
```

## 8. Creditos

## Consultar saldo

`GET /api/v1/credits/balance`

Response:

```json
{
  "balance": 120
}
```

## Extrato de creditos

`GET /api/v1/credits/transactions`

## 9. Resumo final

## Buscar resumo do projeto

`GET /api/v1/projects/:projectId/summary`

Response:

```json
{
  "project": {
    "id": "project_uuid",
    "name": "Chaveiro cachorro"
  },
  "text": {
    "titles": ["...", "...", "...", "..."],
    "description": "..."
  },
  "images": {
    "count": 8,
    "items": []
  },
  "videos": {
    "count": 0,
    "status": "not_enabled"
  },
  "credits": {
    "totalSpent": 25
  }
}
```

## Regras de negocio importantes na API

### 1. Nao gerar imagem sem contexto minimo

Antes de chamar geracao de imagem, validar:

- existe ao menos 1 imagem
- contexto salvo
- creditos suficientes

### 2. Nao gerar video sem texto aprovado

Essa regra deve estar no backend, nao no frontend.

### 3. Regeneracao consome novos creditos

Cada regeneracao cria:

- novo `generation_job`
- nova reserva de credito
- nova versao de resultados

### 4. Webhooks internos precisam de autenticacao

Sugestao:

- header com token interno
- ip allowlist se possivel
- idempotency key no callback

## Ordem recomendada de implementacao da API

1. `POST /projects`
2. `POST /uploads/presign`
3. `POST /assets`
4. `PUT /context`
5. `POST /generations/text`
6. `GET /jobs/:jobId`
7. `GET /text-result`
8. `POST /text-result/:id/approve`
9. `POST /generations/images`
10. `GET /image-results`
11. `GET /summary`

## Versao futura

Depois do MVP, eu adicionaria:

- `POST /exports/mercado-livre`
- `POST /exports/shopee`
- `POST /generations/videos`
- `POST /avatar-videos`
- `GET /analytics/projects/:projectId`
