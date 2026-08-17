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
  fraunces.woff2        serifa variável — títulos e o efeito TextPressure
  archivo.woff2         grotesca variável — corpo e interface
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

## Paleta

As cores saem da própria marca, não de um tema genérico:

| Onde vem | Cor | Uso no site |
|---|---|---|
| — | `#FFFFFF` branco | fundo da página |
| Verde do emblema, escurecido | `#0A1F19` | marquise, portal, fita, cursos e rodapé |
| Verde do emblema | `#1E5A41` | botões, ações e ícones |
| Dourado do cartaz | `#C9A227` | medalhas, números e destaques sobre o verde |
| Laranja do emblema | `#DC6B24` | etiquetas e marcações |
| Verde levíssimo | `#F1F6F1` | faixas alternativas |

A base é branca. O verde escuro entra em blocos inteiros — marquise, fita, portal,
cursos e rodapé — que funcionam como âncoras: o branco vira o respiro entre eles,
não a página toda. O dourado só aparece sobre o verde, onde tem contraste para brilhar.

## Tipografia

**Fraunces** nos títulos e **Archivo** no corpo, ambas variáveis e servidas localmente.

A Fraunces tem dois eixos fora do comum além do peso: `SOFT`, que arredonda as
serifas, e `WONK`, que inclina algumas delas de propósito. É o que dá o caráter
orgânico — e é justamente o que o título do topo aciona conforme o cursor se
aproxima de cada letra, junto com `opsz`.

## Efeitos implementados

Nenhum efeito 3D. Não há Three.js, WebGL de geometria, `perspective`,
`translate3d` nem `preserve-3d` em lugar nenhum do arquivo.

| Efeito | Onde | Como funciona |
|---|---|---|
| Topo escrolável com vídeo | `#hero` | vídeo real em loop, texto e brilho respondem ao scroll |
| TextPressure | título "Sempre Verde" | peso e largura da fonte variam com a distância do cursor |
| Faixa de credibilidade | logo abaixo do topo | as três medalhas já na entrada |
| Fita horizontal | `#perspectiva` | rolar na vertical desliza a montagem de fotos e vídeos na horizontal |
| Portal escrolável | `#portal` | máscara circular 2D abrindo sobre uma foto real da copa |
| Object Reveal on Hover | `#revelacao` | a foto do serviço segue o cursor |
| Foto anotada | `#especime` | pontos numerados sobre a foto, com troca por categoria |
| Medalhas | `#credenciais` | pódio nacional em destaque + certificações |
| Bento com spotlight | `#servicos` | brilho segue o cursor; diagrama de poda animado em canvas 2D |
| Antes / Depois | `#antesdepois` | arraste a barra |
| Pilha de cartões | `#atendemos` | troca em 2D, com escala |
| Galeria + lightbox | `#galeria` | clique amplia |
| Cursor de fluido | página inteira, desktop | simulação 2D em WebGL, bem discreta — 15% de opacidade, dissipação rápida |

## Desempenho e acessibilidade

- Celulares recebem o vídeo em 720p.
- O vídeo pausa automaticamente quando sai da tela.
- Os clipes da montagem só são decodificados quando estão visíveis.
- `prefers-reduced-motion` desliga as animações para quem pediu menos movimento.
- Sem chamadas a CDNs: o site funciona offline e não vaza dados para terceiros.

## Formulários

Os dois formulários (orçamento e lista de espera do curso) **não enviam nada para
servidor nenhum** — eles montam a mensagem e abrem o WhatsApp já preenchido.
Nada é armazenado no site.
