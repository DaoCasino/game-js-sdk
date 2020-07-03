import { GameParams, GameSession, GameSessionUpdate } from './models';
import { WAIT_ACTION_DURATION, UPDATE_TYPE } from './constants';
import { Api } from './api';
import { EventEmitter } from './eventEmitter';
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
        updateTypes: number[],
        duration: number
    ): Promise<GameSessionUpdate<T>> {
        const ts = new Date().getTime();
        const fetchUpdates = () => this.api.fetchSessionUpdates(sessionId);
        return new Promise((resolve, reject) => {
            const waitForActionComplete = () => {
                fetchUpdates()
                    .then(updates => {
                        const update = updates
                            .sort((a, b) => {
                                const tsA = new Date(a.timestamp).getTime();
                                const tsB = new Date(b.timestamp).getTime();
                                return tsA === tsB ? 0 : tsA < tsB ? 1 : -1;
                            })
                            .find(
                                update =>
                                    updateTypes.includes(update.updateType) &&
                                    new Date(update.timestamp).getTime() > ts
                            );
                        if (!update) {
                            setTimeout(waitForActionComplete, duration);
                            return;
                        }
                        resolve(update as GameSessionUpdate<T>);
                    })
                    .catch(err => reject(err));
            };
            waitForActionComplete();
        });
    }

    public async newGame<T>(
        deposit: string,
        actionType: number,
        params: number[],
        updateType: number | number[] = [UPDATE_TYPE],
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
            typeof updateType === 'number' ? [updateType] : updateType,
            duration
        );
    }

    public async gameAction<T>(
        actionType: number,
        params: number[],
        updateType: number | number[] = [UPDATE_TYPE],
        duration: number = WAIT_ACTION_DURATION,
        deposit = ''
    ): Promise<GameSessionUpdate<T>> {
        if (!this.session) {
            throw new Error('No game session');
        }

        await this.api.gameAction(this.session.id, actionType, params, deposit);

        return this.waitForActionComplete<T>(
            this.session.id,
            typeof updateType === 'number' ? [updateType] : updateType,
            duration
        );
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
