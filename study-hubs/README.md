# Study Hubs (página única com abas)

Uma aba por matéria; cada hub é uma página própria em `hubs/<slug>.html` (mesma origem, então o progresso fica no `localStorage` do domínio e não zera ao fechar). A aba aberta por último é lembrada.

- Atualizar: `python3 study-hubs/build.py` (lê `/mnt/project-files/hubs`, ou passe outra pasta), depois commit e push.
- Deploy no Vercel: projeto com **Root Directory = `study-hubs`**, sem build command. `vercel.json` já está aqui.
- Botões Backup/Restaurar exportam/importam o progresso (`nd:*`), útil se trocar de domínio ou navegador.
