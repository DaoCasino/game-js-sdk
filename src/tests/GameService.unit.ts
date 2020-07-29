import { describe, it } from 'mocha';
import { expect } from 'chai';

import { AccountInfo, GameSessionUpdate, GameSession } from '../models';

import { Api } from '../interfaces';
import { GameService } from '../gameService';
import { EventEmitter } from '../eventEmitter';

const DURATION = 0;

const randomString = () =>
    Math.random()
        .toString(36)
        .substring(2, 15) +
    Math.random()
        .toString(36)
        .substring(2, 15);

class ApiMock implements Api {
    eventEmitter: EventEmitter;
    constructor() {
        this.eventEmitter = new EventEmitter();
    }
    accountInfo() {
        const info: AccountInfo = {
            accountName: randomString(),
            email: randomString(),
            balance: '100.0000 BET',
            activePermission: randomString(),
            ownerPermission: randomString(),
            linkedCasinos: [],
        };
        return Promise.resolve(info);
    }
    fetchSessionUpdates(sessionId: string) {
        const base: GameSessionUpdate<any> = {
            data: { msg: [Math.random()] },
            sessionId,
            timestamp: '2020-07-28T20:41:05.929128Z',
            updateType: 1,
        };

        const updates = [];

        updates.push({ ...base, updateType: 3, timestamp: '1' });
        updates.push({ ...base, updateType: 3, timestamp: '2' });
        updates.push({ ...base, updateType: 4, timestamp: '3' });
        updates.push({ ...base, updateType: 4, timestamp: '4' });

        return Promise.resolve(updates);
    }
    newGame(
        casinoId: string,
        gameId: string,
        deposit: string,
        _: number,
        __: number[]
    ) {
        const session: GameSession = {
            id: randomString(),
            player: randomString(),
            casinoID: casinoId,
            gameID: gameId,
            blockchainSesID: randomString(),
            state: 0,
            lastUpdate: 0,
            deposit,
        };
        return Promise.resolve(session);
    }

    gameAction(_: string, __: number, ___: number[], ____?: string) {
        return Promise.resolve();
    }
}

describe('GameService unit test', () => {
    const api = new ApiMock();
    it('waitForActionComplete', async () => {
        const service = new GameService(api, { id: 0, params: {} }, '0'); // resolved global

        const updateTypes = [3, 4];
        const params = [0];
        const actionType = 0;

        const test = await service.newGame(
            '0',
            actionType,
            params,
            updateTypes,
            DURATION
        );
        expect(test.timestamp).to.equal('1');
        expect(test.updateType).to.equal(3);

        const test2 = await service.gameAction(
            actionType,
            params,
            updateTypes,
            DURATION
        );

        expect(test2.timestamp).to.equal('2');
        expect(test2.updateType).to.equal(3);

        const test3 = await service.gameAction(
            actionType,
            params,
            updateTypes,
            DURATION
        );

        expect(test3.timestamp).to.equal('3');
        expect(test3.updateType).to.equal(4);
    });

    it('waitForActionsComplete', async () => {
        const service = new GameService(api, { id: 0, params: {} }, '0');

        const updateTypes = [4, 3];
        const params = [0];
        const actionType = 0;

        const test = await service.newGameMultiUpdate(
            '0',
            actionType,
            params,
            updateTypes,
            DURATION
        );

        expect(test.length).to.equal(2);
        expect(test[0].timestamp).to.equal('1');
        expect(test[0].updateType).to.equal(3);

        expect(test[1].timestamp).to.equal('3');
        expect(test[1].updateType).to.equal(4);

        const test2 = await service.gameActionMultiUpdate(
            actionType,
            params,
            updateTypes,
            DURATION
        );

        expect(test2.length).to.equal(2);
        expect(test2[0].timestamp).to.equal('2');
        expect(test[0].updateType).to.equal(3);

        expect(test2[1].timestamp).to.equal('4');
        expect(test2[1].updateType).to.equal(4);

    });
});
