# Variaveis de ambiente para os workflows n8n STLAI

## Texto

- `OPENAI_API_KEY`
- `OPENAI_TEXT_MODEL`

Sugestao:

```env
OPENAI_TEXT_MODEL=gpt-4.1-mini
```

## Imagem

- `IMAGE_PROVIDER_URL`
- `IMAGE_PROVIDER_API_KEY`
- `IMAGE_PROVIDER_MODEL`

Exemplo generico:

```env
IMAGE_PROVIDER_URL=https://sua-api-de-imagem.com/v1/generate
IMAGE_PROVIDER_MODEL=nano-banana-2
```

## Importante

Os workflows nao carregam credenciais fixas. Configure tudo no ambiente do `n8n` antes de ativar.
