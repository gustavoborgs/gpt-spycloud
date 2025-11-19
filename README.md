# GPT Spycloud - Backend Modular

Backend escalável e modular para rastreamento de dispositivos IoT (GSM + LoRa), construído com Node.js, TypeScript e Prisma, seguindo princípios de DDD (Domain-Driven Design) e Clean Architecture.

## 🎯 Características

- **Modular**: Cada domínio isolado e independente
- **Escalável**: Estrutura preparada para crescimento
- **Pronto para microserviços**: Começa como monólito organizado, fácil de separar
- **Suporte GSM + LoRa**: Decoders para diferentes protocolos
- **Event-driven**: Sistema de eventos e alertas
- **Type-safe**: TypeScript em todo o código

## 🏗️ Arquitetura

O projeto segue uma arquitetura em camadas com separação clara de responsabilidades:

```
src/
├── config/          # Configurações centralizadas (env, db, logger, etc.)
├── core/            # Núcleo compartilhado (Entity, ValueObject, UseCase, etc.)
├── infra/           # Infraestrutura compartilhada (HTTP, TCP, DB, Security)
├── modules/         # Módulos de domínio (devices, ingest, telemetry, etc.)
├── shared/          # Utilitários e constantes genéricas
└── main.ts          # Ponto de entrada da aplicação
```

### Estrutura de um Módulo

Cada módulo segue o padrão:

```
modules/[nome]/
├── domain/          # Entidades e regras de negócio puras
├── application/     # Casos de uso (orquestram domain + repos)
├── infra/           # Implementações técnicas (repos, mappers, decoders)
└── presentation/    # Camada de apresentação (HTTP, TCP)
```

## 📦 Módulos Implementados

### ✅ Devices
Gerenciamento de dispositivos físicos e modelos.

- CRUD de dispositivos
- Vinculação a assets
- Validação de modelos

### ✅ Ingest
Ingestão de mensagens brutas de diferentes fontes.

- **GSM (APN)**: Servidor TCP para receber mensagens
- **LoRa (Everynet)**: Webhook HTTP
- Decoders para diferentes modelos de dispositivos
- Armazenamento de mensagens brutas

### ✅ Telemetry
Armazenamento e consulta de telemetria decodificada.

- Salvamento de pontos de telemetria
- Consulta de última posição
- Query com filtros e paginação

### ✅ Events
Geração de eventos de negócio a partir de telemetria.

- Detecção de eventos (ignição, velocidade, etc.)
- Armazenamento de eventos
- Integração com sistema de alertas

### ✅ Alerts
Sistema de regras e notificações.

- Criação de regras de alerta
- Avaliação automática de eventos
- Notificações (webhook, email, etc.)

## 🚀 Instalação

1. **Clone o repositório**
```bash
git clone <repo-url>
cd gpt-spycloud
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
NODE_ENV=development
HTTP_PORT=3000
GSM_PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/dbname?schema=public
JWT_SECRET=your-secret-key-min-32-chars
LOG_LEVEL=info
```

4. **Configure o banco de dados**
```bash
# Gerar cliente Prisma
npm run prisma:generate

# Executar migrações
npm run prisma:migrate

# (Opcional) Popular com dados iniciais
npm run prisma:seed
```

## 🏃 Executando

### Desenvolvimento
```bash
npm run dev
```

Isso inicia:
- **HTTP Server** na porta 3000 (configurável via `HTTP_PORT`)
- **GSM TCP Server** na porta 3001 (configurável via `GSM_PORT`)

### Produção
```bash
npm run build
npm start
```

## 📡 Endpoints

> **📚 Documentação Completa**: Veja [API.md](./API.md) para documentação detalhada de todas as APIs com exemplos de request/response, códigos de erro e exemplos de integração.

### Health Check
```
GET /health
```

### Devices
```
POST   /api/devices              # Criar dispositivo
GET    /api/devices              # Listar dispositivos
POST   /api/devices/:id/bind     # Vincular dispositivo a asset
```

### Ingest
```
POST   /api/ingest/webhooks/everynet  # Webhook LoRa (Everynet)
```

**GSM**: Conecte via TCP na porta configurada em `GSM_PORT`

### Documentação da API

A documentação completa está disponível em [API.md](./API.md) e inclui:
- ✅ Todos os endpoints disponíveis
- ✅ Exemplos de request/response
- ✅ Códigos de status HTTP
- ✅ Tratamento de erros
- ✅ Exemplos de integração (JavaScript, TypeScript, Axios)
- ✅ Enums e constantes

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia em modo desenvolvimento com hot-reload
- `npm run build` - Compila TypeScript para JavaScript
- `npm start` - Inicia em produção
- `npm run prisma:generate` - Gera cliente Prisma
- `npm run prisma:migrate` - Executa migrações
- `npm run prisma:studio` - Abre Prisma Studio (interface visual)
- `npm run prisma:seed` - Executa seed do banco

## 🏗️ Criando um Novo Módulo

1. **Crie a estrutura de pastas**:
```
src/modules/[nome]/
├── domain/
│   ├── [Nome].ts
│   └── enums.ts
├── application/
│   ├── use-cases/
│   └── dtos/
├── infra/
│   ├── repositories/
│   └── mappers/
└── presentation/
    └── http/
```

2. **Siga o padrão do módulo `devices`** como referência

3. **Adicione as rotas** em `src/infra/http/routes.ts`

4. **Adicione os modelos** no `prisma/schema.prisma` se necessário

## 🔌 Integrações

### GSM (APN)
O servidor TCP escuta na porta configurada (`GSM_PORT`, padrão: 3001) e processa mensagens brutas. Os decoders são selecionados automaticamente baseado no modelo do dispositivo.

**Configuração no APN do Dispositivo**:
```
<IP_DO_SERVIDOR>:<PORTA>
```
Exemplo: `192.168.1.100:3001` ou `203.0.113.1:3001`

> **📚 Guia Completo**: Veja [docs/GSM_APN_CONFIG.md](./docs/GSM_APN_CONFIG.md) para instruções detalhadas de configuração, firewall, troubleshooting e segurança.

### LoRa (Everynet)
Configure o webhook da Everynet para apontar para:
```
POST https://seu-dominio.com/api/ingest/webhooks/everynet
```

## 📊 Fluxo de Dados

1. **Ingestão**: Mensagens brutas chegam via GSM (TCP) ou LoRa (HTTP)
2. **Decodificação**: Decoders específicos por modelo processam as mensagens
3. **Telemetria**: Dados decodificados são salvos como pontos de telemetria
4. **Eventos**: Sistema detecta eventos (ignição, velocidade, etc.)
5. **Alertas**: Regras de alerta são avaliadas e notificações são enviadas

## 🗄️ Banco de Dados

O projeto usa **PostgreSQL** com **Prisma ORM**.

### Modelos Principais

- `Tenant` - Organizações/clientes
- `User` - Usuários do sistema
- `Device` - Dispositivos físicos
- `Asset` - Veículos, cargas, etc.
- `IngressMessageRaw` - Mensagens brutas recebidas
- `TelemetryPoint` - Pontos de telemetria decodificados
- `Event` - Eventos de negócio
- `AlertRule` - Regras de alerta
- `AlertNotification` - Notificações enviadas

## 🔐 Segurança

- Validação de entrada com Zod
- Autenticação JWT (middleware em `infra/http/middlewares/auth.ts`)
- Helmet para segurança HTTP
- CORS configurável

## 📝 Logging

O projeto usa **Pino** para logging estruturado. Em desenvolvimento, logs são formatados com `pino-pretty`.

Níveis de log configuráveis via `LOG_LEVEL`:
- `fatal`, `error`, `warn`, `info`, `debug`, `trace`

## 🧪 Testes

Estrutura preparada para testes em `src/tests/` (a implementar).

## 📄 Licença

ISC

## 🤝 Contribuindo

1. Siga a estrutura modular estabelecida
2. Mantenha a separação de camadas (domain, application, infra, presentation)
3. Use TypeScript com tipagem forte
4. Documente casos de uso complexos

---

**Desenvolvido com ❤️ seguindo princípios de Clean Architecture e DDD**
