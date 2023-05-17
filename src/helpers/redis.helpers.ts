import { CONSTANTS } from "../config/constants.config.js";
import { Player, TableGamePlay } from "../config/interface.config.js";
import logger from "../log/logger.js";
import { redisClient } from "../services/redis.service.js";


/**
 * PLAYER __START__
 */
export const getPlayer = async (deviceId: string) : Promise<Player> => {
    return new Promise(async (resolve, reject) => {
        try {

            const KEY = `${CONSTANTS.REDIS.PREFIXES.PLAYER}:${deviceId}`;
            let player = await redisClient.get(KEY);
            player = player ? JSON.parse(player) : null;
            resolve(player);

        } catch(e) {
            logger.error(`failed getting player using getPlayer::Function :: ${e.message}`);
            reject(e);
        }
    })
}

export const setPlayer = async (player: Player) : Promise<Player> => {
    return new Promise(async (resolve, reject) => {
        try {

            const KEY = `${CONSTANTS.REDIS.PREFIXES.PLAYER}:${player.deviceId}`;
            const status = await redisClient.set(KEY, JSON.stringify(player));
            logger.info(status)

            const result = status === 'OK' ? player : null;
            resolve(result);

        } catch(e) {
            logger.error(new Error(`failed setting up player using setPlayer::Function :: message :: ${e.message}`))
            reject(e);
        }
    })
}

/**
 * PLAYER __END__
 */


// ####################################################################################

/**
 * TABLE __START__
 */
export const getTableGamePlay = async (entryFeeOrTableId: string, emptyTable: boolean = false) : Promise<TableGamePlay> => {
    return new Promise(async (resolve, reject) => {
        try {
            if (emptyTable && Number.isNaN(Number(entryFeeOrTableId))) reject(new Error("you cannot find empty table using getTableGamePlay::Function by passing tableId."));
            const KEY = `${emptyTable ? CONSTANTS.REDIS.PREFIXES.ET : CONSTANTS.REDIS.PREFIXES.TGP}:${entryFeeOrTableId}`;
            let tableGamePlay = await redisClient.get(KEY);
            tableGamePlay = tableGamePlay ? JSON.parse(tableGamePlay) : null;
            resolve(tableGamePlay);

        } catch(e) {
            logger.error(new Error(`failed getting tableGamePlay using getTableGamePlay::Function :: ${e.message}`));
            reject(e);
        }
    })
}

export const setTableGamePlay = async (tableGamePlay, emptyTable: boolean = false, withEntryFeeOrTableId: boolean = false) : Promise<TableGamePlay> => {
    return new Promise(async (resolve, reject) => {
        try {
            let KEY = null;
            if (emptyTable) KEY = `${CONSTANTS.REDIS.PREFIXES.ET}:${tableGamePlay.entryFee}`;
            else if (withEntryFeeOrTableId) KEY = `${CONSTANTS.REDIS.PREFIXES.TGP}:${tableGamePlay.tableId}`;
            else KEY = `${CONSTANTS.REDIS.PREFIXES.ET}:${tableGamePlay.entryFee}`;
            let status = await redisClient.set(KEY, JSON.stringify(tableGamePlay));
            status = status === 'OK' ? tableGamePlay : null;
            resolve(status);

        } catch(e) {
            logger.error(new Error(`failed setting up tableGamePlayer using setTableGamePlay::Function`))
            reject(e);
        }
    })
}

export const deleteTableGamePlay = async (entryFeeOrTableId, emptyTable: boolean = false) : Promise<TableGamePlay> => {
    return new Promise(async (resolve, reject) => {
        try {
            if (emptyTable && Number.isNaN(Number(entryFeeOrTableId))) reject(new Error("you cannot find empty table using getTableGamePlay::Function by passing tableId."));
            const KEY = `${emptyTable ? CONSTANTS.REDIS.PREFIXES.ET : CONSTANTS.REDIS.PREFIXES.TGP}:${entryFeeOrTableId}`;

            const tableGamePlay = await getTableGamePlay(entryFeeOrTableId, emptyTable);
            if (tableGamePlay) {
                let status = await redisClient.del(KEY);
                status = status === 'OK' ? tableGamePlay : null;
                resolve(status);
            } else reject(new Error("failed getting tableGamePlay while deleting tableGamePlay using deleteTableGamePlay::Function"));

        } catch(e) {
            logger.error(new Error(`failed deleting the tableGamePlay using deleteTableGamePlay::Function :: message : ${e.message}`));
            reject(e);
        }
    })
}
/**
 * TABLE __START__
 */