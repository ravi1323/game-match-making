import {Redis} from 'ioredis';
import { getRedis, redisConfig, setRedis } from '../config/redis.config.js';
import logger from '../log/logger.js';

export var redisClient: any = null;
export var pubClient: any = null;
export var subClient: any = null;

export const connectToRedis = () => {
    return new Promise( async (resolve, reject) => {
        try {
            const client = new Redis(redisConfig);
            const subClientI = client.duplicate();

            redisClient = client;
            pubClient = client;
            subClient = subClientI;

            client.on("error", (e: Error) => {
                logger.error(e);
                process.exit(0);
            })

            subClient.on("error", (e : Error) => {
                logger.error(e);
                process.exit(0);
            })

            global.logger.info('Redis connection established successfully ✔')
            resolve(true);
        } catch(e) {
            logger.error(`Redis connection failed : ${e.message}`);
        }
    })
}

export const redisSetKeyValue = async (key: string, value: any, isJson: boolean = false) : Promise<setRedis> => {
    return new Promise(async (resolve, reject) => {
        try {
            value = isJson ? JSON.stringify(value) : value;
            const stored = await redisClient.set(key, value)
            
            if (stored === 'OK') {
                resolve({
                    success: true,
                    stored: isJson ? JSON.parse(value) : value
                })
            } else {
                reject({
                    success: false,
                    message: 'failed storing value on redis server'
                })
            }
        } catch(e) {
            reject({
                success: false,
                message: e.message
            })
        }
    })
}

export const redisGetKeyValue = async (key: string, isJson: boolean = false) : Promise<getRedis> => {
    return new Promise(async (resolve, reject) => {
        try {
            var value = await redisClient.get(key)

            if (value) {
                if (isJson) value = JSON.parse(value)

                resolve({
                    success: true,
                    value
                })
            } else {
                reject({
                    success: false,
                    message: 'not found'
                })
            }
        } catch(e) {
            reject({
                success: false,
                message: `redis failed : ${e.message}`
            })
        }
    })
}