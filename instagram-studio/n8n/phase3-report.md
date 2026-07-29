# n8n — Fase 3: Relatório de performance por email

Semanalmente, puxa os Insights reais, analisa e envia o email com recomendações.

```
┌───────────────────────┐
│ 1. Schedule Trigger    │  ex.: toda segunda 08:00
└──────────┬────────────┘
           ▼
┌───────────────────────┐
│ 2. Execute Command     │  node run-report.js
│                        │   • fetchRecentInsights() na Graph API
│                        │   • mapeia mediaId → quadro pela store
│                        │   • analyzePosts(): flags, ranking, melhores horários,
│                        │     recomendações (direção, nunca conteúdo)
│                        │   • renderReportEmail() → HTML
│                        │   • envia pelo Gmail (REPORT_TO)
└──────────┬────────────┘
           │  { posts, sent }
           ▼
        (email na sua caixa)
```

O melhor horário observado no relatório realimenta `src/strategy.js` da Fase 2 —
o cronograma vai ficando mais afinado com os seus dados reais.

Teste sem enviar: `node run-report.js --dry-run` (escreve `out/report.html`).
