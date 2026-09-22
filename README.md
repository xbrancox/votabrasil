# VotaBrasil
Plataforma civica de voto continuo e revogavel (prototipo demonstrativo, sem valor juridico).
"Seu voto coloca. Seu voto tira."

## Estrutura
- / ............ site principal (radar completo + modulos: PDF, notificacoes, dashboard, gamificacao, API)
- /app ......... app PWA com cedula (rolagem corrigida, filtro tolerante, paginacao ampla)
- /server ...... backend Node (cap 2000, sqlite)
- /scripts ..... coletor TSE + enriquecimento de fotos (Camara)
- /data ........ snapshots de candidatos
- .github/workflows/pages.yml publica a RAIZ (path: .)

## Regra de revogacao
70% dos votos que elegeram = cassacao do mandato.

## Backend
API_BASE atual: https://mudabrasil-production-79eb.up.railway.app (banco preservado).
Troca de provedor/assinatura sera decidida depois - basta editar config.js e app/config.js.

Licenca: CC-BY-4.0
