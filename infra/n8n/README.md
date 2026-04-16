# infra/n8n

Camada de automacao dos workflows de geracao.

## Responsabilidades

- receber payload do backend
- montar execucao operacional
- chamar providers
- tratar retry tecnico
- devolver callback para a API

## Nao deve controlar

- saldo de creditos
- autenticacao do usuario
- estado oficial do projeto
- regras principais de produto

## Estrutura sugerida

```text
workflows/
docs/
assets/
```

## Workflows iniciais

- `wf_text_generation`
- `wf_image_generation`
- `wf_image_regeneration`
