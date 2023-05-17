import dotenv from 'dotenv'
import {RedisOptions} from 'ioredis'

dotenv.config();

const environment = {
    development: {
        port: parseInt(process.env.REDIS_DEV_PORT),
        host: process.env.REDIS_DEV_HOST,
        protocol: process.env.REDIS_DEV_PROTOCOL,
        db: process.env.REDIS_DEV_DB,
        username: process.env.REDIS_DEV_USERNAME,
        password: process.env.REDIS_DEV_PASSWORD
    },
    production: {
        port: parseInt(process.env.REDIS_PROD_PORT),
        host: process.env.REDIS_PROD_HOST,
        protocol: process.env.REDIS_PROD_PROTOCOL,
        db: process.env.REDIS_PROD_DB,
        username: process.env.REDIS_PROD_USERNAME,
        password: process.env.REDIS_PROD_PASSWORD
    },
    test: {
        port: parseInt(process.env.REDIS_PORT),
        host: process.env.REDIS_HOST,
        protocol: process.env.REDIS_PROTOCOL,
        db: process.env.REDIS_DB,
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD
    }
}

export const redisConfig: RedisOptions = environment[process.env.NODE_ENV] ? environment[process.env.NODE_ENV] : environment.test;

export interface setRedis {
    success: boolean,
    message?: string,
    stored?: any
}

export interface getRedis {
    success: boolean,
    message?: string,
    value?: any
}