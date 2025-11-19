import { createServer, Server, Socket } from 'net';
import { logger } from '../../config/logger';

export interface GsmMessage {
  raw: string; // Payload as hex or base64 string
  rawBuffer: Buffer; // Original binary buffer
  source: string;
  receivedAt: Date;
}

export function createGsmServer(onMessage: (message: GsmMessage) => Promise<void>): Server {
  const server = createServer((socket: Socket) => {
    const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
    logger.info({ address: clientAddress }, 'GSM client connected');

    let buffer = Buffer.alloc(0);

    socket.on('data', async (data: Buffer) => {
      // Accumulate binary data
      buffer = Buffer.concat([buffer, data]);

      // For binary protocols, we might need to detect message boundaries
      // For IscaFK, messages can be variable length, so we'll process each data chunk
      // In production, you might want to implement proper framing (e.g., length prefix, delimiter)
      
      // For now, process each received chunk as a complete message
      // This works if the device sends one message per TCP packet
      if (buffer.length > 0) {
        try {
          // Convert to hex string (most common format for binary protocols)
          // The decoder will detect if it's hex or base64 and handle accordingly
          const hexString = buffer.toString('hex');
          
          // Use hex as default, but decoder can handle both hex and base64
          await onMessage({
            raw: hexString, // Default to hex
            rawBuffer: Buffer.from(buffer), // Keep original buffer
            source: clientAddress,
            receivedAt: new Date(),
          });
          
          // Clear buffer after processing
          buffer = Buffer.alloc(0);
        } catch (error) {
          logger.error({ error, bufferLength: buffer.length }, 'Error processing GSM message');
          // Clear buffer on error to prevent accumulation
          buffer = Buffer.alloc(0);
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

