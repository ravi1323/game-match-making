import * as PinoLogger from 'pino';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pinom from 'pino-multi-stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const streams = [
    { stream: process.stdout },
    { stream: fs.createWriteStream(`${__dirname}/../../logs/info.log`, { flags: 'a' }) },
]

export default PinoLogger.pino(
  {
    level: process.env.PINO_LOG_LEVEL || 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: "SYS:dd-mm-yyyy HH:MM:ss",
            ignore: 'pid,hostname'
        }
    }
  },
  pinom.multistream(streams)
); 