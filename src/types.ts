export type Request = {
    id: string;
    handler: (payload: unknown) => unknown;
    rejecter: (reason: WsError) => unknown;
};

export type AuthData = {
    accessToken: string;
    refreshToken: string;
};

export type WsError = {
    code: number;
    message: string;
};

export type InMsg = {
    type: 'response' | 'update';
    id: string;
    status: 'ok' | 'error';
    payload: unknown;
};

export type EventListener = () => unknown;
