# TaskFlow — CRUD C# + .NET

API REST em .NET 9 com frontend Angular 21 para gerenciamento de tarefas em formato Kanban. O backend usa Clean Architecture, autenticação JWT com rotação de refresh tokens e autorização por papel e proprietário.

## Stack

- .NET 9, ASP.NET Core, Entity Framework Core e PostgreSQL
- Angular 21 com standalone components e Signals
- Docker Compose

## Configuração segura

Nenhuma credencial padrão é criada. Copie `.env.example` para `.env` e preencha valores únicos:

```text
DB_PASSWORD=<senha forte e exclusiva>
JWT_SECRET=<segredo aleatório com pelo menos 32 caracteres>
ALLOWED_ORIGIN=http://localhost:4200
```

O arquivo `.env` é ignorado pelo Git. Em produção, forneça as mesmas configurações pelo gerenciador de segredos da plataforma. Nunca reutilize valores de desenvolvimento.

## Executar com Docker

```bash
docker compose up --build
```

A API fica disponível em `http://localhost:5000`. Para iniciar o frontend com o proxy local:

```bash
cd frontend
npm ci
npm start
```

Acesse `http://localhost:4200`.

## Executar sem Docker

Instale o .NET 9 SDK e PostgreSQL. Configure `ConnectionStrings__DefaultConnection` e `Jwt__SecretKey` no ambiente antes de iniciar:

```bash
cd src/TaskFlow.API
dotnet run
```

As migrations são aplicadas no início da API. Faça backup do banco antes de uma implantação.

## Primeiro administrador

O sistema não promove contas pelo e-mail e não inclui senha administrativa conhecida. Após cadastrar a primeira conta, um operador autorizado deve definir `IsAdmin = true` diretamente no banco usando uma conexão administrativa auditada. Reinicie a sessão desse usuário para emitir um JWT com o papel `Admin`.

Se uma versão anterior foi executada, invalide o segredo JWT antigo, troque a senha do banco se ela tiver sido reutilizada e revise ou desative a antiga conta de demonstração. Os refresh tokens antigos em texto puro continuam aceitos apenas durante a janela de migração; ao serem usados, são substituídos por tokens armazenados como hash.

## Controles de segurança

- Usuários comuns acessam apenas as próprias tarefas.
- Operações de usuários, atribuição de tarefas e visualização global exigem o papel `Admin`.
- Login, cadastro e refresh têm limitação de requisições.
- Origem CORS é uma allowlist explícita.
- Segredos obrigatórios falham de forma segura quando ausentes.
- Refresh tokens são armazenados como SHA-256 e revogados atomicamente.
- O frontend mantém tokens somente durante a sessão da aba.

## Validação

O workflow de CI restaura e compila o backend, verifica pacotes vulneráveis e compila/audita o frontend. O projeto ainda não possui suíte de testes automatizados; esse é o principal débito técnico restante.
