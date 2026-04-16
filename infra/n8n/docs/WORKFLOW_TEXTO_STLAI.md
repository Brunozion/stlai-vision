# Workflow n8n - Texto STLAI

## Nome sugerido

`wf_text_generation_stlai`

## Objetivo

Receber o payload do backend, gerar titulos e descricao com LLM e devolver o resultado para a API via callback interno.

## Webhook de entrada

Use o webhook configurado em:

- `N8N_TEXT_WEBHOOK_PATH`

Exemplo atual:

- `/webhook/vision-1-text`

## Payload esperado

```json
{
  "jobId": "uuid",
  "projectId": "uuid",
  "jobType": "text_generation",
  "language": "pt-BR",
  "mode": "default",
  "promptVersion": "text_v1",
  "project": {
    "id": "uuid",
    "name": "Projeto exemplo",
    "status": "text_generating",
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
    "voltage": null,
    "color": "Bege",
    "material": "Madeira",
    "targetMarketplaces": ["shopee", "mercado_livre"],
    "extraAttributes": {
      "handmade": true
    }
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
2. Set - normalizar dados do produto
3. Set ou Function - montar prompt consolidado de texto
4. HTTP Request para provider de LLM
5. Function - validar e normalizar resposta JSON
6. HTTP Request - callback de sucesso
7. Error Trigger ou branch de erro
8. HTTP Request - callback de falha

## Prompt a usar

Use o prompt `Prompt consolidado para texto` do arquivo [PROMPTS_BASE_STLAI.md](C:/Users/NDB/Documents/New%20project/infra/n8n/docs/PROMPTS_BASE_STLAI.md).

## Formato de callback de sucesso

```json
{
  "jobId": "uuid",
  "jobType": "text_generation",
  "provider": "openai",
  "result": {
    "titles": [
      "titulo 1",
      "titulo 2",
      "titulo 3"
    ],
    "description": "descricao do produto",
    "bullets": [
      "bullet 1",
      "bullet 2",
      "bullet 3"
    ],
    "seoKeywords": [
      "keyword 1",
      "keyword 2",
      "keyword 3"
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
  "jobType": "text_generation",
  "provider": "openai",
  "errorCode": "TEXT_GENERATION_FAILED",
  "errorMessage": "mensagem detalhada"
}
```

## Expressao util para prompt no n8n

```text
Nome: {{$json.productContext.productName}}
Categoria: {{$json.productContext.category}}
Contexto: {{$json.productContext.shortContext}}
Cor: {{$json.productContext.color}}
Material: {{$json.productContext.material}}
Dimensoes: {{$json.productContext.dimensionsXcm}} x {{$json.productContext.dimensionsYcm}} x {{$json.productContext.dimensionsZcm}} cm
Peso: {{$json.productContext.weightGrams}}
Voltagem: {{$json.productContext.voltage}}
Marketplaces: {{$json.productContext.targetMarketplaces}}
Idioma: {{$json.language}}
Imagens: {{$json.sourceImages}}
```

## Regra importante

O workflow deve sempre retornar JSON valido. Se o modelo responder texto solto, trate como erro e acione o callback de falha.
