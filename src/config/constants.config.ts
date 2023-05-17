export const CONSTANTS = {
    SOCKET: {
        EVENTS: {
            CORE: {
                CONNECTION: 'connection',
                DISCONNECT: 'disconnect'
            },
            CUSTOM: {
                SIGN_UP: 'SIGN_UP',
                GAME_START: 'JOIN_GAME'
            }
        }
    },
    REDIS: {
        PREFIXES: {
            PLAYER: 'PLAYER',
            TGP: 'TGP',
            ET: 'ET'
        }
    },
    GAME: {
        MINIMUM_PLAYER_TO_START: 2,
        MAXIMUM_PLAYER_IN_GAME: 6
    }
}