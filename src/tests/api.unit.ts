import { describe, it } from 'mocha';
import { expect } from 'chai';

import { Api } from '../api';
import { AuthData, RestError, RestResponse } from '../types';

// eslint-disable-next-line
require('isomorphic-fetch');
// eslint-disable-next-line
const fetchMock = require('fetch-mock');

// handleFunc("refresh_token", refreshTokensHandler)
// handleFunc("optout", optOutHandler)

class MockStorage implements Storage {
    public readonly length: number;
    private data: Map<string, any>;

    constructor() {
        this.data = new Map();
    }

    getItem(key: string) {
        return this.data.get(key);
    }

    setItem(key: string, value: any) {
        return this.data.set(key, value);
    }

    removeItem(key: string) {
        return this.data.delete(key);
    }

    clear() {
        return this.data.clear();
    }

    key() {
        return null;
    }
}

const randomString = () =>
    Math.random()
        .toString(36)
        .substring(2, 15) +
    Math.random()
        .toString(36)
        .substring(2, 15);

const randomAuthData = (): AuthData => ({
    accessToken: randomString(),
    refreshToken: randomString(),
});

const createResponse = (response = null, error = null): RestResponse => ({
    response,
    error,
});

const randomError = (): RestError => ({
    code: 0,
    message: randomString(),
});

describe('API unit test', () => {
    const ws = {};
    const storage = new MockStorage();
    const api = new Api(
        {
            wsUrl: 'localhost',
            httpUrl: 'localhost',
            autoReconnect: false,
            autoRefresh: false,
            secure: false,
        },
        ws as WebSocket,
        storage
    );

    describe('refresh_token', () => {
        const authData = randomAuthData();
        const url = '/localhost/refresh_token';
        it('old version - ok', async () => {
            fetchMock.post(url, authData);
            const result = await api.refreshToken(randomAuthData());
            fetchMock.reset();
            expect(result).to.deep.equal(authData);
        });
        it('ok', async () => {
            fetchMock.post(url, createResponse(authData));
            const result = await api.refreshToken(randomAuthData());
            fetchMock.reset();
            expect(result).to.deep.equal(authData);
        });
        it('error', async () => {
            const error = randomError();
            fetchMock.post(url, createResponse(null, error));

            let err;
            try {
                await api.refreshToken(randomAuthData());
                fetchMock.reset();
            } catch (e) {
                fetchMock.reset();
                err = e;
            }
            expect(err.message).to.equal(error.message);
        });
    });

    describe('logout', () => {
        const url = '/localhost/logout';
        it('old version - ok', async () => {
            fetchMock.post(url, 200);
            const result = await api.logout(randomAuthData());
            fetchMock.reset();
            expect(result).to.equal(true);
        });
        it('ok', async () => {
            fetchMock.post(url, createResponse(true));
            const result = await api.logout(randomAuthData());
            fetchMock.reset();
            expect(result).to.equal(true);
        });
        it('error', async () => {
            const error = randomError();
            fetchMock.post(url, createResponse(null, error));

            let err;
            try {
                await api.logout(randomAuthData());
                fetchMock.reset();
            } catch (e) {
                fetchMock.reset();
                err = e;
            }
            expect(err.message).to.equal(error.message);
        });
    });

    describe('optout', () => {
        const url = '/localhost/optout';
        it('ok', async () => {
            fetchMock.post(url, createResponse(true));
            const result = await api.optout(randomAuthData());
            fetchMock.reset();
            expect(result).to.equal(true);
        });
        it('error', async () => {
            const error = randomError();
            fetchMock.post(url, createResponse(null, error));

            let err;
            try {
                await api.optout(randomAuthData());
                fetchMock.reset();
            } catch (e) {
                fetchMock.reset();
                err = e;
            }
            expect(err.message).to.equal(error.message);
        });
    });
});
