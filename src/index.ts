import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { connectToRedis } from './services/redis.service.js';
import logger from './log/logger.js'
import { initializeServer } from './services/http.service.js';
import { initSocketConnection } from './services/socket.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

global.logger = logger;

process.on("uncaughtException", function (err) {
    logger.error(err);
});

process.on("unhandledRejection", function (err) {
    logger.error(err);
});

try {
    connectToRedis().then(() => {
        initializeServer().then(() => {
            initSocketConnection().then(() => {
                logger.info(`checked: Redis, HttpServer, Socket connection ✔`);
                logger.info(`__---__---__---__---__---__---__---__---__---__---__---__---__---__---__---__---__---__---__---__---__---__`)
            }).catch((e: Error) => {
                logger.error(e)
            })
        }).catch((e : Error) => {
            logger.error(e)
        })
    }).catch((e : Error) => {
        logger.error(e);
    })

    // Promise.all([
    //     connectToRedis(),
    //     initializeServer(),
    //     initSocketConnection()
    // ]).then(() => {
    //     logger.info(`checked: Redis, HttpServer, Socket connection ✔`);
    //     logger.info(`__---__---__---__---__---__---__---__---__---__---__---__---__---__---__---__---__---__---__---__---__---__`)
    // }).catch((e : Error) => {
    //     logger.error(e);
    //     process.exit(0);
    // })
} catch(e) {
    logger.error(e);
}