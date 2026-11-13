# Aciona o agente do Antigravity sem UI, usando o agentapi do language server.
# Uso: .\dispatch-antigravity.ps1 -DispatchFile .\DISPATCH.md -Title "meu-site assets"
param(
  [Parameter(Mandatory)][string]$DispatchFile,
  [string]$Title = "assets",
  [string]$Model = "pro",
  [string]$BaseDir = "C:\Contexto Mini Factory\antigravity-assets"
)
$ErrorActionPreference = "Stop"
$ls = "$env:LOCALAPPDATA\Programs\antigravity\resources\bin\language_server.exe"

# 1) Garante que o Antigravity (e o daemon) esta rodando
if (-not (Get-Process language_server -ErrorAction SilentlyContinue)) {
  Start-Process "$env:LOCALAPPDATA\Programs\antigravity\Antigravity.exe" -ArgumentList "`"$BaseDir`""
  for ($i=0; $i -lt 30 -and -not (Get-Process language_server -ErrorAction SilentlyContinue); $i++) { Start-Sleep 2 }
  Start-Sleep 8
}

# 2) Le porta e token CSRF do daemon (arquivo mais recente)
$hubFile = Get-ChildItem "$env:USERPROFILE\.gemini\antigravity\daemon\hub_*.json" | Sort LastWriteTime -Descending | Select -First 1
$hub = Get-Content $hubFile.FullName -Raw | ConvertFrom-Json
$env:ANTIGRAVITY_LS_ADDRESS = "127.0.0.1:$($hub.httpPort)"
$env:ANTIGRAVITY_CSRF_TOKEN = $hub.csrfToken

# 3) Envia o pedido
$disp = Get-Content $DispatchFile -Raw -Encoding UTF8
$prompt = "Voce e o agente de midia. Gere TODOS os ativos abaixo (imagens com a ferramenta de imagem; videos loop mp4 1080p onde indicado). Salve cada arquivo no caminho indicado, relativo a $BaseDir (use caminho absoluto completo). Ao terminar, liste os caminhos absolutos.`n`n$disp"
& $ls agentapi new-conversation --model=$Model --title=$Title $prompt
