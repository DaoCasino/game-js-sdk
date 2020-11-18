import { RestError } from './types';

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

enum HttpErrors {
    TokenExpiredError = 401,
}

export class HttpError extends Error {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, HttpError.prototype);
    }
}

export class HttpTokenExpiredError extends HttpError {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, HttpTokenExpiredError.prototype);
    }
}

export class HttpClientError extends HttpError {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, HttpClientError.prototype);
    }
}

export function httpError({ code, message }: RestError) {
    switch (code) {
        case HttpErrors.TokenExpiredError:
            return new HttpTokenExpiredError(message);
    }

    if (code >= 400 && code < 500) {
        return new HttpClientError(message);
    }

    return new HttpError(message);
}
