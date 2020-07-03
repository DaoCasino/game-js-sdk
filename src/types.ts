import { WsError } from './errors';

export type Request = {
    id: string;
    handler: (payload: unknown) => unknown;
    rejecter: (error: WsError) => unknown;
};

export type ConnectionParams = {
    onClose?: (closeEvent: CloseEvent) => unknown;
    secure?: boolean;
    autoReconnect?: boolean;
    autoRefresh?: boolean;
};

export type AuthData = {
    accessToken: string;
    refreshToken: string;
};

export type WsErrorMsg = {
    code: number;
    message: string;
};

export type Response = {
    type: 'response';
    id: string;
    status: 'ok' | 'error';
    payload: any;
};

export type Update = {
    type: 'update';
    reason: string;
    time: number;
    payload: any;
};

export type InMsg = Response | Update;

export type EventListener = () => unknown;
