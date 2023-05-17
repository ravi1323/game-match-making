import { createAdapter } from '@socket.io/redis-adapter';
import { pubClient, subClient } from './redis.service.js';
import { httpServer } from './http.service.js';
import { Server, Socket } from 'socket.io';
import { CONSTANTS } from '../config/constants.config.js'
import { SocketHandler } from '../handlers/index.handler.js';

export var IO: Server = null;
export var SocketBroadCast : any = null;

export const initSocketConnection = async () : Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            IO = new Server(httpServer);
            IO.adapter(createAdapter(pubClient, subClient));

            IO.on(CONSTANTS.SOCKET.EVENTS.CORE.CONNECTION, async (socket: Socket) => {
                SocketBroadCast = socket.broadcast;

                await SocketHandler(socket);
            })
            global.logger.info(`Socket connection established successfully ✔`);
            resolve();
        } catch(e) {
            global.logger.error(`socket failed : ${e.message}`)
        }
    })
}