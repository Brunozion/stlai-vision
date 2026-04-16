# Prompts Base STLAI para n8n

## Objetivo

Padronizar os prompts de texto e imagem do MVP com base na estrategia enviada, deixando tudo preparado para uso dentro dos workflows do `n8n`.

## Variaveis esperadas

Use estas variaveis ao montar os prompts nos nodes:

- `{{productName}}`
- `{{category}}`
- `{{shortContext}}`
- `{{dimensionsXcm}}`
- `{{dimensionsYcm}}`
- `{{dimensionsZcm}}`
- `{{weightGrams}}`
- `{{voltage}}`
- `{{color}}`
- `{{material}}`
- `{{targetMarketplaces}}`
- `{{sourceImages}}`
- `{{language}}`

## 1. Prompt base de capa

```text
Crie uma imagem profissional do produto "{{productName}}" sobre fundo branco neutro, bem iluminada, com o item ocupando aproximadamente 70% da area da foto, foco total no produto, sem texto, sem logo e sem marca d'agua.

Detalhes do produto:
- Categoria: {{category}}
- Contexto: {{shortContext}}
- Cor: {{color}}
- Material: {{material}}
- Dimensoes aproximadas: {{dimensionsXcm}} cm x {{dimensionsYcm}} cm x {{dimensionsZcm}} cm

Use as imagens de referencia enviadas pelo usuario para preservar formato, identidade visual, proporcoes e principais detalhes do produto.

Requisitos obrigatorios:
- fundo claro e limpo
- alta resolucao
- produto nitido e central
- sem elementos distrativos
- aparencia profissional para marketplaces
```

## 2. Prompt base de lifestyle

```text
Gere uma foto lifestyle do produto "{{productName}}" em uso no ambiente mais apropriado para sua categoria, com iluminacao natural e cenario limpo.

Detalhes do produto:
- Categoria: {{category}}
- Contexto: {{shortContext}}
- Cor: {{color}}
- Material: {{material}}
- Dimensoes aproximadas: {{dimensionsXcm}} cm x {{dimensionsYcm}} cm x {{dimensionsZcm}} cm

Use as imagens de referencia enviadas pelo usuario para preservar formato, identidade visual, proporcoes e principais detalhes do produto.

Objetivo da imagem:
- mostrar o produto em contexto real
- destacar sua funcionalidade no dia a dia
- inspirar o comprador com aplicacao pratica

Requisitos obrigatorios:
- nao adicionar textos, logos ou marcas d'agua
- nao distorcer o produto
- nao inserir elementos confusos ou exagerados
- manter foco visual no produto
```

## 3. Prompt base de imagem com medidas

```text
Crie uma imagem do produto "{{productName}}" em fundo claro com indicacao visual de dimensoes.

Detalhes do produto:
- Largura: {{dimensionsXcm}} cm
- Altura: {{dimensionsYcm}} cm
- Profundidade: {{dimensionsZcm}} cm
- Cor: {{color}}
- Material: {{material}}

Use as imagens de referencia enviadas pelo usuario para preservar formato, identidade visual, proporcoes e principais detalhes do produto.

Requisitos obrigatorios:
- incluir linhas de dimensao, setas ou marcacoes visuais claras
- incluir os valores numericos visiveis
- manter escala realista
- alta nitidez
- sem texto promocional
- sem logos ou marcas d'agua
```

## 4. Prompt base de titulos

```text
Voce e um vendedor experiente em marketplaces brasileiros. Crie 3 titulos diferentes para anunciar este produto em {{language}}.

Dados do produto:
- Nome: {{productName}}
- Categoria: {{category}}
- Contexto: {{shortContext}}
- Cor: {{color}}
- Material: {{material}}
- Dimensoes: {{dimensionsXcm}} cm x {{dimensionsYcm}} cm x {{dimensionsZcm}} cm
- Peso: {{weightGrams}} g
- Voltagem: {{voltage}}
- Marketplaces alvo: {{targetMarketplaces}}

Use as imagens de referencia enviadas pelo usuario para identificar corretamente o produto e seus atributos visuais.

Crie os titulos usando estas estrategias:

1. SEO
- siga a logica: Marca + Modelo + Categoria do produto, quando fizer sentido
- inclua palavras-chave principais e caracteristicas essenciais

2. Informativa
- use atributos tecnicos, material, cor, tamanho ou aplicacao
- foque em termos de busca especificos

3. Criativa
- destaque um beneficio, uso ou diferencial do produto
- deixe o titulo atraente e persuasivo

Regras:
- nao invente marca se ela nao estiver clara
- nao use emoji
- nao use claims enganosos
- retorne somente JSON valido

Formato de saida:
{
  "titles": [
    "titulo 1",
    "titulo 2",
    "titulo 3"
  ]
}
```

## 5. Prompt base de descricao

```text
Escreva uma descricao de produto em lingua portuguesa, clara, natural, objetiva e persuasiva para marketplace.

Dados do produto:
- Nome: {{productName}}
- Categoria: {{category}}
- Contexto: {{shortContext}}
- Cor: {{color}}
- Material: {{material}}
- Dimensoes: {{dimensionsXcm}} cm x {{dimensionsYcm}} cm x {{dimensionsZcm}} cm
- Peso: {{weightGrams}} g
- Voltagem: {{voltage}}
- Marketplaces alvo: {{targetMarketplaces}}

Use as imagens de referencia enviadas pelo usuario para complementar a leitura visual do produto.

A descricao deve incluir:
- caracteristicas tecnicas
- beneficios e utilidades
- diferenciais do produto
- linguagem escaneavel
- palavras-chave principais de forma natural

Regras:
- nao seja longo
- nao use emoji
- nao use linguagem exagerada ou promessas irreais
- escreva em tom profissional e confiavel
- retorne somente JSON valido

Formato de saida:
{
  "description": "descricao curta e completa",
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
```

## 6. Prompt consolidado para texto

```text
Voce e um especialista em criacao de anuncios para Shopee e Mercado Livre.

Sua tarefa e gerar 3 titulos e 1 descricao de produto com foco em conversao e busca organica.

Dados do produto:
- Nome: {{productName}}
- Categoria: {{category}}
- Contexto: {{shortContext}}
- Cor: {{color}}
- Material: {{material}}
- Dimensoes: {{dimensionsXcm}} cm x {{dimensionsYcm}} cm x {{dimensionsZcm}} cm
- Peso: {{weightGrams}} g
- Voltagem: {{voltage}}
- Marketplaces alvo: {{targetMarketplaces}}
- Idioma: {{language}}

Considere tambem as imagens de referencia enviadas pelo usuario para entender o produto corretamente.

Gere:
- 3 titulos, cada um com uma estrategia diferente: SEO, informativa e criativa
- 1 descricao curta, completa, natural e persuasiva
- 3 bullets
- 3 palavras-chave SEO

Regras:
- nao invente atributos nao sustentados pelas imagens ou contexto
- nao use emoji
- nao seja prolixo
- retorne somente JSON valido

Formato:
{
  "titles": [
    "titulo seo",
    "titulo informativo",
    "titulo criativo"
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
```

## 7. Prompt consolidado para imagens do pacote MVP

```text
Use as imagens de referencia enviadas pelo usuario para recriar fielmente o produto "{{productName}}" e gerar variacoes profissionais para marketplace.

Dados do produto:
- Categoria: {{category}}
- Contexto: {{shortContext}}
- Cor: {{color}}
- Material: {{material}}
- Dimensoes: {{dimensionsXcm}} cm x {{dimensionsYcm}} cm x {{dimensionsZcm}} cm

Gere as seguintes variacoes:
1. Uma imagem de capa com fundo branco neutro
2. Uma imagem com indicacao de medidas visuais
3. Uma ou mais imagens lifestyle mostrando uso real do produto

Regras obrigatorias:
- preservar o formato e os detalhes do produto original
- sem texto promocional
- sem logo
- sem marca d'agua
- composicao profissional
- alta resolucao
- foco total no produto
```
