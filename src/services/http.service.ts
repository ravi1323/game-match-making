import http from 'http';
import https from 'https';
import express from 'express';
import fs from 'fs'
import {dirname, join} from 'path'
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export var httpServer : any = null;

export const initializeServer = async () : Promise<void> => {
    return new Promise((resolve, reject) => {
        try {
            const app = express();
            const server = process.env.ENV === 'production' ? https.createServer({
                key: fs.readFileSync(join(__dirname, '../../ssl/key.pem')),
                cert: fs.readFileSync(join(__dirname, '../../ssl/cert.pem'))
            }, app) : http.createServer(app);

            const port = process.env.PORT === 'production' ? process.env.PROD_PORT : process.env.DEV_PORT || 3000

            server.listen(port, () => {
                global.logger.info(`Server is running on port: ${port} successfully ✔`)
                httpServer = server;
                resolve();
            })
        } catch(e) {
            reject(e);
        }
    })
}