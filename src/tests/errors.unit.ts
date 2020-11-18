import { describe, it } from 'mocha';
import { expect } from 'chai';

import {
    httpError,
    HttpClientError,
    HttpTokenExpiredError,
    HttpError,
} from '../errors';

describe('Errors unit test', () => {
    it('HttpClientError', () => {
        expect(httpError({ code: 400, message: 'test' })).to.be.an.instanceof(
            HttpClientError
        );
        expect(httpError({ code: 499, message: 'test' })).to.be.an.instanceof(
            HttpClientError
        );
    });

    it('HttpTokenExpiredError', () => {
        expect(httpError({ code: 401, message: 'test' })).to.be.an.instanceof(
            HttpTokenExpiredError
        );
    });

    it('HttpError', () => {
        expect(httpError({ code: 500, message: 'test' })).to.be.an.instanceof(
            HttpError
        );

        expect(httpError({ code: 504, message: 'test' })).to.be.an.instanceof(
            HttpError
        );
    });
});
