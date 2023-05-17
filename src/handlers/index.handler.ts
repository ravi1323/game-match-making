import { Socket } from 'socket.io'
import { convertStringtoObject } from '../helpers/common.helper.js'
import { test } from './test.handler.js'
import { Acknowledgement } from '../config/interface.config.js'
import { CONSTANTS } from '../config/constants.config.js'
import { signup } from './auth.handler.js'

const handlers = {
    TEST: async (data: any, acknowledgement : Acknowledgement, socket: Socket, eventName: string) => await test(data, acknowledgement, socket, eventName)
}

handlers[`${CONSTANTS.SOCKET.EVENTS.CUSTOM.SIGN_UP}`] = async (data: any, acknowledgement : Acknowledgement, socket: Socket, eventName: string) => await signup(data, acknowledgement, socket, eventName)

export const SocketHandler = async (socket: Socket) : Promise<void> => {
    return new Promise((resolve, reject) => {
        try {
            socket.onAny(async (eventName, value, acknowledgement) => {
                // global.logger.info(`recived event : ${eventName} || socketId : ${socket.id}`)
                // global.logger.info(value);
    
                // ? check authentication TODO:
    
                if (value) value = convertStringtoObject(value);
                await handlers[eventName](value, acknowledgement, socket, eventName);
                // global.logger.info('result ', result)
                resolve();
            })
        } catch(e) {
            global.logger.error(e.message);
            reject(e);
        }
    })
}