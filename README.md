# Adote um Bigode: site

Site do projeto Adote um Bigode, rede voluntária de resgate e adoção de gatos em Fortaleza (CE). Este documento serve para quem for manter o site no futuro.

## Onde está cada coisa

| O quê | Onde |
|---|---|
| Site no ar | https://adote-um-bigode.adote-um-bigode.workers.dev (Cloudflare Workers, nome `adote-um-bigode`) |
| Código | GitHub: [adoteumbigodeceara-web/landing-page](https://github.com/adoteumbigodeceara-web/landing-page) (branch `main`) |
| Banco de dados e login | Firebase, projeto `adoteumbigode-ec504` (Firestore em `southamerica-east1` + login com Google), plano gratuito Spark |
| E-mail administrador | `adoteumbigodeceara@gmail.com`: única conta que entra em `/admin` e pode editar a prestação de contas |
| Inscrições de voluntários | Vão por e-mail para `adoteumbigodeceara@gmail.com` (definido em `VOLUNTEER_EMAIL` em `src/App.tsx`) |
| Instagram | [@adoteumbigodeceara](https://instagram.com/adoteumbigodeceara) (o botão "Adotar" abre o direct) |
| Pix | Chave `adoteumbigodece@gmail.com` (QR e copia e cola gerados em `src/pix.ts`) |

Tudo roda em planos gratuitos, sem custo mensal.

## Páginas

- `/`: página inicial: como ajudar (doar, ser voluntário, adotar), quem somos, fotos, doação por Pix e links de apoio, e o formulário de voluntário.
- `/prestacao-de-contas`: despesas de cada mês publicado, lidas do Firestore.
- `/admin`: painel para lançar despesas (à mão ou importando fatura PDF do Itaú), salvar rascunho e publicar o mês. Só a conta administradora entra.

## Rodar no computador

Requisitos: Node.js 20 ou mais novo.

```bash
npm install
cp .env.example .env   # preencha com os dados do app web no Firebase
npm run dev            # abre em http://localhost:5173
```

Os valores do `.env` ficam no Console do Firebase → Configurações do projeto → Seus apps → app Web. Só são necessários `apiKey`, `authDomain`, `projectId` e `appId`. O `.env` não vai para o GitHub; ele vale para `npm run dev`. Os builds de produção usam `.env.production`, que já está no repositório.

Sem `.env`, o site funciona em **modo local**: o painel abre sem login e os relatórios ficam salvos só no navegador, útil para testar.

## Publicar uma nova versão

### Automático (recomendado)

O Cloudflare publica sozinho a cada `git push` na branch `main` do repositório `adoteumbigodeceara-web/landing-page`. A configuração do Firebase usada no build fica em `.env.production`, que está no repositório (ela é pública por natureza: vai junto no site, e quem protege os dados são as regras do Firestore).

Configuração, feita uma vez no painel do Cloudflare:

1. **Workers & Pages → adote-um-bigode → Settings → Build**.
2. Em **Git repository**, clique em **Connect** e escolha `adoteumbigodeceara-web/landing-page`, branch `main` (é preciso autorizar o app do Cloudflare na conta do GitHub `adoteumbigodeceara-web`).
3. **Build command:** `npm run build`
4. **Deploy command:** `npx wrangler deploy`
5. Não é preciso cadastrar variáveis de build.

Para acompanhar ou ver erros, abra a aba **Deployments** do mesmo Worker. Se o Firebase mudar (outro projeto, por exemplo), atualize `.env.production` e faça push.

### Manual

Do próprio computador, sem esperar o push:

```bash
npm run deploy
```

Isso gera a versão final (`dist/`) e publica no Cloudflare. Na primeira vez em um computador novo, rode `npx wrangler login` e entre na conta do Cloudflare do projeto.

## Firebase

- Regras de acesso do banco: `firestore.rules`. Relatórios publicados são públicos para leitura; só o e-mail administrador escreve. Depois de alterar, publique com:
  ```bash
  firebase deploy --only firestore:rules
  ```
  (o projeto já está vinculado em `.firebaserc`; na primeira vez rode `firebase login`).
- Para trocar ou adicionar administradores, mude o e-mail em **dois lugares**: `firestore.rules` e `ADMIN_EMAILS` em `src/AdminPage.tsx`. Depois publique as regras e o site.
- Se o site mudar de endereço (domínio próprio, por exemplo), adicione o novo domínio em Firebase → Authentication → Configurações → Domínios autorizados, senão o login do `/admin` não funciona.

## Tecnologia

React 19 + Vite + Tailwind CSS 4, Firebase (Firestore e Auth), hospedagem em Cloudflare Workers (arquivos estáticos, configurado em `wrangler.jsonc`).
