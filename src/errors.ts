export enum Errors {
    BadRequest = 4000,
    RequestParseError = 4001,
    AuthCheckError = 4002,
    UnauthorizedError = 4003,
    ContentNotFoundError = 4004,
    InternalError = 5000,
}

export class WsError extends Error {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, WsError.prototype);
    }
}

export class ConnectionError extends WsError {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, ConnectionError.prototype);
    }
}

export class TokenExpiredError extends WsError {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, TokenExpiredError.prototype);
    }
}

export function wsError(errorCode: number, m?: string) {
    switch (errorCode) {
        case -1:
            return new ConnectionError(m ? m : 'Connection error');
        case Errors.AuthCheckError:
            return new TokenExpiredError(m ? m : 'Token is expired');
        default:
            return new WsError(m ? m : 'Unknown error');
    }
}
