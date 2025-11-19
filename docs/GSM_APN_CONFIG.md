# 📡 Configuração do APN para Dispositivos GSM

Este documento explica como configurar o APN (Access Point Name) nos dispositivos GSM para que se conectem ao servidor TCP.

## 🔧 Configuração do Servidor

O servidor GSM TCP está configurado para escutar na porta definida em `GSM_PORT` (padrão: `3001`).

### Variáveis de Ambiente

```env
GSM_PORT=3001          # Porta TCP onde o servidor escuta
GSM_HOST=0.0.0.0      # 0.0.0.0 = todas as interfaces, ou IP específico
```

### Como Descobrir o IP do Servidor

#### Desenvolvimento Local
- **IP Local**: Use o IP da sua máquina na rede local
  - Linux/Mac: `ifconfig` ou `ip addr`
  - Windows: `ipconfig`
  - Exemplo: `192.168.1.100:3001`

#### Produção
- **IP Público**: Use o IP público do servidor (se exposto diretamente)
- **Domínio**: Se tiver um domínio apontando para o servidor
- **Load Balancer**: Se usar um load balancer, configure o IP do LB

## 📱 Configuração no APN

No dispositivo GSM, configure o APN com:

### Formato
```
IP:PORTA
```

### Exemplos

#### Desenvolvimento
```
192.168.1.100:3001
```

#### Produção (IP Público)
```
203.0.113.1:3001
```

#### Produção (com Domínio)
Se você configurar um DNS apontando para o servidor:
```
servidor.gpt-spycloud.com:3001
```

> **Nota**: Alguns dispositivos podem não aceitar domínio, apenas IP. Nesse caso, use o IP público.

## 🔍 Como Descobrir o IP Público do Servidor

### Linux/Mac
```bash
curl ifconfig.me
# ou
curl ipinfo.io/ip
```

### Verificar se a Porta está Acessível
```bash
# Teste local
telnet localhost 3001

# Teste remoto (substitua pelo IP)
telnet 192.168.1.100 3001
```

## 🛡️ Firewall e Rede

### Portas que Precisam Estar Abertas

1. **Porta GSM TCP** (`GSM_PORT`, padrão 3001)
   - Deve estar acessível pelos dispositivos GSM
   - TCP (não UDP)

### Configuração de Firewall

#### UFW (Ubuntu)
```bash
sudo ufw allow 3001/tcp
```

#### Firewalld (CentOS/RHEL)
```bash
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

#### AWS Security Group
- Adicione regra de entrada:
  - Type: Custom TCP
  - Port: 3001
  - Source: 0.0.0.0/0 (ou IPs específicos dos dispositivos)

#### Cloud Providers
- Configure as regras de firewall/security group para permitir conexões TCP na porta 3001

## 📋 Checklist de Configuração

- [ ] Servidor está rodando e escutando na porta configurada
- [ ] Porta está aberta no firewall
- [ ] IP/domínio está acessível da rede dos dispositivos
- [ ] APN configurado no dispositivo com formato `IP:PORTA`
- [ ] Dispositivo consegue estabelecer conexão TCP
- [ ] Logs do servidor mostram conexões recebidas

## 🧪 Teste de Conexão

### Usando netcat (nc)
```bash
# No servidor, escute na porta
nc -l 3001

# Em outro terminal/máquina, conecte
nc <IP_DO_SERVIDOR> 3001
```

### Usando telnet
```bash
telnet <IP_DO_SERVIDOR> 3001
```

### Simular Mensagem GSM
```bash
# Conecte e envie uma mensagem de teste
echo "IMEI:123456789|LAT:-23.5505|LON:-46.6333|SPD:60|IGN:1" | nc <IP_DO_SERVIDOR> 3001
```

## 🔐 Segurança

### Recomendações

1. **IP Whitelist**: Se possível, restrinja conexões apenas de IPs conhecidos
2. **VPN**: Use VPN para conectar dispositivos ao servidor
3. **Autenticação**: Implemente autenticação no nível de protocolo (ex: token no início da conexão)
4. **Rate Limiting**: Implemente rate limiting para evitar abuso

### Exemplo de Restrição por IP (Futuro)

```typescript
// Em gsmServer.ts, adicionar validação de IP
const allowedIPs = ['192.168.1.0/24', '10.0.0.0/8'];

socket.on('connect', () => {
  if (!isIPAllowed(socket.remoteAddress, allowedIPs)) {
    socket.destroy();
    return;
  }
  // ... resto do código
});
```

## 📊 Monitoramento

### Logs do Servidor

O servidor registra:
- Conexões estabelecidas
- Mensagens recebidas
- Erros de processamento
- Desconexões

### Exemplo de Log
```
📡 GSM TCP server running on 0.0.0.0:3001
{"level":30,"time":1705312200000,"msg":"GSM client connected","address":"192.168.1.50:54321"}
{"level":30,"time":1705312201000,"msg":"GSM message processed successfully","messageId":"..."}
```

## 🚨 Troubleshooting

### Dispositivo não conecta

1. **Verificar se servidor está rodando**
   ```bash
   netstat -tuln | grep 3001
   # ou
   ss -tuln | grep 3001
   ```

2. **Verificar firewall**
   ```bash
   sudo iptables -L -n | grep 3001
   ```

3. **Verificar se porta está acessível externamente**
   ```bash
   # De outra máquina
   telnet <IP_SERVIDOR> 3001
   ```

4. **Verificar logs do servidor**
   - Procure por erros de conexão
   - Verifique se há tentativas de conexão sendo bloqueadas

### Mensagens não chegam

1. **Verificar formato da mensagem**
   - O servidor espera mensagens terminadas com `\n` ou `\r\n`
   - Verifique se o dispositivo está enviando no formato correto

2. **Verificar decoders**
   - Confirme que o modelo do dispositivo está configurado
   - Verifique se o decoder está implementado

3. **Verificar logs**
   - Procure por erros de processamento
   - Verifique se as mensagens estão sendo salvas em `ingress_messages_raw`

## 📚 Referências

- [Node.js net module](https://nodejs.org/api/net.html)
- [TCP/IP Basics](https://en.wikipedia.org/wiki/Transmission_Control_Protocol)
- [APN Configuration](https://en.wikipedia.org/wiki/Access_Point_Name)

---

**Última atualização**: 2024-01-15

