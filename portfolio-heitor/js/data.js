/* Conteúdo bilíngue do portfólio (PT/EN). Edite aqui para trocar textos, fotos e números.
   Fatos conferidos em factory/portfolio/conquistas-heitor.md. Divergências abertas ficam de fora (ver README). */
window.SITE = (function () {
  const T = {
    /* navegação */
    'nav.hero': { pt: '01 · P&B', en: '01 · B&W' },
    'nav.ach': { pt: '02 · Conquistas', en: '02 · Achievements' },
    'nav.proj': { pt: '03 · Projetos', en: '03 · Projects' },
    'nav.tech': { pt: '04 · Tech', en: '04 · Tech' },
    'nav.contact': { pt: '05 · Contato', en: '05 · Contact' },
    'nav.swarm': { pt: 'Construir com cursores', en: 'Cursor build' },
    'nav.sound': { pt: 'Som', en: 'Sound' },
    /* portal de idioma */
    'gate.kicker': { pt: 'Portfólio · Heitor Imídio', en: 'Portfolio · Heitor Imídio' },
    'gate.title': { pt: 'Escolha o idioma', en: 'Choose your language' },
    'gate.sub': { pt: 'Select your language · Elige idioma', en: 'Selecione o idioma · Elige idioma' },
    'gate.pt': { pt: 'Português', en: 'Português' },
    'gate.en': { pt: 'English', en: 'English' },
    'gate.hint': { pt: 'Passe o mouse e clique · com som', en: 'Hover and click · sound on' },
    /* hero */
    'hero.tag': { pt: 'Seção 01 · Planta técnica em preto e branco', en: 'Section 01 · Technical blueprint in black & white' },
    'hero.name1': { pt: 'HEITOR', en: 'HEITOR' },
    'hero.name2': { pt: 'IMÍDIO', en: 'IMÍDIO' },
    'hero.role': { pt: 'Engenheiro em formação · 19 anos · Goiânia → Notre Dame', en: 'Engineer in the making · age 19 · Goiânia → Notre Dame' },
    'hero.lead': {
      pt: 'Calouro de <b>Engenharia Mecânica</b> na University of Notre Dame (Class of 2030). Capitão do primeiro time brasileiro de ensino médio convidado ao <b>CERN</b>, ex-estagiário de IA no <b>iFood</b>, prata na <b>Copa do Mundo de Física</b> e cofundador da <b>Projetei</b>.',
      en: 'Freshman in <b>Mechanical Engineering</b> at the University of Notre Dame (Class of 2030). Captain of the first Brazilian high-school team invited to <b>CERN</b>, former AI intern at <b>iFood</b>, silver medalist at the <b>Physics World Cup</b> and co-founder of <b>Projetei</b>.'
    },
    'hero.scroll': { pt: 'Role para baixo', en: 'Scroll down' },
    'hero.chips': { pt: ['Aeroespacial', 'Física de partículas', 'IA em produção', 'Impacto social', 'Debate & xadrez'], en: ['Aerospace', 'Particle physics', 'Production AI', 'Social impact', 'Debate & chess'] },
    'hero.s2.k': { pt: 'repare nos detalhes', en: 'notice the details' },
    'hero.s2.k2': { pt: 'desfoque o que não importa', en: 'blur out the unimportant' },
    'hero.s2.t': { pt: 'Do experimento ao foguete.', en: 'From experiment to rocket.' },
    'hero.s2.p': {
      pt: 'Saí de Goiânia para Genebra, Panamá, Cambridge e South Bend com uma ideia fixa: transformar curiosidade em coisas que funcionam, de câmaras de nuvem a agentes de IA e brinquedos impressos em 3D.',
      en: 'I left Goiânia for Geneva, Panama, Cambridge and South Bend with one fixed idea: turn curiosity into things that work, from cloud chambers to AI agents and 3D-printed toys.'
    },
    'hero.s3.a': { pt: 'Física de partículas', en: 'Particle physics' },
    'hero.s3.b': { pt: 'IA que roda em produção', en: 'AI running in production' },
    'hero.s3.c': { pt: 'Próximo: ignição', en: 'Next: ignition' },
    'hero.s3.ap': { pt: 'Nove raios cósmicos detectados com uma câmara de nuvem de nitrogênio líquido.', en: 'Nine cosmic rays detected with a liquid-nitrogen cloud chamber.' },
    'hero.s3.bp': { pt: 'Um agente de IA usado no Brasil inteiro, criado durante o estágio no iFood.', en: 'An AI agent used across Brazil, built during the iFood internship.' },
    'hero.s3.cp': { pt: 'Continue rolando: o preto e branco vai acender, elemento por elemento.', en: 'Keep scrolling: the black & white is about to ignite, element by element.' },
    'fig.1': { pt: 'FIG. 01 // Astronauta · tinta nanquim', en: 'FIG. 01 // Astronaut · India ink' },
    'fig.1b': { pt: 'Modelo 3D: NASA (via Google model-viewer) · arraste para girar', en: '3D model: NASA (via Google model-viewer) · drag to rotate' },
    /* contadores */
    'stat.1': { pt: 'melhores físicos do mundo (prata na IYPT)', en: 'of the world in physics (IYPT silver)' },
    'stat.2': { pt: 'de aprovação no Prep da Estudar', en: 'acceptance rate, Estudar Prep' },
    'stat.3': { pt: 'pessoas na Projetei', en: 'people at Projetei' },
    'stat.4': { pt: 'brinquedos impressos em 3D', en: '3D-printed toys' },
    /* seção 2 */
    'ach.kicker': { pt: 'Seção 02 · Ignição cromática + som', en: 'Section 02 · Chromatic ignition + sound' },
    'ach.title': { pt: 'Conquistas, currículo e <em>por que</em> fiz cada coisa', en: 'Achievements, résumé and <em>why</em> I did each thing' },
    'ach.sub': { pt: 'Arraste os cartões. Cada um tem o que eu fiz e a motivação por trás.', en: 'Drag the cards. Each one has what I did and the motivation behind it.' },
    'ach.replay': { pt: 'Reacender cores + som', en: 'Re-ignite color + sound' },
    'ach.did': { pt: 'O que fiz', en: 'What I did' },
    'ach.why': { pt: 'Por que fiz', en: 'Why I did it' },
    'ach.all': { pt: 'Tudo', en: 'All' },
    'ach.drag': { pt: 'arraste · setas · teclado', en: 'drag · arrows · keyboard' },
    /* seção 3 */
    'proj.kicker': { pt: 'Seção 03 · Física, 3D e primeiro múon', en: 'Section 03 · Physics, 3D & the first muon' },
    'proj.title': { pt: 'Meus <em>projetos</em>, do laboratório ao 3D', en: 'My <em>projects</em>, from lab bench to 3D' },
    'proj.sub': { pt: 'Um exemplo de cada coisa que construí: experimentos, modelos, impressões e produto.', en: 'One example of each thing I built: experiments, models, prints and product.' },
    'muon.k': { pt: 'CERN BL4S · câmara de nuvem', en: 'CERN BL4S · cloud chamber' },
    'muon.t': { pt: 'O momento em que detectei meu primeiro múon', en: 'The moment I detected my first muon' },
    'muon.p': {
      pt: 'Câmara de nuvem feita por nós, com nitrogênio líquido (−196 °C), luz UV e álcool isopropílico supersaturado. O risco branco é a trilha de condensação de uma partícula vinda do espaço.',
      en: 'A cloud chamber we built ourselves, with liquid nitrogen (−196 °C), UV light and supersaturated isopropyl alcohol. The white streak is the condensation track of a particle from space.'
    },
    'muon.s1': { pt: 'experimentos de física de partículas', en: 'particle-physics experiments' },
    'muon.s2': { pt: 'raios cósmicos catalogados (1º do estado)', en: 'cosmic rays catalogued (1st in state)' },
    'muon.s3': { pt: 'bolsa do CERN BL4S', en: 'CERN BL4S grant' },
    'muon.btn': { pt: 'Provocar uma partícula', en: 'Trigger a particle' },
    'muon.live': { pt: 'Simulação ao vivo da câmara', en: 'Live chamber simulation' },
    'muon.cap': { pt: 'Quadro real do vídeo do 1º múon (03:44)', en: 'Real frame of the 1st muon video (03:44)' },
    'ink.k': { pt: 'Modelos 3D · ink viewer', en: '3D models · ink viewer' },
    'ink.t': { pt: 'Modelos em tinta nanquim', en: 'Models in India ink' },
    'ink.p': { pt: 'Arraste para girar, role para aproximar. Troque o modelo abaixo.', en: 'Drag to rotate, scroll to zoom. Switch the model below.' },
    'ink.m1': { pt: 'Astronauta', en: 'Astronaut' },
    'ink.m2': { pt: 'Caça', en: 'Fighter' },
    'ink.m3': { pt: 'Foguete', en: 'Rocket' },
    'ink.s1': { pt: 'Tinta', en: 'Ink' },
    'ink.s2': { pt: 'Cor', en: 'Color' },
    'ink.s3': { pt: 'Malha', en: 'Wire' },
    /* seção 4 */
    'tech.kicker': { pt: 'Seção 04 · O site inteiro muda a cada projeto', en: 'Section 04 · The whole site changes with each project' },
    'tech.next': { pt: 'Próximo projeto', en: 'Next project' },
    'tech.see': { pt: 'Ver mais', en: 'See more' },
    'tech.hint': { pt: 'role para trocar de projeto', en: 'scroll to switch project' },
    /* contato */
    'ct.kicker': { pt: 'Seção 05 · Transmissão direta', en: 'Section 05 · Direct transmission' },
    'ct.title': { pt: 'Vamos <em>conversar</em>', en: 'Let’s <em>talk</em>' },
    'ct.sub': { pt: 'Aberto a pesquisa de graduação em Aeroespacial e Engenharia Mecânica em Notre Dame, estágios de verão 2027 e parcerias para a Projetei e a HEsites.', en: 'Open to undergraduate research in Aerospace & Mechanical Engineering at Notre Dame, Summer 2027 internships, and partnerships for Projetei and HEsites.' },
    'ct.email': { pt: 'E-mail acadêmico', en: 'Academic e-mail' },
    'ct.copy': { pt: 'Clique para copiar', en: 'Click to copy' },
    'ct.copied': { pt: 'Copiado!', en: 'Copied!' },
    'ct.li': { pt: 'LinkedIn', en: 'LinkedIn' },
    'ct.hes': { pt: 'Fábrica de sites com IA', en: 'AI website factory' },
    'ct.form': { pt: 'Enviar mensagem', en: 'Send a message' },
    'ct.topic': { pt: 'Assunto', en: 'Topic' },
    'ct.name': { pt: 'Seu nome / organização', en: 'Your name / organization' },
    'ct.msg': { pt: 'Mensagem', en: 'Message' },
    'ct.send': { pt: 'Abrir no meu e-mail', en: 'Open in my e-mail' },
    'ct.t1': { pt: 'Pesquisa / laboratório em Notre Dame', en: 'Research / lab at Notre Dame' },
    'ct.t2': { pt: 'Estágio ou oportunidade', en: 'Internship or opportunity' },
    'ct.t3': { pt: 'Projetei / impacto social', en: 'Projetei / social impact' },
    'ct.t4': { pt: 'Site para o meu negócio (HEsites)', en: 'A website for my business (HEsites)' },
    'ct.t5': { pt: 'Só dizer oi', en: 'Just saying hi' },
    'ct.ph.msg': { pt: 'Olá Heitor! Vi seu portfólio e gostaria de conversar.', en: 'Hi Heitor! I saw your portfolio and would like to talk.' },
    'ct.where': { pt: 'South Bend, IN (EUA) · Goiânia, GO (Brasil)', en: 'South Bend, IN (USA) · Goiânia, GO (Brazil)' },
    'ct.foot': { pt: '© 2026 Heitor Imídio de Oliveira Silva · feito com cursores, tinta e física', en: '© 2026 Heitor Imídio de Oliveira Silva · built with cursors, ink and physics' }
  };

  /* Conquistas (seção 2) */
  const ACH = [
    {
      id: 'nd', cat: 'edu', tag: { pt: 'Notre Dame · EUA', en: 'Notre Dame · USA' }, yr: '2026–2030',
      imgs: ['nd-1', 'nd-2', 'nd-3'],
      title: { pt: 'Engenharia Mecânica na University of Notre Dame', en: 'Mechanical Engineering at the University of Notre Dame' },
      meta: { pt: 'Class of 2030 · bolsista TLP · visto F-1 com ajuda financeira significativa', en: 'Class of 2030 · TLP scholar · F-1 visa with significant financial aid' },
      did: { pt: 'Entrei como calouro em Engenharia Mecânica (pretendida). Já me envolvi com IrishSAT, Baja SAE, UAV, Enable ND, SIBC, BRASA ND, Building Bridges e powerlifting, e conversei com cerca de 12 professores de Aeroespacial e Mecânica sobre pesquisa de graduação.', en: 'Joined as a freshman in (intended) Mechanical Engineering. Already active in IrishSAT, Baja SAE, UAV, Enable ND, SIBC, BRASA ND, Building Bridges and powerlifting, and reached out to ~12 Aerospace & Mechanical Engineering faculty about undergraduate research.' },
      why: { pt: 'Quero construir máquinas que voam. Notre Dame une engenharia forte a uma comunidade que se importa, e um lugar onde dá para pesquisar cedo.', en: 'I want to build machines that fly. Notre Dame pairs strong engineering with a community that cares, and a place where you can do research early.' }
    },
    {
      id: 'cern', cat: 'sci', tag: { pt: 'CERN · Genebra, Suíça', en: 'CERN · Geneva, Switzerland' }, yr: '2024–2025',
      imgs: ['cern-2', 'cern-1', 'cern-5', 'cern-3'],
      title: { pt: 'Capitão · CERN Beam Line for Students (BL4S)', en: 'Team Captain · CERN Beam Line for Students (BL4S)' },
      meta: { pt: '1º time brasileiro de ensino médio convidado · bolsa de ~US$ 12 mil', en: '1st Brazilian high-school team invited · ~US$ 12K grant' },
      did: { pt: 'Liderei um time de 5, projetei uma câmara de nuvem com nitrogênio líquido e luz UV, rodei mais de 20 experimentos e detectei 9 raios cósmicos (1º lugar no estado).', en: 'Led a team of 5, designed a cloud chamber using liquid nitrogen and UV light, ran 20+ experiments and detected 9 cosmic rays (1st place in the state).' },
      why: { pt: 'Queria ver a física de partículas com os próprios olhos, não só no livro. Provar que um time de escola pública e privada de Goiânia chega ao CERN.', en: 'I wanted to see particle physics with my own eyes, not just in a textbook, and prove a team from Goiânia can make it to CERN.' }
    },
    {
      id: 'ifood', cat: 'tech', tag: { pt: 'iFood · São Paulo', en: 'iFood · São Paulo' }, yr: '05–09/2026',
      imgs: ['ifood-logo'], logo: true,
      title: { pt: 'Estagiário de Engenharia de IA no iFood', en: 'AI Engineering Intern at iFood' },
      meta: { pt: 'Agente de IA em produção em todo o Brasil', en: 'AI agent in production across Brazil' },
      did: { pt: 'Criei e coloquei em produção um agente de IA usado em todo o Brasil, apoiando operações de uma das maiores empresas de tecnologia do país.', en: 'Built and deployed an AI agent used across Brazil, supporting the operations of one of the country’s largest technology companies.' },
      why: { pt: 'Para aprender o que separa uma demo de um produto: escala, confiabilidade e gente de verdade usando.', en: 'To learn what separates a demo from a product: scale, reliability and real people using it.' }
    },
    {
      id: 'iypt', cat: 'sci', tag: { pt: 'IYPT · Copa do Mundo de Física', en: 'IYPT · Physics World Cup' }, yr: '2024–2026',
      imgs: ['iypt-1', 'iypt-2', 'iypt-4', 'iypt-5'],
      title: { pt: 'Prata na Copa do Mundo de Física (top 0,6%)', en: 'Silver Medal at the Physics World Cup (top 0.6%)' },
      meta: { pt: 'Capitão do Brasil · 6º melhor estudante de física do país', en: 'Captain of Brazil · 6th best physics student in the country' },
      did: { pt: 'Capitaneei a seleção de 5 pessoas, desenvolvi mais de 5 experimentos (mecânica, aerodinâmica, eletromagnetismo), escrevi seis artigos de cerca de 14 páginas e defendi os resultados em debate formal.', en: 'Captained the 5-person national team, developed 5+ experiments (mechanics, aerodynamics, electromagnetism), wrote six ~14-page papers and defended the results in formal debate.' },
      why: { pt: 'Física de competição ensina a explicar o que você mediu, em inglês, contra os melhores do mundo.', en: 'Competition physics teaches you to explain what you measured, in English, against the best in the world.' }
    },
    {
      id: 'projetei', cat: 'soc', tag: { pt: 'Projetei · impressão 3D', en: 'Projetei · 3D printing' }, yr: '2025–2026',
      imgs: ['projetei-1', 'projetei-4', 'projetei-6', 'projetei-5'],
      title: { pt: 'Cofundador e presidente da Projetei', en: 'Co-founder & President of Projetei' },
      meta: { pt: '110 pessoas · 1.500 brinquedos de 2.000 inscrições', en: '110 people · 1,500 toys from 2,000 applications' },
      did: { pt: 'Coordenei 110 pessoas em todas as etapas de produção e entrega de brinquedos e projetos de engenharia impressos em 3D para crianças. Recebemos Honra ao Mérito na Câmara Municipal de Goiânia.', en: 'Managed 110 people across production and delivery of 3D-printed toys and engineering projects for children. We received an Honor of Merit at Goiânia’s City Council.' },
      why: { pt: 'Engenharia só importa se chega em quem precisa. Uma criança com um brinquedo feito para ela vale mais que qualquer slide.', en: 'Engineering only matters if it reaches the people who need it. A child with a toy made for them beats any slide.' }
    },
    {
      id: 'gala', cat: 'soc', tag: { pt: 'Fundação Estudar · São Paulo', en: 'Fundação Estudar · São Paulo' }, yr: '05/2026',
      imgs: ['gala-1', 'gala-3', 'gala-4', 'gala-5'],
      title: { pt: 'Co-apresentador da gala de 15 anos do Prep', en: 'Co-host of the Prep 15th-anniversary gala' },
      meta: { pt: '300+ convidados · ~R$ 2 milhões arrecadados', en: '300+ guests · ~R$ 2 million raised' },
      did: { pt: 'Apresentei a noite para mais de 300 convidados (alumni, mentores e filantropos) e ajudei a arrecadar cerca de R$ 2 milhões para a Fundação Estudar. Fui aprovado no Prep 2025 numa seleção de 0,7%.', en: 'Hosted the evening for 300+ guests (alumni, mentors and philanthropists) and helped raise about R$ 2 million for Fundação Estudar. I got into the 2025 Prep in a 0.7% selection.' },
      why: { pt: 'A Estudar mudou meu caminho. Subir no palco era a forma de devolver.', en: 'Estudar changed my path. Stepping on stage was my way of giving back.' }
    },
    {
      id: 'debate', cat: 'lead', tag: { pt: 'Harvard · Panamá · Brasil', en: 'Harvard · Panama · Brazil' }, yr: '2024–2026',
      imgs: ['hacia-1', 'harvard-2', 'harvard-cert', 'harvard-4', 'harvard-5'],
      title: { pt: 'Best Delegate no Harvard Summit of the Americas', en: 'Best Delegate at Harvard Summit of the Americas' },
      meta: { pt: 'HACIA, Panamá · Team Brazil de debate em Harvard', en: 'HACIA, Panama · Team Brazil debate at Harvard' },
      did: { pt: 'Melhor delegado no HACIA (Panamá), integrante do Team Brazil de debate em Harvard e premiado em MUNs (Best, Outstanding, Honorable). Também organizo o Debate para Todos.', en: 'Best Delegate at HACIA (Panama), member of Team Brazil debate at Harvard and awarded at MUNs (Best, Outstanding, Honorable). I also help run Debate for All.' },
      why: { pt: 'Debate me ensinou a defender uma ideia e a ouvir a melhor versão da ideia oposta.', en: 'Debate taught me to defend an idea and to hear the strongest version of the opposing one.' }
    },
    {
      id: 'chess', cat: 'lead', tag: { pt: 'Xadrez · Olimpíadas', en: 'Chess · Olympiads' }, yr: '2018–2026',
      imgs: ['chess-1', 'chess-2', 'arena-1', 'arena-2'],
      title: { pt: 'FIDE 1541 · 3 pratas na OBA · 2 bronzes na ONC', en: 'FIDE 1541 · 3 silvers at OBA · 2 bronzes at ONC' },
      meta: { pt: 'Colégio Arena (IB) · coordenador de Física na NOIC', en: 'Colégio Arena (IB) · Physics coordinator at NOIC' },
      did: { pt: 'Rating FIDE 1541, três pratas na Olimpíada Brasileira de Astronomia, dois bronzes na Olimpíada Nacional de Ciências e coordenação de Física na NOIC, ensinando outros alunos.', en: 'FIDE rating 1541, three silvers at the Brazilian Astronomy Olympiad, two bronzes at the National Science Olympiad and Physics coordination at NOIC, teaching other students.' },
      why: { pt: 'Tabuleiro e olimpíada treinam o mesmo músculo: pensar com calma sob pressão.', en: 'Chessboards and olympiads train the same muscle: thinking calmly under pressure.' }
    }
  ];

  /* Seção 4: o site inteiro muda a cada projeto */
  const TECH = [
    {
      id: 'cern', word: 'CERN', num: '01',
      title: { pt: 'Câmara de nuvem BL4S', en: 'BL4S cloud chamber' },
      sub: { pt: 'Física de partículas · CERN', en: 'Particle physics · CERN' },
      text: { pt: 'Nitrogênio líquido, luz UV e vapor de álcool: uma câmara que torna visíveis os múons que atravessam a sala. 20+ experimentos, 9 raios cósmicos catalogados.', en: 'Liquid nitrogen, UV light and alcohol vapor: a chamber that makes the muons crossing the room visible. 20+ experiments, 9 cosmic rays catalogued.' },
      tags: ['LN₂ −196 °C', 'UV 365 nm', 'Isopropanol'],
      imgs: ['cern-2', 'cern-1', 'cern-5'], theme: { bg: '#04161c', fg: '#e8fbff', ac: '#14e0c4', ac2: '#0a8f86', strip: '#14e0c4' }, filter: 'hue-rotate(150deg) saturate(1.3)'
    },
    {
      id: 'iypt', word: 'IYPT', num: '02',
      title: { pt: 'Torneio Internacional de Jovens Físicos', en: 'International Young Physicists’ Tournament' },
      sub: { pt: 'Capitão do Brasil · Prata na Copa do Mundo', en: 'Captain of Brazil · World Cup silver' },
      text: { pt: 'Experimentos de mecânica, aerodinâmica e eletromagnetismo, seis artigos e debate formal em inglês. Top 0,6% do mundo.', en: 'Experiments in mechanics, aerodynamics and electromagnetism, six papers and formal debate in English. Top 0.6% worldwide.' },
      tags: ['Mecânica', 'Aerodinâmica', 'Eletromagnetismo'],
      imgs: ['iypt-1', 'iypt-3', 'iypt-2'], theme: { bg: '#0b1b4d', fg: '#f3f1ff', ac: '#ff6a2b', ac2: '#ffb199', strip: '#ff6a2b' }, filter: 'grayscale(1) contrast(1.1)'
    },
    {
      id: 'projetei', word: 'PROJETEI', num: '03',
      title: { pt: 'Projetei · brinquedos em 3D', en: 'Projetei · 3D-printed toys' },
      sub: { pt: 'Cofundador e presidente · 110 pessoas', en: 'Co-founder & President · 110 people' },
      text: { pt: '1.500 brinquedos impressos em 3D de 2.000 inscrições, entregues a crianças em Goiás. Equipe de 110 pessoas, parceria com o poder público e Honra ao Mérito na Câmara Municipal.', en: '1,500 3D-printed toys from 2,000 applications, delivered to children in Goiás. A 110-person team, public-sector partnership and an Honor of Merit at the City Council.' },
      tags: ['FDM', 'SolidWorks / Fusion', 'Logística'],
      imgs: ['projetei-5', 'projetei-6', 'projetei-4'], theme: { bg: '#fff1e6', fg: '#1b0f08', ac: '#ff4a1c', ac2: '#ff9a6b', strip: '#ff4a1c' }, filter: 'saturate(1.15)'
    },
    {
      id: 'ifood', word: 'iFOOD', num: '04',
      title: { pt: 'Agente de IA nacional', en: 'Nationwide AI agent' },
      sub: { pt: 'Estágio de Engenharia de IA · 05–09/2026', en: 'AI Engineering internship · 05–09/2026' },
      text: { pt: 'Um agente de IA construído e colocado em produção, usado em todo o Brasil pelas operações do iFood. Aprendi o que uma demo precisa para virar produto.', en: 'An AI agent built and shipped to production, used across Brazil by iFood operations. I learned what a demo needs to become a product.' },
      tags: ['LLM agents', 'Produção', 'Python'],
      imgs: ['ifood-logo'], logo: true, theme: { bg: '#b0121e', fg: '#fff5f3', ac: '#ffd23f', ac2: '#ffffff', strip: '#ffffff' }, filter: 'none'
    },
    {
      id: 'hesites', word: 'HEsites', num: '05',
      title: { pt: 'HEsites · fábrica de sites com IA', en: 'HEsites · AI website factory' },
      sub: { pt: 'Produto próprio · n8n · multiagente', en: 'Own product · n8n · multi-agent' },
      text: { pt: 'Uma fábrica automatizada: prospecta pequenos negócios, gera sites sob medida com vídeo por IA, vende e acompanha o pós-venda. Seller, Coder, Reacher, Watchdog e Verifier trabalham juntos.', en: 'An automated factory: it prospects small businesses, generates custom sites with AI video, sells and handles after-sales. Seller, Coder, Reacher, Watchdog and Verifier work together.' },
      tags: ['n8n', 'Multiagente', 'WebGL'],
      imgs: [], pipeline: true, theme: { bg: '#120a2e', fg: '#f5f1ff', ac: '#8a63ff', ac2: '#3ddc97', strip: '#8a63ff' }, filter: 'none'
    },
    {
      id: 'aero', word: 'AERO', num: '06',
      title: { pt: 'Foguetes e aeroespacial', en: 'Rockets & aerospace' },
      sub: { pt: 'Antares Rocketry · propulsão · Notre Dame', en: 'Antares Rocketry · propulsion · Notre Dame' },
      text: { pt: 'Testes de motor de foguete a propelente sólido, foguetemodelismo e agora IrishSAT, Baja SAE e UAV em Notre Dame. O próximo passo é pesquisa em Aeroespacial.', en: 'Solid-propellant rocket-motor tests, model rocketry and now IrishSAT, Baja SAE and UAV at Notre Dame. Next step: Aerospace research.' },
      tags: ['Propulsão', 'CubeSat', 'UAV'],
      imgs: ['iypt-3', 'harvard-3', 'cern-4'], theme: { bg: '#e9e6e1', fg: '#0c0c0d', ac: '#e11d2e', ac2: '#0b1b4d', strip: '#0b1b4d' }, filter: 'grayscale(1) contrast(1.15)'
    }
  ];

  return { T, ACH, TECH };
})();
