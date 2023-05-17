import { Socket } from "socket.io";
import { addMinutes, makeResponse } from "../helpers/common.helper.js";
import logger from "../log/logger.js";
import { Acknowledgement, Player, TableGamePlay } from "../config/interface.config.js";
import { validateSignupPayload } from "../middleware/auth.middleware.js";
import { deleteTableGamePlay, getPlayer, getTableGamePlay, setPlayer, setTableGamePlay } from "../helpers/redis.helpers.js";
import { CONSTANTS } from "../config/constants.config.js";
import {v4} from 'uuid';
import { IO } from "../services/socket.service.js";

export const signup = async (data: any, acknowledgement : Acknowledgement, socket: Socket, eventName: string) : Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            /**
             * validate the response
             * require: deviceId, entryFee
             */
            const isValid = validateSignupPayload(data);
            if (!isValid.valid) {


                resolve(acknowledgement(makeResponse({
                    ...isValid.errors
                })))
            } else {

                /**
                 * check if player has been already register before
                 */
                let player = await getPlayer(data.deviceId);
                if (player) {

                    socket.handshake.auth.id = player.deviceId;

                    player.socketId = socket.id;
                    player = await setPlayer(player);
                    if (!player) resolve(acknowledgement(makeResponse({ msg: `failed updating the socketId of player in signup.`})))

                    /**
                     * check player has tableId or not,
                     * if it has, meaning player was already playing the game and lefted.
                     */
                    if (player.tableId !== "") {

                        let tableGamePlay = await getTableGamePlay(player.tableId, false);
                        if (tableGamePlay) {
                            socket.handshake.auth.tableId = tableGamePlay.tableId;
                            socket.join(tableGamePlay.tableId);

                            resolve(acknowledgement(makeResponse({
                                ...tableGamePlay
                            })));
                        } else {
                            /**
                             * looking for e.g -> TGP:100
                             */
                            tableGamePlay = await getTableGamePlay(data.entryFee, false);

                            if (tableGamePlay) {

                                const isPlayerInTgp = tableGamePlay.players.filter(et_player => et_player.deviceId === player.deviceId).length > 0;
                                if (isPlayerInTgp) {

                                    socket.handshake.auth.tableId = tableGamePlay.tableId;
                                    socket.join(tableGamePlay.tableId);
                                    resolve(acknowledgement(makeResponse({
                                        ...tableGamePlay
                                    })))

                                } else {
                                    /**
                                     * check for ET is available with same entryFee
                                     */
                                    tableGamePlay = await getTableGamePlay(data.entryFee, true);
                                    if (tableGamePlay) {

                                        player.tableId = tableGamePlay.tableId;
                                        player = await setPlayer(player);
                                        if (!player) resolve(acknowledgement(makeResponse({ msg: `failed updating tableId of player in signup.`})))

                                        tableGamePlay.players.push(player);
                                        tableGamePlay = await setTableGamePlay(tableGamePlay, true);

                                        socket.join(tableGamePlay.tableId);
                                        socket.handshake.auth.tableId = tableGamePlay.tableId;

                                        if (tableGamePlay.players.length === CONSTANTS.GAME.MINIMUM_PLAYER_TO_START) {

                                            tableGamePlay = await deleteTableGamePlay(tableGamePlay.entryFee, true);
                                            if (!tableGamePlay) resolve(acknowledgement(makeResponse({ msg: `failed deleting ET in signup.`})))

                                            tableGamePlay = await setTableGamePlay(tableGamePlay);
                                            if (!tableGamePlay) resolve(acknowledgement(makeResponse({ msg: `failed setting up tableGamePlay with entryFee in signup.` })))

                                            IO.to(tableGamePlay.tableId).emit(CONSTANTS.SOCKET.EVENTS.CUSTOM.GAME_START, makeResponse({
                                                ...tableGamePlay
                                            }))

                                            resolve(acknowledgement(makeResponse({
                                                ...tableGamePlay
                                            })))

                                        } else {
                                            /**
                                             * ET is still in waiting for start the game.
                                             */
                                            resolve(acknowledgement(makeResponse({
                                                ...tableGamePlay
                                            })))
                                            
                                        }

                                    } else {
                                        /**
                                         * create new empty table
                                         */
                                        const tableId = v4();
                                        let emptyTable : TableGamePlay = {
                                            tableId,
                                            players: [player],
                                            expiredAt: addMinutes(new Date(), 3),
                                            entryFee: data.entryFee
                                        }

                                        emptyTable = await setTableGamePlay(data.entryFee, true);
                                        if (!emptyTable) resolve(acknowledgement(makeResponse({ msg: `failed creating empty table in signup.`})))

                                        socket.handshake.auth.tableId = emptyTable.tableId;
                                        socket.join(emptyTable.tableId);

                                        resolve(acknowledgement(makeResponse({
                                            ...emptyTable
                                        })))

                                    }
                                }

                            } else {
                                /**
                                 * check is there any ET with same entry fee.
                                 */
                                tableGamePlay = await getTableGamePlay(data.entryFee, true);
                                if (tableGamePlay) {
                                    socket.handshake.auth.tableId = tableGamePlay.tableId;
                                    socket.join(tableGamePlay.tableId);

                                    tableGamePlay.players.push(player);
                                    tableGamePlay = await setTableGamePlay(tableGamePlay.tableId, true);
                                    if (tableGamePlay.players.length === CONSTANTS.GAME.MINIMUM_PLAYER_TO_START) {

                                        /**
                                         * remove the empty table and start with e.g -> TGP:100
                                         */
                                        tableGamePlay = await deleteTableGamePlay(tableGamePlay.entryFee, true);
                                        if (!tableGamePlay) resolve(acknowledgement(makeResponse({ msg: 'failed deleting empty table in signup'})));

                                        tableGamePlay = await setTableGamePlay(tableGamePlay.entryFee);
                                        if (!tableGamePlay) resolve(acknowledgement(makeResponse({ msg: 'failed creating TGP:entryFee in signup.'})))

                                        resolve(acknowledgement(makeResponse({
                                            ...tableGamePlay
                                        })))

                                    } else {
                                        resolve(acknowledgement(makeResponse({
                                            ...tableGamePlay
                                        })))
                                    }
                                } else {
                                    /**
                                     * create new Empty table 
                                     */
                                    const tableId = v4();

                                    player.tableId = tableId;
                                    player = await setPlayer(player);
                                    if (!player) resolve(acknowledgement(makeResponse({ msg: 'failed updating player tableId in signup'})))

                                    let emptyTable : TableGamePlay = {
                                        tableId,
                                        entryFee: data.entryFee,
                                        players: [player],
                                        expiredAt: addMinutes(new Date(), 3)
                                    }

                                    emptyTable = await setTableGamePlay(emptyTable, true)
                                    if (!emptyTable) resolve(acknowledgement(makeResponse({ msg: 'failed creating empty table in signup.'})))
                                }

                            }
                        }

                    } else {
                        /**
                         * check is there any table is in playing mode with the same entry fee.
                         */
                        let tableGamePlay : TableGamePlay = await getTableGamePlay(data.entryFee);
                        if (tableGamePlay) {

                            socket.handshake.auth.tableId = tableGamePlay.tableId;
                            socket.join(tableGamePlay.tableId);

                            player.tableId = tableGamePlay.tableId;
                            player = await setPlayer(player);
                            if (!player) resolve(acknowledgement(makeResponse({ msg: 'failed updating player table in signup :: main else.'})))

                            tableGamePlay.players.push(player);

                            if (tableGamePlay.players.length === CONSTANTS.GAME.MAXIMUM_PLAYER_IN_GAME) {

                                /**
                                 * delete TGP with entryFee and creating with tableId, because now its full
                                 */
                                tableGamePlay = await deleteTableGamePlay(tableGamePlay.entryFee);
                                if (!tableGamePlay) resolve(acknowledgement(makeResponse({msg: 'failed deleting tableGamePlay in signup'})))

                                tableGamePlay = await setTableGamePlay(tableGamePlay.tableId, false, true);
                                if (!tableGamePlay) resolve(acknowledgement(makeResponse({msg: 'failed creating tableGamePlay with tableId in signup :: main else'})))

                                resolve(acknowledgement(makeResponse({
                                    ...tableGamePlay
                                })))

                            } else {

                                tableGamePlay = await setTableGamePlay(tableGamePlay);
                                if (!tableGamePlay) resolve(acknowledgement(makeResponse({ msg: 'failed updating tableGamePlay with entryFee in signup :: main else.'})))
                                

                                resolve(acknowledgement(makeResponse({
                                    ...tableGamePlay
                                })))

                            }

                        } else {

                            /**
                             * check is there any empty table with same entryFee or not
                             */
                            let emptyTable = await getTableGamePlay(data.entryFee, true);
                            if (emptyTable) {

                                player.tableId = emptyTable.tableId;
                                player = await setPlayer(player);
                                if (!player) resolve(acknowledgement(makeResponse({ msg: `failed updating newPlayer in signup.`})));

                                emptyTable.players.push(player);

                                /**
                                 * check if minimum players got match,
                                 * then delete the empty table and create tgp then start the game.
                                 */
                                if (emptyTable.players.length === CONSTANTS.GAME.MINIMUM_PLAYER_TO_START) {

                                    /**
                                     * delete the empty table
                                     */
                                    let tableGamePlay = await deleteTableGamePlay(emptyTable.entryFee, true);
                                    if (!tableGamePlay) resolve(acknowledgement(makeResponse({ msg: `failed deleting emptyTable in signup` })));

                                    tableGamePlay.players.push(player);
                                    tableGamePlay = await setTableGamePlay(tableGamePlay);
                                    if (!tableGamePlay) resolve(acknowledgement(makeResponse({ msg: 'failed updating tableGamePlay in signup with new player'})))

                                    socket.join(tableGamePlay.tableId);

                                    // FIXME: needs to start the game timer using bull queue.

                                    resolve(acknowledgement(makeResponse({
                                        ...tableGamePlay
                                    })))

                                } else {
                                    // FIXME: needs to delete the emptyTable and set player.tableId = "" after some times.

                                    /**
                                     * add new waiting player to the list in empty table.
                                     */
                                    emptyTable = await setTableGamePlay(emptyTable, true);
                                    if (!emptyTable) resolve(acknowledgement(makeResponse({ msg: 'failed updating emptyTable with new Player in signup.'})))

                                    socket.join(emptyTable.tableId);

                                    /**
                                     * updated the 
                                     */
                                    acknowledgement(makeResponse({
                                        ...player
                                    }))
                                }

                            } else {
                                const tableId : string = v4();

                                player.tableId = tableId;
                                player = await setPlayer(player)
                                if (!player) resolve(acknowledgement(makeResponse({ msg: 'failed updating tableId on player in signup.'})))

                                let emptyTable : TableGamePlay = {
                                    tableId,
                                    players: [player],
                                    entryFee: data.entryFee,
                                    expiredAt: addMinutes(new Date(), 3)
                                }
                                emptyTable = await setTableGamePlay(emptyTable, true);
                                if (!emptyTable) resolve(acknowledgement(makeResponse({ msg: `failed creating empty table in signup.`})))

                                resolve(acknowledgement(makeResponse({
                                    ...emptyTable
                                })))

                            }

                        }


                    }

                } else {
                    /**
                     * create new player
                     */
                    let newPlayer : Player = {
                        deviceId: data.deviceId,
                        tableId: "",
                        socketId: socket.id
                    }
                    newPlayer = await setPlayer(newPlayer);
                    if (!newPlayer) resolve(acknowledgement(makeResponse({ msg: 'falied creating newPlayer using setPlayer::Function in signup'})));

                    socket.handshake.auth.id = data.deviceId;

                    /**
                     * check is there any table is in playing mode with the same entry fee.
                     */
                    let tableGamePlay : TableGamePlay = await getTableGamePlay(data.entryFee);
                    if (tableGamePlay) {

                        socket.handshake.auth.tableId = tableGamePlay.tableId;
                        socket.join(tableGamePlay.tableId);

                        newPlayer.tableId = tableGamePlay.tableId;
                        newPlayer = await setPlayer(player);
                        if (!player) resolve(acknowledgement(makeResponse({ msg: 'failed updating player table in signup :: main else.'})))

                        tableGamePlay.players.push(newPlayer);

                        if (tableGamePlay.players.length === CONSTANTS.GAME.MAXIMUM_PLAYER_IN_GAME) {

                            /**
                             * delete TGP with entryFee and creating with tableId, because now its full
                             */
                            tableGamePlay = await deleteTableGamePlay(tableGamePlay.entryFee);
                            if (!tableGamePlay) resolve(acknowledgement(makeResponse({msg: 'failed deleting tableGamePlay in signup'})))

                            tableGamePlay = await setTableGamePlay(tableGamePlay.tableId, false, true);
                            if (!tableGamePlay) resolve(acknowledgement(makeResponse({msg: 'failed creating tableGamePlay with tableId in signup :: main else'})))

                            resolve(acknowledgement(makeResponse({
                                ...tableGamePlay
                            })))

                        } else {

                            tableGamePlay = await setTableGamePlay(tableGamePlay);
                            if (!tableGamePlay) resolve(acknowledgement(makeResponse({ msg: 'failed updating tableGamePlay with entryFee in signup :: main else.'})))

                            resolve(acknowledgement(makeResponse({
                                ...tableGamePlay
                            })))

                        }

                    } else {

                        /**
                         * check is there any empty table with same entryFee or not
                         */
                        let emptyTable = await getTableGamePlay(data.entryFee, true);
                        if (emptyTable) {

                            newPlayer.tableId = emptyTable.tableId;
                            newPlayer = await setPlayer(newPlayer);
                            if (!newPlayer) resolve(acknowledgement(makeResponse({ msg: `failed updating newPlayer in signup.`})));

                            emptyTable.players.push(newPlayer);

                            /**
                             * check if minimum players got match,
                             * then delete the empty table and create tgp then start the game.
                             */
                            if (emptyTable.players.length === CONSTANTS.GAME.MINIMUM_PLAYER_TO_START) {

                                /**
                                 * delete the empty table
                                 */
                                let tableGamePlay = await deleteTableGamePlay(emptyTable.entryFee, true);
                                if (!tableGamePlay) resolve(acknowledgement(makeResponse({ msg: `failed deleting emptyTable in signup` })));

                                tableGamePlay.players.push(newPlayer);
                                tableGamePlay = await setTableGamePlay(tableGamePlay);
                                if (!tableGamePlay) resolve(acknowledgement(makeResponse({ msg: 'failed updating tableGamePlay in signup with new player'})))

                                socket.join(tableGamePlay.tableId);

                                // FIXME: needs to start the game timer using bull queue.

                                resolve(acknowledgement(makeResponse({
                                    ...tableGamePlay
                                })))

                            } else {
                                // FIXME: needs to delete the emptyTable and set player.tableId = "" after some times.

                                /**
                                 * add new waiting player to the list in empty table.
                                 */
                                emptyTable = await setTableGamePlay(emptyTable, true);
                                if (!emptyTable) resolve(acknowledgement(makeResponse({ msg: 'failed updating emptyTable with new Player in signup.'})))

                                socket.join(emptyTable.tableId);

                                /**
                                 * updated the 
                                 */
                                acknowledgement(makeResponse({
                                    ...newPlayer
                                }))
                            }

                        } else {
                            const tableId : string = v4();

                            newPlayer.tableId = tableId;
                            newPlayer = await setPlayer(player)
                            if (!newPlayer) resolve(acknowledgement(makeResponse({ msg: 'failed updating tableId on player in signup.'})))

                            let emptyTable : TableGamePlay = {
                                tableId,
                                players: [newPlayer],
                                entryFee: data.entryFee,
                                expiredAt: addMinutes(new Date(), 3)
                            }
                            emptyTable = await setTableGamePlay(emptyTable, true);
                            if (!emptyTable) resolve(acknowledgement(makeResponse({ msg: `failed creating empty table in signup.`})))

                            logger.info('reached!')

                            resolve(acknowledgement(makeResponse({
                                ...emptyTable
                            })));

                        }

                    }
                }

            }


        } catch(e) {
            acknowledgement(makeResponse({
                msg: `something went wrong : ${e.message}`
            }))
            logger.error(e)
            reject(e)
        }
    })
}