# Radar Cripto

Radar Cripto é uma aplicação web fullstack desenvolvida para monitoramento de criptomoedas utilizando uma arquitetura baseada em microsserviços.

O sistema permite que usuários autenticados cadastrem, consultem, editem e removam moedas, além de receberem atualizações em tempo real sempre que houver alterações realizadas por outros usuários conectados.

## Tecnologias

- React
- Vite
- Node.js
- Express
- SQLite
- Redis
- WebSocket
- JSON Web Token (JWT)
- Docker
- bcryptjs

## Funcionalidades

- Autenticação de usuários utilizando JWT
- Cadastro de moedas
- Consulta e listagem de moedas
- Atualização de registros
- Exclusão de registros
- Controle de acesso por proprietário
- Atualizações em tempo real via WebSocket
- Cache para consultas
- Compressão de respostas HTTP
- Logs de segurança
- Rate limiting
- Sanitização de entradas contra SQL Injection e XSS

## Estrutura do projeto

```
RadarCripto/
│
├── auth-service/
├── resource-service/
├── notification-service/
├── frontend/
├── docker-compose.yml
└── README.md
```

### auth-service

Responsável pela autenticação dos usuários, geração de tokens JWT e gerenciamento da revogação de sessões.

### resource-service

Responsável pelo gerenciamento das moedas cadastradas pelos usuários. Toda operação de escrita publica um evento no Redis para notificar os demais serviços.

### notification-service

Mantém conexões WebSocket com o frontend e retransmite em tempo real os eventos recebidos do Redis.

### Redis

Utilizado como mecanismo de mensageria entre os microsserviços através de Pub/Sub e também para armazenar tokens revogados.

Cada serviço possui seu próprio banco SQLite, mantendo independência entre os dados.

## Pré-requisitos

- Node.js 22.5 ou superior
- Docker Desktop (ou Redis instalado localmente)
- npm

## Executando o Redis

Caso utilize Docker:

```bash
docker compose up -d redis
```

Caso prefira, também é possível utilizar uma instalação local do Redis.

## Configuração

Crie um arquivo `.env` correspondente em cada pasta e ajuste os valores conforme necessário.

> O valor de `JWT_SECRET` deve ser exatamente o mesmo em todos os serviços do backend.

## Instalação

Na raiz do projeto execute:

```bash
npm install
npm run install:all
```

## Executando o projeto

Para iniciar todos os serviços simultaneamente:

```bash
npm run dev
```

Ou execute cada serviço individualmente:

```bash
# Auth Service
cd auth-service
npm run dev
```

```bash
# Resource Service
cd resource-service
npm run dev
```

```bash
# Notification Service
cd notification-service
npm run dev
```

```bash
# Frontend
cd frontend
npm run dev
```

Após iniciar os serviços, acesse:

```
http://localhost:5173
```

## Usuários para teste

| Usuário | Senha |
|----------|--------|
| admin@radarcripto.local | Radar@2025 |
| convidada@radarcripto.local | Convidada@2025 |

## Principais recursos implementados

- Arquitetura baseada em microsserviços
- Comunicação assíncrona utilizando Redis Pub/Sub
- Atualizações em tempo real via WebSocket
- Autenticação utilizando JWT
- Senhas protegidas com bcrypt
- Controle de acesso por proprietário
- Cache em memória para otimização de consultas
- Compressão de respostas HTTP
- Logs centralizados de segurança
- Persistência independente para cada serviço utilizando SQLite
