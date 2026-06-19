# Radar Cripto

**Radar Cripto** é uma aplicação web fullstack para monitoramento de criptomoedas,
desenvolvida para a disciplina ES47B - Programação Web Fullstack (UTFPR - Campus
Cornélio Procópio).

A aplicação é dividida em três camadas:

* **Front-end** (`frontend/`): SPA em React (Vite), responsável apenas pela interface.
  Toda a comunicação com o servidor é feita via requisições HTTP.
* **Back-end** (`backend/`): API REST em Express.js, responsável pela autenticação,
  regras de negócio, acesso ao banco de dados e integração com a API pública da
  CoinGecko.
* **Banco de dados**: SQLite (via `node:sqlite`), com um pool de conexões simples
  gerenciado pelo próprio backend.

## Funcionalidades

* **Login**: autenticação por e-mail/senha, com sessão controlada por cookie
  `httpOnly` (o token nunca fica acessível via JavaScript no navegador).
* **Busca**: pesquisa de criptomoedas combinando dados cadastrados localmente com
  dados em tempo real da API CoinGecko.
* **Inserção**: cadastro de novas criptomoedas no banco local — disponível apenas
  para usuários autenticados.
* **Favoritos** e **Ranking**: funcionalidades adicionais no front-end para
  organizar e visualizar as moedas mais relevantes.

Busca e inserção só podem ser realizadas por usuários com sessão ativa. Não há
cadastro de usuários pela aplicação: o sistema já é inicializado com um usuário
padrão (ver seção "Usuário de teste").

## Segurança

* Senhas armazenadas com hash `PBKDF2` + salt (nunca em texto puro).
* Sessão identificada por token aleatório de 32 bytes; apenas o **hash** do token
  é guardado no banco. O token em si trafega em um cookie `HttpOnly`,
  `SameSite=Strict` e `Secure` (quando a conexão é HTTPS).
* Sanitização de parâmetros e uso de *prepared statements* em todas as consultas
  SQL, prevenindo SQL Injection.
* Cabeçalhos de segurança (`Content-Security-Policy`, `X-Frame-Options`,
  `X-Content-Type-Options`, `Strict-Transport-Security`, etc.).
* *Rate limiting* nas tentativas de login (proteção contra força bruta).
* Redirecionamento automático de HTTP para HTTPS quando a aplicação roda em modo
  produção (`NODE_ENV=production`).
* Registro (log) de eventos de autenticação, buscas e inserções em
  `backend/security.log`.

## Otimizações

* Compressão `gzip` das respostas JSON e dos arquivos estáticos do front-end.
* Cabeçalhos de cache (`Cache-Control`) para os arquivos estáticos.
* Cache em memória (TTL de 5 minutos) para as respostas da API CoinGecko, reduzindo
  chamadas externas repetidas.
* Pool de conexões com o banco SQLite.

## Estrutura do repositório

```
backend/
  server.js
  gerar-certificado.sh
  src/
    routes/   -> rotas + controladores (auth.js, moedas.js)
    models/   -> acesso ao banco de dados (Usuario.js, Sessao.js, Moeda.js)
    config/   -> configuração de banco, segurança e cache (database.js, security.js)
frontend/
  src/
    components/
    contexts/
    services/
```

## Como executar

### Pré-requisitos

* Node.js 22+ (necessário para `node:sqlite`)
* `pnpm` (ou `npm`, ajustando os comandos)

### 1. Backend

```bash
cd backend
pnpm install
pnpm dev
```

O servidor sobe por padrão em `http://localhost:3001`. O banco SQLite
(`radar_cripto.sqlite`) é criado e populado automaticamente na primeira execução,
incluindo o usuário de teste.

#### Usuário de teste

```
E-mail: admin@radarcripto.local
Senha:  Radar@2025
```

#### (Opcional) Rodando o backend com HTTPS localmente

```bash
cd backend
pnpm gerar-certificado   # gera um certificado autoassinado em backend/certs
pnpm dev                 # o servidor detecta o certificado e sobe em https://localhost:3001
```

O navegador vai exibir um aviso de certificado não confiável (esperado, pois é
autoassinado) — basta prosseguir para acessar normalmente.

### 2. Frontend

Em outro terminal:

```bash
cd frontend
pnpm install
pnpm dev
```

A aplicação fica disponível em `http://localhost:5173`. O Vite já está configurado
para fazer proxy de `/api` para `http://localhost:3001`, então não é necessário
configurar CORS.

### 3. Build de produção (opcional)

```bash
cd frontend
pnpm build
```

O `server.js` do backend já está preparado para servir os arquivos estáticos
gerados em `frontend/dist` (com compressão e cache), bastando rodar
`pnpm start` dentro de `backend/` após o build do front-end.

## 👨‍💻 Autor

**Luccas Hessel** - Estudante de Engenharia de Software - UTFPR

---
© 2026 - Radar Cripto
