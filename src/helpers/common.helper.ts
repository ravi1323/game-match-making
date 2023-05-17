export const convertStringtoObject = (obj: object) : object => {
    try {
        return typeof obj === 'object' ? obj : JSON.parse(obj);
    } catch (error: any) {
        return error;
    }
}

export const rtStringifyData = (data: object | string): string => {
    return typeof data === 'object' ? JSON.stringify(data) : data;
};

export const rtParseData = (data: object | string): object => {
    return typeof data === 'object' ? data : JSON.parse(data);
};

export const makeResponse = (data: object) => {
    return JSON.stringify(data);
}

export const addMinutes = (date: Date, minutes: number) : Date => {
    return new Date(date.getTime() + minutes * 60000);
}