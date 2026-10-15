// Na Vercel não há servidor Node próprio: este endpoint só diz se o bot com IA está ligado.
module.exports = (req, res) => {
  res.json({ ia: !!process.env.ANTHROPIC_API_KEY, hospedado: true });
};
