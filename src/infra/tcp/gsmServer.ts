import { createServer, Server, Socket } from 'net';
import { logger } from '../../config/logger';

export interface GsmMessage {
  raw: string;
  source: string;
  receivedAt: Date;
}

export function createGsmServer(onMessage: (message: GsmMessage) => Promise<void>): Server {
  const server = createServer((socket: Socket) => {
    const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
    logger.info({ address: clientAddress }, 'GSM client connected');

    let buffer = '';

    socket.on('data', async (data: Buffer) => {
      buffer += data.toString();

      // Process complete messages (assuming messages end with \n or \r\n)
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            await onMessage({
              raw: line.trim(),
              source: clientAddress,
              receivedAt: new Date(),
            });
          } catch (error) {
            logger.error({ error, line }, 'Error processing GSM message');
          }
        }
      }
    });

    socket.on('error', (error) => {
      logger.error({ error, address: clientAddress }, 'GSM socket error');
    });

    socket.on('close', () => {
      logger.info({ address: clientAddress }, 'GSM client disconnected');
    });
  });

  server.on('error', (error) => {
    logger.error({ error }, 'GSM server error');
  });

  return server;
}

