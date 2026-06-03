# TaskFlow — CRUD C# + .NET

API REST em .NET 9 com frontend Angular 21 pra gerenciamento de tarefas em formato Kanban. O projeto foi construído com Clean Architecture no backend, JWT com refresh token, e Angular Signals no frontend.

---

## Entidade escolhida

**TaskItem** — representa uma tarefa com título, descrição, data de vencimento, status (Pending / InProgress / Done / Cancelled) e vínculo com um usuário responsável.

---

## Stack utilizada

**Backend**
- .NET 9 / C#
- ASP.NET Core Web API
- Entity Framework Core 9 + PostgreSQL (Npgsql)
- JWT Bearer Auth + Refresh Token (rotação a cada uso)
- BCrypt para hash de senha
- FluentValidation para validação dos DTOs
- Clean Architecture: Domain → Application → Infrastructure → API

**Frontend**
- Angular 21 (standalone components)
- Angular Signals para gerenciamento de estado
- Angular Router com lazy loading
- HttpClient + interceptor de auth com refresh silencioso

**Infra**
- Docker + Docker Compose (PostgreSQL + API)
- EF Core Migrations

---

## Como executar o projeto

### Opção 1 — Docker (recomendado)

Com Docker e Docker Compose instalados:

```bash
docker compose up --build
```

A API sobe em `http://localhost:5000` e o banco já é provisionado automaticamente.

Para rodar o frontend separadamente:

```bash
cd frontend
npm install
npm start
```

Acesse em `http://localhost:4200`.

### Opção 2 — Sem Docker

Precisa ter .NET 9 SDK e PostgreSQL rodando localmente.

```bash
# Rodar a API
cd src/TaskFlow.API
dotnet run
```

Antes, configure a connection string em `appsettings.Development.json` apontando pro seu Postgres local.

---

## Configuração do banco de dados

As migrations já estão geradas. Na primeira execução via Docker o banco sobe limpo e a API aplica as migrations automaticamente.

Se quiser rodar manualmente:

```bash
cd src/TaskFlow.API
dotnet ef database update
```

As variáveis de ambiente esperadas (já configuradas no `docker-compose.yml`):

```
ConnectionStrings__DefaultConnection=Host=postgres;Port=5432;Database=taskflow;Username=postgres;Password=postgres
Jwt__SecretKey=TaskFlow_SuperSecret_JWT_Key_Must_Be_32_Chars_Min!
Jwt__Issuer=TaskFlowAPI
Jwt__Audience=TaskFlowClient
```

---
## Realizar o cadastro de um usuario pelo frontend ou pela API

Realizar o Login Admin
Acesse http://localhost:4200 no seu navegador. Graças ao seeder automático presente no backend, você pode fazer o login administrativo imediatamente usando as seguintes credenciais:

E-mail: admin@taskflow.com
Senha: Admin123

---

## Decisões técnicas

**Clean Architecture no backend** - separei em quatro projetos: `Domain` (entidades e exceções), `Application` (serviços, interfaces, DTOs, validators), `Infrastructure` (EF Core, repositórios, TokenService) e `API` (controllers, middleware, DI). As dependências sempre apontam para dentro.

**Repository Pattern** - os serviços da Application falam só com interfaces (`IUserRepository`, `ITaskRepository`). Facilita trocar a implementação sem mexer na regra de negócio.

**JWT + Refresh Token com rotação** - access token de 15 minutos, refresh token de 7 dias armazenado no banco. A cada uso do refresh token o anterior é revogado e um novo é gerado. O interceptor do Angular faz o refresh silencioso automaticamente quando recebe 401.

**Angular Signals** - escolhi Signals em vez de NgRx. O estado local de cada componente vive em signals, com `computed()` pra derivar as colunas do Kanban.

**Middleware de exceção global** - um único `ExceptionHandlerMiddleware` captura todos os erros e retorna JSON padronizado. Os controllers não têm try/catch nenhum.

**`DeleteBehavior.Restrict` em Tasks** - o banco não deixa deletar um usuário que ainda tem tarefas ativas. A validação acontece no serviço antes de chegar no banco, mas a constraint existe como segunda linha de defesa.

---

## O que ficou pendente

- Testes não foram implementados (o `skipTests: true` no `angular.json` já entrega isso). Com mais tempo entraria pelo menos uns testes de serviço no backend usando xUnit + mock dos repositórios.

- Sem paginação nas listagens, retorna tudo de uma vez. Pra uma demo funciona, em produção precisaria de cursor ou page/size.
  
# Obrigado por ler até aqui!
