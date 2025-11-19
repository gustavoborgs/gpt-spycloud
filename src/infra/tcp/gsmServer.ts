import { createServer, Server, Socket } from 'net';
import { logger } from '../../config/logger';

export function createGsmServer(
  onMessage: (rawPayload: string, sourceIdentifier: string) => Promise<void>
): Server {
  const server = createServer((socket: Socket) => {
    const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
    logger.info({ address: clientAddress }, 'GSM client connected');

    let textBuffer = '';

    socket.on('data', async (data: Buffer) => {
      // The device sends data as text/string (base64)
      // Convert buffer to string and accumulate
      const textData = data.toString('utf8');
      textBuffer += textData;

      // Process complete messages (messages may end with \n or \r\n)
      const lines = textBuffer.split(/\r?\n/);
      textBuffer = lines.pop() || ''; // Keep incomplete line in buffer

      // Process each complete line
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.length === 0) continue;

        try {
          // Pass the raw string (base64) and source identifier to the handler
          // It will be converted to buffer/hex in the decoder
          await onMessage(trimmedLine, clientAddress);
        } catch (error) {
          logger.error({ error, line: trimmedLine, lineLength: trimmedLine.length }, 'Error processing GSM message');
        }
      }

      // If buffer has data but no newlines, process it anyway (for binary protocols without delimiters)
      if (textBuffer.length > 0 && !textBuffer.includes('\n') && !textBuffer.includes('\r')) {
        try {
          const trimmedBuffer = textBuffer.trim();
          if (trimmedBuffer.length > 0) {
            await onMessage(trimmedBuffer, clientAddress);
            
            // Clear buffer after processing
            textBuffer = '';
          }
        } catch (error) {
          logger.error({ error, buffer: textBuffer, bufferLength: textBuffer.length }, 'Error processing GSM buffer');
          textBuffer = '';
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

