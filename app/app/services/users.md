# users (service)

**Arquivo:** `app/app/services/users.ts`
**Tipo:** Módulo de serviço — Integração com API

## Descrição

Camada de acesso à API externa para dados de usuários. Responsável por fazer as requisições HTTP e mapear as respostas para os tipos esperados pela aplicação.

## Tipos

### `UserInfo`

```ts
export type UserInfo = {
  id: number;
  name: string;
  email: string;
};
```

Representa um usuário retornado pela API. Distinto de `UserDB` (que representa o banco local).

## Funções

### `getInfos(): Promise<UserInfo[]>`

Busca a lista de usuários do servidor.

```ts
const users = await getInfos();
```

**Endpoint:** `GET /infos`
**Retorno:** Array de `UserInfo`
**Erro:** Lança `Error` se `response.ok` for falso, com o HTTP status no message.

```ts
if (!response.ok) {
  throw new Error(`Failed to fetch infos: ${response.status}`);
}
```

## Configuração

```ts
const API_BASE_URL = "http://localhost:3000";
```

> **Atenção:** A URL base está hardcoded e aponta para `localhost`. Em ambiente de desenvolvimento com emulador Android, use `http://10.0.2.2:3000`. Em produção, use HTTPS e variáveis de ambiente.

## Pendências

- [ ] Migrar `API_BASE_URL` para variável de ambiente (ex: `process.env.EXPO_PUBLIC_API_URL`).
- [ ] Substituir `http://` por `https://` em produção.
- [ ] Adicionar timeout e tratamento de erros de rede (ex: `AbortController`).

## Dependências

Nenhuma dependência interna. Usa apenas a API nativa `fetch`.
