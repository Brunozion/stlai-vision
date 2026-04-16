# Workflow n8n - Imagem STLAI

## Nome sugerido

`wf_image_generation_stlai`

## Objetivo

Receber o payload do backend, gerar variacoes visuais do produto e devolver os resultados para a API via callback interno.

## Webhook de entrada

Use o webhook configurado em:

- `N8N_IMAGE_WEBHOOK_PATH`

Exemplo atual:

- `/webhook/vision-1-image`

## Payload esperado

```json
{
  "jobId": "uuid",
  "projectId": "uuid",
  "jobType": "image_generation",
  "language": "pt-BR",
  "preset": "default_8_pack",
  "aspectRatio": "1:1",
  "sizes": [1000],
  "promptVersion": "img_v1",
  "project": {
    "id": "uuid",
    "name": "Projeto exemplo",
    "status": "image_generating",
    "language": "pt-BR",
    "planType": "basic"
  },
  "productContext": {
    "productName": "Chaveiro cachorro articulado",
    "category": "Acessorios",
    "shortContext": "Produto artesanal para bolsa e mochila",
    "dimensionsXcm": 3,
    "dimensionsYcm": 2,
    "dimensionsZcm": 1.5,
    "weightGrams": 25,
    "color": "Bege",
    "material": "Madeira",
    "targetMarketplaces": ["shopee", "mercado_livre"]
  },
  "sourceImages": [
    {
      "id": "uuid",
      "fileUrl": "https://...",
      "mimeType": "image/jpeg",
      "width": 1000,
      "height": 1000,
      "assetRole": "source"
    }
  ],
  "callbacks": {
    "successUrl": "http://localhost:4003/api/v1/internal/generation-callbacks/success",
    "failureUrl": "http://localhost:4003/api/v1/internal/generation-callbacks/failure",
    "token": "secret"
  }
}
```

## Nodes recomendados

1. Webhook Trigger
2. Set - normalizar dados e separar referencias
3. Set/Function - montar prompt de capa
4. HTTP Request - gerar imagem de capa
5. Set/Function - montar prompt de medidas
6. HTTP Request - gerar imagem de medidas
7. Set/Function - montar prompt lifestyle
8. HTTP Request - gerar lifestyle
9. Function - consolidar objetos de saida
10. HTTP Request - callback de sucesso
11. Branch de erro
12. HTTP Request - callback de falha

## Estrategia recomendada

Para o MVP:

- gerar capa separada
- gerar medidas separada
- gerar lifestyle separada ou em lote pequeno

Isso reduz risco de composicao ruim e facilita debug.

## Prompts a usar

Use os prompts:

- `Prompt base de capa`
- `Prompt base de lifestyle`
- `Prompt base de imagem com medidas`

do arquivo [PROMPTS_BASE_STLAI.md](C:/Users/NDB/Documents/New%20project/infra/n8n/docs/PROMPTS_BASE_STLAI.md).

## Formato de callback de sucesso

```json
{
  "jobId": "uuid",
  "jobType": "image_generation",
  "provider": "nano-banana-2",
  "result": {
    "images": [
      {
        "imageKind": "white_background",
        "title": "Catalogo",
        "fileUrl": "https://...",
        "storageKey": "projects/uuid/results/catalogo.jpg",
        "width": 1000,
        "height": 1000,
        "variationIndex": 1
      },
      {
        "imageKind": "dimensions",
        "title": "Dimensoes",
        "fileUrl": "https://...",
        "storageKey": "projects/uuid/results/dimensions.jpg",
        "width": 1000,
        "height": 1000,
        "variationIndex": 2
      },
      {
        "imageKind": "lifestyle",
        "title": "Lifestyle 1",
        "fileUrl": "https://...",
        "storageKey": "projects/uuid/results/lifestyle-1.jpg",
        "width": 1000,
        "height": 1000,
        "variationIndex": 3
      }
    ]
  }
}
```

Headers do callback:

```text
x-internal-token: {{$json.callbacks.token}}
content-type: application/json
```

## Formato de callback de falha

```json
{
  "jobId": "uuid",
  "jobType": "image_generation",
  "provider": "nano-banana-2",
  "errorCode": "IMAGE_GENERATION_FAILED",
  "errorMessage": "mensagem detalhada"
}
```

## Regra importante

As URLs finais em `fileUrl` precisam estar acessiveis pelo frontend. Se a API de imagem devolver binario ou base64, faca antes o upload para um storage/CDN e so depois chame o callback.
