# Radar Cripto — Projeto 2 (Arquitetura de Microsservicos)

Aplicacao fullstack distribuida desenvolvida para a disciplina de Programacao Web
Fullstack (Prof. Anderson Paulo Avila Santos). Estende o Projeto 1 (SPA React +
API externa) substituindo a API publica por um back-end proprio dividido em
3 microsservicos independentes, com mensageria assincrona e notificacoes em
tempo real via WebSocket.

## 1. Arquitetura

```
                         ┌──────────────────────┐
                         │   Front-end (React)  │
                         └──────────┬────────────┘
              HTTP (JWT) ┌──────────┼───────────┐ WebSocket
                         ▼                       ▼
              ┌─────────────────┐      ┌───────────────────────┐
              │  auth-service    │      │ notification-service  │
              │  porta 3001      │      │ porta 3003 (HTTP+WS)  │
              │  (login/JWT)     │      └───────────┬────────────┘
              └────────┬─────────┘                  │ subscribe
                       │ HTTP (JWT)                  │
                       ▼                             │
              ┌─────────────────┐   publish   ┌──────┴───────┐
              │ resource-service │────────────▶│    Redis     │
              │  porta 3002      │             │ (Pub/Sub +   │
              │  (CRUD moedas)   │◀────────────│  blacklist)  │
              └─────────────────┘   check jti  └──────────────┘
```

* **auth-service** — autentica usuarios e emite/revoga tokens JWT.
* **resource-service** — CRUD de moedas (RF2 a RF5), valida o JWT com o
  segredo compartilhado, verifica propriedade em Update/Delete e publica
  um evento no Redis a cada escrita.
* **notification-service** — mantem as conexoes WebSocket com o
  Front-end e retransmite em tempo real os eventos consumidos do Redis.
* **Redis** — atua como fila de mensagens (Pub/Sub) entre o
  resource-service (produtor) e o notification-service (consumidor), e
  tambem guarda a lista de tokens revogados (blacklist), consultada
  pelo resource-service. Nenhum servico acessa o banco de dados de
  outro diretamente.

Cada servico com persistencia (`auth-service`, `resource-service`) tem seu
proprio arquivo SQLite, criado automaticamente na primeira execucao.

## 2. Pre-requisitos

* Node.js **>= 22.5** (usa o modulo nativo `node:sqlite`)
* Redis (local, via Docker, ou um servico gerenciado)
* npm ou pnpm

### Subindo o Redis rapidamente com Docker

```bash
docker compose up -d redis
```

Ou instale o Redis localmente e garanta que ele esteja escutando em
`localhost:6379` (ou ajuste `REDIS_URL` nos arquivos `.env`).

## 3. Configuracao das variaveis de ambiente

Cada servico possui um arquivo `.env.example`. Copie para `.env` em cada
pasta e ajuste se necessario:

```bash
cp auth-service/.env.example auth-service/.env
cp resource-service/.env.example resource-service/.env
cp notification-service/.env.example notification-service/.env
cp frontend/.env.example frontend/.env
```

**IMPORTANTE:** o valor de `JWT_SECRET` deve ser **identico** nos tres
arquivos `.env` de backend (`auth-service`, `resource-service` e
`notification-service`), pois a validacao do token e feita localmente em
cada servico a partir do segredo compartilhado.

## 4. Instalacao das dependencias

Na raiz do projeto:

```bash
npm run install:all
```

Isso executa `npm install` em `auth-service/`, `resource-service/`,
`notification-service/` e `frontend/`. Tambem e necessario instalar as
dependencias da raiz (usadas apenas para orquestrar os `npm run dev` em
paralelo durante a demonstracao):

```bash
npm install
```

## 5. Executando o projeto

### Opcao A — todos os servicos de uma vez (para a apresentacao)

```bash
npm run dev
```

Isso sobe, em paralelo, `auth-service` (3001), `resource-service`
(3002), `notification-service` (3003) e o `frontend` (Vite, geralmente
5173).

### Opcao B — cada servico em um terminal separado (recomendado para
mostrar a independencia dos servicos na demonstracao em linha de
comando)

```bash
# terminal 1
cd auth-service && npm run dev

# terminal 2
cd resource-service && npm run dev

# terminal 3
cd notification-service && npm run dev

# terminal 4
cd frontend && npm run dev
```

Cada servico pode ser iniciado, parado e reiniciado de forma totalmente
independente dos demais (basta o Redis estar no ar para
resource-service/notification-service trocarem eventos).

Acesse o Front-end em `http://localhost:5173`.

## 6. Usuarios de teste (seed automatico no auth-service)

| E-mail                          | Senha           |
|----------------------------------|-----------------|
| admin@radarcripto.local          | Radar@2025      |
| convidada@radarcripto.local      | Convidada@2025  |

Use dois usuarios diferentes (em duas abas/navegadores) para demonstrar
que a restricao de propriedade (HTTP 403) funciona: um usuario nao
consegue editar/excluir moedas cadastradas pelo outro.

## 7. Demonstrando a notificacao em tempo real (RF6)

1. Abra o Front-end em dois navegadores (ou uma aba normal + uma
   anonima), faca login em ambos.
2. Em um deles, cadastre, edite ou exclua uma moeda na aba "Minhas
   moedas" / formulario "Inserir moeda".
3. O outro navegador deve atualizar a listagem (Ranking / Minhas
   moedas) automaticamente, sem reload, assim que o evento chegar pelo
   WebSocket do notification-service.

O indicador circular ao lado do nome do usuario no cabecalho fica verde
quando a conexao WebSocket esta ativa.

## 8. Resumo dos requisitos funcionais implementados

| RF  | Descricao                         | Onde |
|-----|------------------------------------|------|
| RF1 | Login com JWT                      | `auth-service` (`POST /login`) |
| RF2 | Busca (Read)                       | `resource-service` (`GET /`, `GET /ranking`, `GET /minhas`) |
| RF3 | Insercao (Create)                  | `resource-service` (`POST /`) |
| RF4 | Atualizacao (Update, dono apenas)  | `resource-service` (`PUT /:id`) |
| RF5 | Exclusao (Delete, dono apenas)     | `resource-service` (`DELETE /:id`) |
| RF6 | Notificacoes em tempo real         | `notification-service` (WebSocket `/ws`) |

## 9. Requisitos nao funcionais — o que foi corrigido em relacao ao feedback da entrega anterior

| Item do feedback                         | Como foi corrigido |
|-------------------------------------------|---------------------|
| Criptografia (bcrypt/hash): **NOK**       | Senhas agora usam `bcryptjs` (algoritmo bcrypt, hash + salt, 12 rounds) em `auth-service/src/config/security.js`. |
| Protecao contra injecao: **Parcial**      | Todas as consultas continuam parametrizadas (SQL injection). Adicionada sanitizacao mais rigorosa contra XSS (remocao de tags/HTML) em `resource-service/src/config/security.js`, aplicada a todos os campos de texto de entrada. |
| Autenticacao (rate limit / JWT): **NOK**  | Login agora usa JWT (`jsonwebtoken`) com expiracao curta (30 min) + lista de revogacao no Redis. Rate limiting implementado com `express-rate-limit` (5 tentativas/min) no `auth-service`. |
| Logs de seguranca: **NOK**                | Cada servico grava eventos (login, falha de autenticacao, CRUD, acesso negado, erros) em `logs/security.log`, na raiz do projeto, com o campo `servico` identificando a origem. |
| Compressao de respostas: **NOK**          | Middleware oficial `compression` adicionado em `auth-service` e `resource-service`. |
| Cache no backend: **NOK**                 | Cache em memoria com TTL (`resource-service/src/config/cache.js`) para as rotas de busca/ranking, invalidado a cada operacao de escrita. |
| Compressao de arquivos estaticos: OK      | Mantida (build do Vite gera assets ja comprimidos/otimizados; middleware `compression` tambem cobre o front-end caso seja servido por um dos servicos). |
| Pool de conexoes: OK                      | Mantido e replicado em cada servico com persistencia (`auth-service` e `resource-service` possuem seu proprio pool de conexoes SQLite). |

## 10. Estrutura de pastas

```
RadarCripto-main/
├── auth-service/
│   ├── package.json
│   ├── server.js
│   └── src/{routes,models,config}/
├── resource-service/
│   ├── package.json
│   ├── server.js
│   └── src/{routes,models,config}/
├── notification-service/
│   ├── package.json
│   ├── server.js
│   └── src/{routes,models,config}/
├── frontend/                 (mesma estrutura do Projeto 1)
├── logs/security.log         (log centralizado, gerado em runtime)
├── docker-compose.yml         (sobe apenas o Redis)
└── README.md
```

## 11. Escolhas tecnicas declaradas ao professor

* **Fila de mensagens:** Redis Pub/Sub (biblioteca `ioredis`).
* **Banco de dados:** SQLite (modulo nativo `node:sqlite`), um arquivo
  por servico (`auth-service/auth.sqlite`, `resource-service/resource.sqlite`).
* **Hash de senha:** `bcryptjs` (implementacao JS do algoritmo bcrypt,
  compativel com hashes gerados por bibliotecas nativas `bcrypt`).
