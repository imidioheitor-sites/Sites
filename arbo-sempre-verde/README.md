# Arbo Sempre Verde — Soluções Ambientais

Site institucional e de captação para a **Arbo Sempre Verde Soluções Ambientais Ltda**
(CNPJ 44.722.998/0001-03), especializada em manejo de árvores urbanas e rurais em Goiás.

## Como publicar

O site é estático. Basta enviar **todo o conteúdo desta pasta** para qualquer
hospedagem (Hostinger, Vercel, Netlify, GitHub Pages, cPanel…). O arquivo de
entrada é `index.html`.

Para ver localmente, abra `index.html` no navegador — ou, melhor, rode:

```bash
python3 -m http.server 8000
```

e acesse http://localhost:8000

## Onde editar os dados de contato

Tudo está num único bloco no topo do `index.html` (linha ~18), marcado com
`window.ARBO`. Ali ficam telefone, WhatsApp, e-mail, Instagram, cidade e os
dados da turma do curso. Todos os botões e links do site leem desse bloco.

```js
window.ARBO = {
  telefone: "(62) 99606-0737",
  whatsapp: "5562996060737",     // só dígitos, com 55 + DDD
  ...
  curso: { nome, datas, local, vagas, aberto }
};
```

Quando a turma de outubro/2026 encerrar, troque `curso.datas`, `curso.local` e o
texto do bloco "KOPA ARBO Training" na seção `#cursos`.

## Estrutura

```
index.html              página única, sem dependências externas
assets/
  three.min.js          Three.js r160 (local — o site não chama nenhuma CDN)
  roboto-flex.woff2     fonte variável (usada pelo efeito TextPressure)
  img/                  fotos reais da empresa + logo
  video/
    hero.mp4 / .webm        vídeo do topo — 1080p, 15s, loop contínuo, sem áudio
    hero-720.mp4 / .webm    versão leve, servida a celulares e conexões lentas
    hero-poster.jpg         primeiro quadro (aparece antes do vídeo carregar)
    tile-*.mp4 / .webm      clipes da montagem em perspectiva
```

## Conteúdo — origem

Todo o material é real, vindo da pasta do Google Drive da empresa:

- **Vídeo do topo**: montagem de 4 filmagens de serviço (escalada em palmeira,
  corte com motosserra em altura, remoção com guindaste e descida em rapel),
  tratadas em 1080p com correção de cor e loop sem emenda. Sem texto e sem áudio.
- **Fotos**: 17 registros de obra, otimizados em duas resoluções (full e `-sm`).
- **Logo**: extraído do material de divulgação da própria empresa.
- **Credenciais**: certificado ISA (Darlan Camilo Silva, BR-0038A), Curso Avançado
  de Arborista (24h) e Resgate em Altura ARBOLAB (16h), além do 3º lugar no
  XII Campeonato Brasileiro de Escalada em Árvores (2023).
- **Curso**: cartaz oficial do KOPA ARBO Training, 08 a 11 de outubro de 2026.

Não há imagens de banco nem textos de preenchimento.

## Efeitos implementados

| Efeito | Onde |
|---|---|
| Hero escrolável com vídeo | `#hero` — 340vh, vídeo real + dossel 3D em WebGL |
| TextPressure | título "Sempre Verde" reage ao cursor |
| Montagem em perspectiva | `#perspectiva` — corredor 3D de fotos e vídeos reais |
| Portal escrolável | `#portal` — abertura circular para dentro do dossel |
| Object Reveal on Hover | `#revelacao` — modelo 3D por serviço segue o cursor |
| 3D Product Animation | `#especime` — árvore interativa (arraste / scroll) |
| Cursor de fluido (WebGL) | página inteira, desktop |
| Bento com spotlight | `#servicos` |
| Antes / Depois | `#antesdepois` — arraste a barra |
| CardSwap | `#atendemos` |
| Galeria + lightbox | `#galeria` |

## Desempenho e acessibilidade

- Celulares recebem o vídeo em 720p e uma versão mais leve dos efeitos 3D.
- O vídeo pausa automaticamente quando sai da tela.
- Os clipes da montagem só são decodificados quando estão visíveis.
- `prefers-reduced-motion` desliga as animações para quem pediu menos movimento.
- Sem chamadas a CDNs: o site funciona offline e não vaza dados para terceiros.

## Formulários

Os dois formulários (orçamento e lista de espera do curso) **não enviam nada para
servidor nenhum** — eles montam a mensagem e abrem o WhatsApp já preenchido.
Nada é armazenado no site.
