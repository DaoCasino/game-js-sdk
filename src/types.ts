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

export type InMsg = {
    type: 'response' | 'update';
    id: string;
    status: 'ok' | 'error';
    payload: unknown;
};

export type EventListener = () => unknown;
