import { CONSTANTS } from "../config/constants.config.js";
import {Socket} from 'socket.io'
import logger from "../log/logger.js";
import { makeResponse } from "../helpers/common.helper.js";
import { Acknowledgement } from "../config/interface.config.js";

export const test = async (data: any, acknowledgement: Acknowledgement, socket: Socket, eventName: string) : Promise<void> => {
    return new Promise((resolve, reject) => {
        try {

            global.logger.info('test request data', data);
            resolve(acknowledgement({
                data,
                error: false,
                message: "tested socket succefully.",
            }));
    
        } catch (error) {
            acknowledgement(makeResponse({
                msg: `something went wrong :: ${error.message}`
            }))
            logger.error(error);
            reject(error);
            
        }
    })
}