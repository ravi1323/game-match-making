export type Acknowledgement = (data: any) => void;

export interface Validation {
    valid: boolean,
    errors?: object
}

export interface Player {
    deviceId: string,
    tableId: string,
    socketId: string
}

export interface TableGamePlay {
    tableId: string,
    players: Player[],
    entryFee: number,
    expiredAt: Date
}