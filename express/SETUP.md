# Backend Express + SQLite — Setup e Execução

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- npm v9 ou superior (já vem com o Node.js)

Verifique se está instalado:

```bash
node -v
npm -v
```

---

## Instalação

1. Entre na pasta do backend:

```bash
cd express
```

2. Instale as dependências:

```bash
npm install
```

3. Crie o arquivo de variáveis de ambiente copiando o template:

```bash
cp .env.example .env
```

O arquivo `.env` padrão já está pronto para desenvolvimento local:

```
PORT=3000
NODE_ENV=development
DB_PATH=./db
ALLOWED_ORIGIN=http://localhost:8081
```

> O banco de dados SQLite (`db/app.db`) é criado automaticamente na primeira execução.
> As migrations também rodam automaticamente.

---

## Scripts disponíveis

| Script | Comando | Descrição |
|---|---|---|
| Desenvolvimento | `npm run dev` | Sobe o servidor com hot-reload via nodemon (Linux/Mac) |
| Desenvolvimento (Windows) | `npm run dev:win` | Mesmo que acima, mas para Windows |
| Produção | `npm start` | Sobe o servidor sem hot-reload |

---

## Rodando em desenvolvimento

```bash
npm run dev
```

Saída esperada:

```
[migration] aplicada: 001_users.sql
[migration] aplicada: 002_outbox_log.sql
[server] rodando em http://localhost:3000
```

A partir da segunda execução as migrations não aparecem novamente — já foram aplicadas.

---

## Testando os endpoints

Com o servidor rodando, você pode testar com `curl` ou qualquer cliente HTTP (Postman, Insomnia, etc.).

### Criar usuário

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Fulano",
    "createdAt": 1710000000000,
    "updatedAt": 1710000000000
  }'
```

### Listar usuários

```bash
curl http://localhost:3000/api/users
```

### Push de sincronização (outbox do app)

```bash
curl -X POST http://localhost:3000/api/sync/push \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "outboxId": "660e8400-e29b-41d4-a716-446655440001",
        "entityId": "550e8400-e29b-41d4-a716-446655440000",
        "type": "UPSERT",
        "payload": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "Fulano Editado",
          "createdAt": 1710000000000,
          "updatedAt": 1710002000000
        }
      }
    ]
  }'
```

### Pull de sincronização

```bash
curl "http://localhost:3000/api/sync/pull?since=0"
```

---

## Estrutura gerada em runtime

Após a primeira execução, a pasta `db/` conterá:

```
db/
├── app.db        # banco SQLite principal
├── app.db-wal    # WAL (Write-Ahead Log) — gerado automaticamente
└── app.db-shm    # shared memory do WAL — gerado automaticamente
```

> Esses arquivos estão no `.gitignore` e não devem ser commitados.

---

## Rodando com Docker

Certifique-se de ter o [Docker](https://www.docker.com/) instalado e rodando.

```bash
docker-compose up --build
```

O servidor ficará disponível em `http://localhost:3000`.

---

## Endpoints disponíveis

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/users` | Lista usuários não deletados |
| GET | `/api/users?since=<ms>` | Lista usuários modificados após timestamp |
| POST | `/api/users` | Cria usuário |
| PUT | `/api/users/:id` | Atualiza usuário |
| DELETE | `/api/users/:id` | Soft delete de usuário |
| POST | `/api/sync/push` | Recebe lote do outbox do app |
| GET | `/api/sync/pull?since=<ms>` | Retorna registros modificados após timestamp |
