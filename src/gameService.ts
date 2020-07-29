import {
    GameParams,
    GameSession,
    GameSessionUpdate,
    UpdateTypes,
} from './models';
import { WAIT_ACTION_DURATION } from './constants';
import { Api } from './interfaces';
import { Callback, EventEmitter } from './eventEmitter';

export class GameService extends EventEmitter {
    private gameId: string;
    private gameParams: GameParams[];
    private casinoId: string;
    private api: Api;
    private session: GameSession;
    private resolved: Map<string, number>;

    constructor(api: Api, { id, params }, casinoId: string) {
        super();
        this.api = api;
        this.gameId = id;
        this.gameParams = params;
        this.casinoId = casinoId;
        this.resolved = new Map();
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
        let resolved = false;
        const key = sessionId + ':' + updateTypes.join('_');

        return new Promise<GameSessionUpdate<T>>(resolve => {
            const cb: Callback<GameSessionUpdate<T>[]> = updates => {
                if (resolved) {
                    console.log('waitAction: resolved', sessionId, updateTypes);
                    return;
                }

                // console.log(
                //     'waitForActionComplete callback',
                //     sessionId,
                //     updateTypes
                // );

                // check updates array for changes
                const prevIndex = this.resolved.get(key);
                const updatesCopy = [...updates]; // for debug
                // console.log('get', { key, prevIndex });

                const items = prevIndex ? updates.splice(prevIndex) : updates;

                // console.log({ items, updates: updatesCopy });

                const validUpdateIndex = items.findIndex(
                    update =>
                        update.sessionId === sessionId &&
                        updateTypes.includes(update.updateType)
                );
                if (validUpdateIndex === -1) {
                    console.log('waitAction: not valid update', {
                        sessionId,
                        updateTypes,
                        prevIndex,
                        updates: updatesCopy,
                        items,
                    });
                    return;
                }
                this.api.eventEmitter.off('sessionUpdate', cb);
                resolved = true;

                const nextIndex = ((): number => {
                    const prev = prevIndex || 0;
                    const next = validUpdateIndex + 1;
                    return prev + next;
                })();

                this.resolved.set(key, nextIndex);
                // console.log('set', { key, value: nextIndex });

                console.log('waitAction: valid update', {
                    sessionId,
                    updateTypes,
                    prevIndex,
                    nextIndex,
                    updates: updatesCopy,
                    items,
                    validUpdateIndex,
                });

                resolve(items[validUpdateIndex]);
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
        const key = sessionId + ':' + updateTypes.join('_');

        return new Promise<Array<GameSessionUpdate<T>>>(resolve => {
            const result = [];
            const resolved = {};
            const cb: Callback<GameSessionUpdate<T>[]> = updates => {
                // console.log('waitForActionsComplete callback', sessionId, updateTypes);

                updateTypes.forEach(updateType => {
                    if (updateType in resolved) {
                        return;
                    }
                    // console.log('find update type', updateType);
                    const updateKey = key + '|' + updateType;
                    const prevIndex = this.resolved.get(updateKey);

                    // const updatesCopy = [...updates]; // for debug
                    // console.log('get', { updateKey, prevIndex });

                    const items = prevIndex
                        ? [...updates].splice(prevIndex)
                        : updates;

                    const validUpdateIndex = items.findIndex(
                        update =>
                            update.sessionId === sessionId &&
                            update.updateType === updateType
                    );

                    if (validUpdateIndex === -1) {
                        return;
                    }
                    resolved[updateType] = true;

                    const nextIndex = ((): number => {
                        const prev = prevIndex || 0;
                        const next = validUpdateIndex + 1;
                        return prev + next;
                    })();

                    this.resolved.set(updateKey, nextIndex);
                    // console.log('set', { updateKey, value: nextIndex });
                    result.push({
                        ...items[validUpdateIndex],
                        nextIndex,
                    }); // for sort
                });

                const updateIndex = {};
                updateTypes.forEach(updateType => {
                    updateIndex[updateType] = this.resolved.get(
                        key + '|' + updateType
                    );
                });

                if (result.length > 0) {
                    result.sort((a, b) => {
                        if (a.nextIndex < b.nextIndex) return -1;
                        if (a.nextIndex > b.nextIndex) return 1;
                        return 0;
                    });

                    console.log('waitAction: valid update', {
                        sessionId,
                        updateTypes,
                        updateIndex,
                        updates,
                        result,
                    });

                    // console.log({ result });
                    resolve(result);
                } else {
                    console.log('waitAction: not valid update', {
                        sessionId,
                        updateTypes,
                        updates,
                    });
                }
            };
            this.api.eventEmitter.on('sessionUpdate', cb);
            // this is to check if wanted update was fired before waitForActionComplete called
            this.api.fetchSessionUpdates(sessionId).then(cb);
        });
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
        updateTypes: number[] = [UpdateTypes.GameFinishedUpdate],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        duration: number = WAIT_ACTION_DURATION,
        deposit = ''
    ): Promise<Array<GameSessionUpdate<T>>> {
        if (!this.session) {
            throw new Error('No game session');
        }

        await this.api.gameAction(this.session.id, actionType, params, deposit);

        return this.waitForActionsComplete<T>(this.session.id, updateTypes);
    }
}
