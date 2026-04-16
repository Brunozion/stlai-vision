# Exemplos de callback STLAI

## Callback de sucesso - texto

```bash
curl -X POST "http://localhost:4003/api/v1/internal/generation-callbacks/success" \
  -H "Content-Type: application/json" \
  -H "x-internal-token: SEU_TOKEN" \
  -d '{
    "jobId": "JOB_ID",
    "jobType": "text_generation",
    "provider": "openai",
    "result": {
      "titles": [
        "Titulo 1",
        "Titulo 2",
        "Titulo 3"
      ],
      "description": "Descricao do produto",
      "bullets": [
        "Bullet 1",
        "Bullet 2",
        "Bullet 3"
      ],
      "seoKeywords": [
        "keyword 1",
        "keyword 2",
        "keyword 3"
      ]
    }
  }'
```

## Callback de sucesso - imagem

```bash
curl -X POST "http://localhost:4003/api/v1/internal/generation-callbacks/success" \
  -H "Content-Type: application/json" \
  -H "x-internal-token: SEU_TOKEN" \
  -d '{
    "jobId": "JOB_ID",
    "jobType": "image_generation",
    "provider": "nano-banana-2",
    "result": {
      "images": [
        {
          "imageKind": "white_background",
          "title": "Catalogo",
          "fileUrl": "https://cdn.exemplo.com/catalogo.jpg",
          "storageKey": "projects/uuid/results/catalogo.jpg",
          "width": 1000,
          "height": 1000,
          "variationIndex": 1
        }
      ]
    }
  }'
```

## Callback de falha

```bash
curl -X POST "http://localhost:4003/api/v1/internal/generation-callbacks/failure" \
  -H "Content-Type: application/json" \
  -H "x-internal-token: SEU_TOKEN" \
  -d '{
    "jobId": "JOB_ID",
    "jobType": "image_generation",
    "provider": "nano-banana-2",
    "errorCode": "IMAGE_GENERATION_FAILED",
    "errorMessage": "Detalhe do erro"
  }'
```
