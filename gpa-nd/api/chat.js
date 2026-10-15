// Bot com IA na Vercel. Só responde com IA se ANTHROPIC_API_KEY estiver nas variáveis do projeto;
// sem ela devolve modo "regras" e o navegador responde com os cálculos do próprio painel.
const SISTEMA = `Você é um orientador acadêmico objetivo para um aluno da University of Notre Dame.
Escala de Notre Dame: A=4.0, A-=3.667, B+=3.333, B=3.0, B-=2.667, C+=2.333, C=2.0, C-=1.667, D=1.0, F=0. P/S/U/W não contam no GPA.
Responda em português do Brasil, curto e direto (no máximo ~150 palavras), com passos concretos e números tirados dos dados.
Priorize as matérias com mais créditos e as que estão perto de subir ou cair de letra. Quando citar notas necessárias, faça a conta.
Se a pergunta depender de regra específica da universidade que você não tem certeza (prazos de drop, Dean's List, honors), diga para confirmar no site do registrar ou com o advisor.`;

module.exports = async (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (req.method !== 'POST' || !key) return res.json({ modo: 'regras' });
  const { mensagens, contexto } = req.body || {};
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
        max_tokens: 700,
        system: `${SISTEMA}\n\nDados atuais do aluno (calculados pelo painel):\n${String(contexto || '').slice(0, 20000)}`,
        messages: (mensagens || []).slice(-12),
      }),
    });
    const d = await r.json();
    if (!r.ok) return res.json({ modo: 'regras', erro: d.error?.message || `HTTP ${r.status}` });
    res.json({ modo: 'ia', texto: d.content.filter((c) => c.type === 'text').map((c) => c.text).join('\n') });
  } catch (e) {
    res.json({ modo: 'regras', erro: e.message });
  }
};
