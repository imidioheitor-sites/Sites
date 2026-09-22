# n8n — Fase 4: Recomendações & trends

Semanalmente, sugere o que gravar com base nos seus dados + modelos comprovados +
trends de notícia (RSS público — sem raspar o Instagram). Tudo é direção.

```
┌───────────────────────┐
│ 1. Schedule Trigger    │  ex.: todo domingo 18:00
└──────────┬────────────┘
           ▼
┌───────────────────────┐
│ 2. Execute Command     │  node run-recommend.js
│                        │   • fetchNews() — trends de tech/empreendedorismo (RSS)
│                        │   • analyzePosts() — seus dados de performance
│                        │   • weeklyRecommendations():
│                        │       foco (quadro a priorizar / gancho a corrigir)
│                        │       1 ideia por quadro (modelo + ângulo)
│                        │       temas de notícia para comentar
└──────────┬────────────┘
           ▼
┌───────────────────────┐
│ 3. Gmail / Telegram    │  te manda a lista da semana
└───────────────────────┘
```

## Postagem oficial (opção à Metricool)

`src/adapters/publisher.js` traz `GraphPublisher`: postagem direta pela
Instagram Graph API (container + publish), para feed, Reels e Stories. Exige
`instagram_content_publish` e mídias em URL pública. É o caminho da autonomia
total quando você quiser sair do MVP com Metricool.
