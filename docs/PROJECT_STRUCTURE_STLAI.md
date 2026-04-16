# Estrutura do Projeto STLAI MVP

## Objetivo

Definir a organizacao fisica do repositorio para o time desenvolver com clareza, seguranca e menor risco de acoplamento ruim.

## Estrutura recomendada

```text
stlai-mvp/
  apps/
    web/
    api/
  infra/
    n8n/
  packages/
    shared/
  docs/
  .env.example
  .gitignore
  README.md
```

## Explicacao por area

## 1. `apps/web`

Contem o produto visivel para o usuario.

### Paginas principais

- upload
- contexto
- textos
- imagens
- resumo final

### Responsabilidade

Somente experiencia do usuario e consumo da API.

## 2. `apps/api`

Contem o backend oficial da plataforma.

### Responsabilidade

- regras de negocio
- autenticacao
- creditos
- jobs
- persistencia
- callbacks internos

### Este modulo governa

- o que pode ser gerado
- quando pode ser gerado
- quanto custa
- qual status o projeto possui

## 3. `infra/n8n`

Contem a camada de automacao.

### Responsabilidade

- executar fluxos
- integrar com IA
- tratar processamento tecnico

## 4. `packages/shared`

Contem contratos compartilhados.

### Exemplo

Se `project.status` existe no backend, o mesmo enum deve vir daqui para evitar strings diferentes no frontend.

## Estrutura detalhada sugerida

## `apps/web`

```text
apps/web/
  src/
    app/
      login/
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
      forms/
      upload/
      cards/
      generation/
    lib/
      api/
      auth/
      utils/
      validations/
    hooks/
    styles/
    types/
```

## `apps/api`

```text
apps/api/
  src/
    app/
    config/
    modules/
      auth/
      users/
      projects/
      uploads/
      product-context/
      generations/
      text-results/
      image-results/
      credits/
      webhooks/
    lib/
      db/
      storage/
      providers/
        openai/
        gemini/
        nano-banana/
      n8n/
    middlewares/
    utils/
```

## `infra/n8n`

```text
infra/n8n/
  workflows/
    wf_text_generation.json
    wf_image_generation.json
    wf_image_regeneration.json
  docs/
  assets/
```

## `packages/shared`

```text
packages/shared/
  src/
    contracts/
    schemas/
    types/
    constants/
```

## Seguranca para GitHub e variaveis

## Nunca subir

- `.env`
- `.env.local`
- chaves de API reais
- tokens internos
- dumps de banco
- exports do n8n com segredos embutidos

## Subir apenas

- `.env.example`
- docs
- codigo
- schemas

## Recomendacao de ambiente

### Local

- `.env.local` em `apps/web`
- `.env` ou `.env.local` em `apps/api`
- `.env` proprio para `n8n` se necessario

### Producao

Usar secrets do provedor de deploy e nunca arquivo commitado.

## Recomendacao extra de seguranca

### 1. Separar tokens internos

- token do frontend para API
- token interno API -> n8n
- token callback n8n -> API

### 2. URLs assinadas para upload

O frontend nao deve possuir credenciais do storage.

### 3. Validacao de MIME e tamanho

Fazer no frontend e novamente no backend.

### 4. Sanitizacao de logs

Nao logar:

- API keys
- prompts com segredo
- tokens
- dados sensiveis do usuario

## Ordem de implementacao recomendada

1. criar monorepo com essas pastas
2. scaffold do `apps/web`
3. scaffold do `apps/api`
4. criar `packages/shared`
5. integrar banco
6. integrar storage
7. integrar `n8n`
