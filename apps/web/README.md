# apps/web

Frontend principal do MVP.

## Responsabilidades

- upload de imagens
- formulario de contexto do produto
- acompanhamento de status
- revisao de textos
- visualizacao de imagens geradas
- resumo final

## Sugestao de stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod
- TanStack Query

## Estrutura sugerida

```text
src/
  app/
    (dashboard)/
    projects/
      new/
      [projectId]/
        upload/
        context/
        text/
        images/
        summary/
  components/
    ui/
    upload/
    project/
    generation/
  lib/
    api/
    utils/
    validations/
  hooks/
  types/
```
