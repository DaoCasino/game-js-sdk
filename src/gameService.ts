import {
    GameParams,
    GameSession,
    GameSessionUpdate,
    UpdateTypes,
} from './models';
import { WAIT_ACTION_DURATION } from './constants';
import { Api } from './api';
import { Callback, EventEmitter } from './eventEmitter';
import { IframeMessagingProvider } from '@daocasino/platform-messaging/lib.browser/IframeMessagingProvider';

const REQUEST_TIMEOUT = 30000;

export class GameService extends EventEmitter {
    private gameId: string;
    private gameParams: GameParams[];
    private casinoId: string;
    private api: Api;
    private session: GameSession;

    constructor(api: Api, { id, params }, casinoId: string) {
        super();
        this.api = api;
        this.gameId = id;
        this.gameParams = params;
        this.casinoId = casinoId;
    }

    public async getBalance(): Promise<string> {
        const { balance } = await this.api.accountInfo();
        if (!balance) {
            throw new Error('No field balance in accountInfo');
        }

        return balance;
    }

    public getGameParams(): GameParams[] {
        return this.gameParams;
    }

    private waitForActionComplete<T>(
        sessionId: string,
        updateTypes: number[]
    ): Promise<GameSessionUpdate<T>> {
        const startTS = new Date().getTime();
        let resolved = false;
        return new Promise<GameSessionUpdate<T>>(resolve => {
            const cb: Callback<GameSessionUpdate<T>[]> = updates => {
                const validUpdate = updates.find(
                    update =>
                        update.sessionId === sessionId &&
                        updateTypes.includes(update.updateType) &&
                        new Date(update.timestamp).getTime() > startTS
                );
                if (!validUpdate) return;
                this.api.eventEmitter.off('sessionUpdate', cb);
                if (!resolved) {
                    resolved = true;
                    resolve(validUpdate);
                }
            };
            this.api.eventEmitter.on('sessionUpdate', cb);
            // this is to check if wanted update was fired before waitForActionComplete called
            this.api.fetchSessionUpdates(sessionId).then(cb);
        });
    }

    private waitForActionsComplete<T>(
        sessionId: string,
        updateTypes: number[]
    ): Promise<Array<GameSessionUpdate<T>>> {
        return Promise.all(
            updateTypes.map(ut =>
                this.waitForActionComplete<T>(sessionId, [ut])
            )
        );
    }

    public async newGame<T>(
        deposit: string,
        actionType: number,
        params: number[],
        updateType: number | number[] = [UpdateTypes.GameFinishedUpdate],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        duration: number = WAIT_ACTION_DURATION
    ): Promise<GameSessionUpdate<T>> {
        this.session = await this.api.newGame(
            this.casinoId,
            this.gameId,
            deposit,
            actionType,
            params
        );

        return this.waitForActionComplete<T>(
            this.session.id,
            typeof updateType === 'number' ? [updateType] : updateType
        );
    }

    public async newGameMultiUpdate<T>(
        deposit: string,
        actionType: number,
        params: number[],
        updateTypes: number[] = [UpdateTypes.GameFinishedUpdate],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        duration: number = WAIT_ACTION_DURATION
    ): Promise<Array<GameSessionUpdate<T>>> {
        this.session = await this.api.newGame(
            this.casinoId,
            this.gameId,
            deposit,
            actionType,
            params
        );

        return this.waitForActionsComplete<T>(this.session.id, updateTypes);
    }

    public async gameAction<T>(
        actionType: number,
        params: number[],
        updateType: number | number[] = [UpdateTypes.GameFinishedUpdate],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        duration: number = WAIT_ACTION_DURATION,
        deposit = ''
    ): Promise<GameSessionUpdate<T>> {
        if (!this.session) {
            throw new Error('No game session');
        }

        await this.api.gameAction(this.session.id, actionType, params, deposit);

        return this.waitForActionComplete<T>(
            this.session.id,
            typeof updateType === 'number' ? [updateType] : updateType
        );
    }

    public async gameActionMultiUpdate<T>(
        actionType: number,
        params: number[],
        updateType: number[] = [UpdateTypes.GameFinishedUpdate],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        duration: number = WAIT_ACTION_DURATION,
        deposit = ''
    ): Promise<Array<GameSessionUpdate<T>>> {
        if (!this.session) {
            throw new Error('No game session');
        }

        await this.api.gameAction(this.session.id, actionType, params, deposit);

        return this.waitForActionsComplete<T>(this.session.id, updateType);
    }
}

// call on iframe
export async function getRemoteGameSerivce(
    requestTimeout: number = REQUEST_TIMEOUT
): Promise<GameService> {
    const iframeMessagingProvider = (await IframeMessagingProvider.create(
        'child'
    )) as IframeMessagingProvider;

    const service = iframeMessagingProvider.getRemoteService<GameService>(
        'GameService',
        requestTimeout
    );

    document.addEventListener(
        'keydown',
        e => {
            if (e.keyCode === 27) {
                service.emit('esc');
            }
        },
        false
    );

    return service;
}
