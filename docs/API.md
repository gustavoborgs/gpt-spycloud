# 📡 API Documentation

Documentação completa das APIs disponíveis para integração com o frontend.

## Base URL

```
http://localhost:3000/api
```

Em produção, substitua pelo domínio do servidor.

## Autenticação

A maioria das rotas requer autenticação via JWT. Inclua o token no header:

```
Authorization: Bearer <token>
```

> **Nota**: Atualmente, a autenticação está implementada mas não é obrigatória em todas as rotas. Configure o middleware `authMiddleware` nas rotas que precisam de proteção.

## Formato de Resposta

Todas as respostas seguem o formato padrão:

### Sucesso
```json
{
  "success": true,
  "data": { ... }
}
```

### Erro
```json
{
  "success": false,
  "error": "Mensagem de erro"
}
```

### Erro de Validação
```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "path": ["field"],
      "message": "Mensagem de validação"
    }
  ]
}
```

## Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida
- `401` - Não autenticado
- `403` - Não autorizado
- `404` - Recurso não encontrado
- `409` - Conflito (ex: recurso já existe)
- `422` - Erro de validação
- `500` - Erro interno do servidor

---

## 🔧 Health Check

Verifica o status do servidor.

### `GET /health`

**Autenticação**: Não requerida

**Resposta 200**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 12345.67
}
```

---

## 📱 Devices

Gerenciamento de dispositivos físicos.

### `POST /api/devices`

Cria um novo dispositivo.

**Autenticação**: Recomendada

**Body**:
```json
{
  "serialNumber": "DEV001",
  "modelId": "MODEL_A",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "assetId": "660e8400-e29b-41d4-a716-446655440000", // Opcional
  "status": "INACTIVE", // INACTIVE | ACTIVE | SUSPENDED | MAINTENANCE
  "type": "TRACKER", // TRACKER | SENSOR | GATEWAY
  "metadata": { // Opcional
    "firmware": "1.0.0",
    "notes": "Dispositivo instalado no veículo ABC-1234"
  }
}
```

**Resposta 201**:
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "serialNumber": "DEV001",
    "modelId": "MODEL_A",
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "assetId": "660e8400-e29b-41d4-a716-446655440000",
    "status": "INACTIVE",
    "type": "TRACKER",
    "metadata": {
      "firmware": "1.0.0",
      "notes": "Dispositivo instalado no veículo ABC-1234"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Erros**:
- `400` - Dados inválidos
- `409` - Serial number já existe
- `400` - Modelo de dispositivo inválido

**Exemplo cURL**:
```bash
curl -X POST http://localhost:3000/api/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "serialNumber": "DEV001",
    "modelId": "MODEL_A",
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "type": "TRACKER",
    "status": "INACTIVE"
  }'
```

---

### `GET /api/devices`

Lista dispositivos com filtros e paginação.

**Autenticação**: Recomendada

**Query Parameters**:
- `page` (number, opcional) - Número da página (padrão: 1)
- `limit` (number, opcional) - Itens por página (padrão: 10, máximo: 100)
- `tenantId` (string, opcional) - Filtrar por tenant
- `assetId` (string, opcional) - Filtrar por asset vinculado
- `status` (string, opcional) - Filtrar por status (INACTIVE, ACTIVE, SUSPENDED, MAINTENANCE)

**Resposta 200**:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "serialNumber": "DEV001",
        "modelId": "MODEL_A",
        "tenantId": "550e8400-e29b-41d4-a716-446655440000",
        "assetId": "660e8400-e29b-41d4-a716-446655440000",
        "status": "ACTIVE",
        "type": "TRACKER",
        "metadata": null,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

**Exemplo cURL**:
```bash
curl -X GET "http://localhost:3000/api/devices?page=1&limit=10&status=ACTIVE" \
  -H "Authorization: Bearer <token>"
```

---

### `POST /api/devices/:id/bind`

Vincula um dispositivo a um asset (veículo, carga, etc.).

**Autenticação**: Recomendada

**URL Parameters**:
- `id` (string) - ID do dispositivo

**Body**:
```json
{
  "assetId": "660e8400-e29b-41d4-a716-446655440000"
}
```

**Resposta 200**:
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "serialNumber": "DEV001",
    "modelId": "MODEL_A",
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "assetId": "660e8400-e29b-41d4-a716-446655440000",
    "status": "ACTIVE",
    "type": "TRACKER",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

**Erros**:
- `404` - Dispositivo não encontrado
- `409` - Dispositivo já está vinculado a outro asset

**Exemplo cURL**:
```bash
curl -X POST http://localhost:3000/api/devices/770e8400-e29b-41d4-a716-446655440000/bind \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "assetId": "660e8400-e29b-41d4-a716-446655440000"
  }'
```

---

## 📥 Ingest

Endpoints para ingestão de dados brutos de dispositivos.

### `POST /api/ingest/webhooks/everynet`

Recebe webhooks da Everynet (LoRaWAN).

**Autenticação**: Não requerida (webhook externo)

**Body**: Payload da Everynet (formato varia conforme configuração)

**Resposta 200**:
```json
{
  "success": true,
  "messageId": "880e8400-e29b-41d4-a716-446655440000"
}
```

**Erros**:
- `400` - Payload inválido
- `500` - Erro ao processar mensagem

**Exemplo de Payload Everynet**:
```json
{
  "dev_eui": "0011223344556677",
  "gateway_id": "AA11223344556677",
  "timestamp": 1705312200,
  "payload": "base64_encoded_payload",
  "rssi": -120,
  "snr": 5.5
}
```

> **Nota**: Este endpoint é usado pela Everynet para enviar dados. Não é necessário chamá-lo diretamente do frontend.

---

### GSM TCP Server (APN)

Para dispositivos GSM, configure o APN para conectar via TCP.

**Configuração no APN do Dispositivo**:
```
<IP_DO_SERVIDOR>:<PORTA>
```

**Exemplo**:
```
192.168.1.100:3001
```

**Porta Padrão**: `3001` (configurável via `GSM_PORT`)

**Formato de Mensagem**:
- Mensagens devem terminar com `\n` ou `\r\n`
- O servidor processa cada linha como uma mensagem separada

**Exemplo de Mensagem GSM**:
```
IMEI:123456789|LAT:-23.5505|LON:-46.6333|SPD:60|IGN:1
```

> **📚 Documentação Completa**: Veja [docs/GSM_APN_CONFIG.md](./docs/GSM_APN_CONFIG.md) para instruções detalhadas de configuração do APN, firewall, troubleshooting e segurança.

---

## 📊 Telemetry

> **Status**: Endpoints de telemetria serão implementados em breve.

Endpoints planejados:
- `GET /api/telemetry` - Listar pontos de telemetria
- `GET /api/telemetry/:deviceId/last` - Última posição do dispositivo
- `GET /api/telemetry/:deviceId/history` - Histórico de posições

---

## 🔔 Events

> **Status**: Endpoints de eventos serão implementados em breve.

Endpoints planejados:
- `GET /api/events` - Listar eventos
- `GET /api/events/:deviceId` - Eventos de um dispositivo
- `GET /api/events/:eventId` - Detalhes de um evento

---

## ⚠️ Alerts

> **Status**: Endpoints de alertas serão implementados em breve.

Endpoints planejados:
- `GET /api/alerts/rules` - Listar regras de alerta
- `POST /api/alerts/rules` - Criar regra de alerta
- `GET /api/alerts/notifications` - Listar notificações
- `PUT /api/alerts/notifications/:id/read` - Marcar notificação como lida

---

## 📝 Enums e Constantes

### DeviceStatus
```typescript
enum DeviceStatus {
  INACTIVE = 'INACTIVE',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  MAINTENANCE = 'MAINTENANCE'
}
```

### DeviceType
```typescript
enum DeviceType {
  TRACKER = 'TRACKER',
  SENSOR = 'SENSOR',
  GATEWAY = 'GATEWAY'
}
```

### Modelos de Dispositivo Suportados
- `MODEL_A` - Modelo A (GSM)
- `MODEL_B` - Modelo B (GSM)
- `LORA_MODEL_1` - Modelo LoRa 1

---

## 🔒 Segurança

### Autenticação JWT

Para rotas protegidas, inclua o token JWT no header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Rate Limiting

> **Nota**: Rate limiting será implementado em breve.

---

## 🐛 Tratamento de Erros

### Erros Comuns

#### 400 - Bad Request
```json
{
  "success": false,
  "error": "Dados inválidos",
  "details": [
    {
      "path": ["serialNumber"],
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

#### 404 - Not Found
```json
{
  "success": false,
  "error": "Device with identifier 123 not found"
}
```

#### 409 - Conflict
```json
{
  "success": false,
  "error": "Device with this serial number already exists"
}
```

#### 500 - Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

Em desenvolvimento, a mensagem de erro inclui detalhes. Em produção, apenas "Internal server error" é retornado.

---

## 📚 Exemplos de Integração

### JavaScript/TypeScript (Fetch API)

```typescript
const API_BASE_URL = 'http://localhost:3000/api';

// Criar dispositivo
async function createDevice(deviceData: any) {
  const response = await fetch(`${API_BASE_URL}/devices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(deviceData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}

// Listar dispositivos
async function listDevices(filters?: {
  page?: number;
  limit?: number;
  tenantId?: string;
  status?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.tenantId) params.append('tenantId', filters.tenantId);
  if (filters?.status) params.append('status', filters.status);

  const response = await fetch(`${API_BASE_URL}/devices?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.json();
}
```

### Axios

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Adicionar token nas requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Criar dispositivo
const createDevice = async (deviceData: any) => {
  const { data } = await api.post('/devices', deviceData);
  return data;
};

// Listar dispositivos
const listDevices = async (filters?: any) => {
  const { data } = await api.get('/devices', { params: filters });
  return data;
};
```

---

## 🔄 Changelog

### v1.0.0 (2024-01-15)
- ✅ Health check endpoint
- ✅ Devices CRUD
- ✅ Ingest webhook (Everynet)
- 📝 Telemetry endpoints (planejado)
- 📝 Events endpoints (planejado)
- 📝 Alerts endpoints (planejado)

---

## 📞 Suporte

Para dúvidas ou problemas com a API, consulte:
- README.md - Documentação geral do projeto
- Issues no repositório
- Logs do servidor para debugging

---

**Última atualização**: 2024-01-15

