# VOTA BRASIL - GO-LIVE CHECKLIST

> Gate de producao: NENHUM item abaixo pode ficar aberto quando dermos o site como "online".
> Origem do lembrete: Euler, 2026-09-25 - "modificar email/contatos etc antes de entrarmos online".
> Regra de ouro: e-mail novo so entra depois que o dominio tiver MX ativo (senao o contato MORRE).

## 0. Ordem segura de execucao
1. Infra (dominio + Railway) -> 2. Chave global (com grep) -> 3. HTML estatico -> 4. E-mails (so apos MX) -> 5. Gate de validacao.

## 1. Infra / dominio (bloqueia os e-mails)
- [ ] Registro do dominio `votabrasil.app` (ou o definitivo) confirmado
- [ ] DNS + MX + SPF/DKIM configurados para o dominio novo
- [ ] As 3 caixas criadas e testadas (envio/recebimento real): geral, imprensa, anuncie
- [ ] (Opcional) redirect 301 do dominio velho `mudabrasil.app` -> novo, p/ nao perder trafeego historico

## 2. Railway / backend (infra, nao cosmético)
- [ ] Decidir: mantem o servico `mudabrasil-production-79eb` (nome interno, invisivel ao usuario) OU renomeia
- [ ] Se renomear dominio do servico: atualizar `API_BASE` em TODOS os configs de uma vez + redeploy + smoke `/api/health`
- [ ] Confirmar que o volume SQLite (votos/revogacoes historicos) sobrevive ao deploy

## 3. Chave global no config.js (RISCO DE APP BRANCO)
- [ ] `git grep -n "window.MudaBrasil"` mapeado ANTES de mexer
- [ ] Decidir: (a) manter alias retrógrado `window.MudaBrasil = window.VotaBrasil` OU (b) purgar e trocar todos os consumers
- [ ] Se (b): nenhum `window.MudaBrasil` restante fora do alias, verificado por grep
- [ ] `console.log` de boot sem a marca velha
- [ ] Comentário de topo do config.js atualizado (marca + URL do frontend)

## 4. HTML estatico (index.html e afins) - NAO coberto por patch de runtime
- [ ] `<title>` -> VotaBrasil
- [ ] Header/logo + tagline -> VotaBrasil
- [ ] Hero "Explore o ..." -> VotaBrasil
- [ ] Rodapé "© 2026 ..." + dominio exibido -> VotaBrasil / dominio novo
- [ ] `<head>`: `description`, `og:title`, `og:description`, `og:site_name`, `theme-color`, nome do `manifest.webmanifest`, `apple-touch` label
- [ ] Seção *Quem Somos* no FONTE -> VotaBrasil (hoje o runtime ja cobre via script `vb-quem-somos`, mas view-source/SEO ainda entrega MudaBrasil)
- [ ] Varredura: `pages/*.html`, `app/index.html`, templates, README, termos/privacidade

## 5. E-mails / contatos (SO DEPOIS do item 1 - MX ativo)
- [ ] `CONTATO.email_geral` -> novo dominio
- [ ] `CONTATO.email_imprensa` -> novo dominio
- [ ] `CONTATO.email_anuncie` -> novo dominio
- [ ] Trocar tambem em: rodapé, pagina Ajuda, "Fale com a gente" do manifesto, termos/privacidade
- [ ] Teste real: enviar 1 msg para cada caixa e confirmar recebimento

## 6. GATE FINAL de validacao (criterio objetivo de "pronto")
- [ ] `git grep -in "mudabrasil"` retorna ZERO, exceto: este arquivo, `.git`, `node_modules`, e historico intencional (se houver)
- [ ] `git grep -in "window.MudaBrasil"` retorna ZERO (ou apenas o alias deliberado)
- [ ] Site carregando em producao: title/aba, header, hero, rodapé, Quem Somos, manifest = VotaBrasil
- [ ] Console do navegador sem erro e sem log de marca velha
- [ ] Fluxo completo testado no celular: votar (5 cargos) -> codigo 20 digitos -> conferir -> revogar
- [ ] Backend `/api/health` ok e votos persistindo no banco OFICIAL (nao no redesign)

---
_Purgar "MudaBrasil" do texto narrativo ja foi feito no manifesto (Quem Somos). Purgar dos E-MAILS e do dominio e rebrand de INFRA, nao de redacao - por isso mora aqui, condicionado ao MX, e nao foi feito antes._