import {
    GameParams,
    GameSession,
    GameSessionUpdate,
    UpdateTypes,
    BonusBalances,
} from './models';
import { WAIT_ACTION_DURATION } from './constants';
import { Api } from './interfaces';
import { Callback, EventEmitter } from './eventEmitter';

export const parseBet = (str: string): number =>
    parseFloat(str.replace(/\s+BET$/, ''));

export const formatBet = (num: number): string => {
    // eslint-disable-next-line
    let [integer, decimals] = num
        .toString()
        .match(/^-?\d+(?:\.\d{0,4})?/)[0]
        .split('.');
    if (decimals) {
        for (let i = decimals.length; i < 4; i++) {
            decimals += '0';
        }
    } else {
        decimals = '0000';
    }

    return `${integer}.${decimals} BET`;
};

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

    private getCasinoBonusBalance(bonusBalances: BonusBalances): string | null {
        if (bonusBalances && this.casinoId in bonusBalances) {
            const { balance } = bonusBalances[this.casinoId];
            if (balance) {
                return balance;
            }
        }

        return null;
    }

    public async getBalance(): Promise<string> {
        const { balance, bonusBalances } = await this.api.accountInfo();
        if (!balance) {
            throw new Error('No field balance in accountInfo');
        }

        const casinoBonusBalance = this.getCasinoBonusBalance(bonusBalances);
        if (casinoBonusBalance !== null) {
            return formatBet(parseBet(balance) + parseBet(casinoBonusBalance));
        }

        return balance;
    }

    public async getAccountName(): Promise<string> {
        const { accountName } = await this.api.accountInfo();
        if (!accountName) {
            throw new Error('No field accountName in accountInfo');
        }
        return accountName;
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

                resolve({ ...items[validUpdateIndex], nextIndex });
            };
            this.api.eventEmitter.on('sessionUpdate', cb);
            // this is to check if wanted update was fired before waitForActionComplete called
            this.api.fetchSessionUpdates(sessionId).then(cb);
        });
    }

    private async waitForActionsComplete<T>(
        sessionId: string,
        updateTypes: number[]
    ): Promise<Array<GameSessionUpdate<T>>> {
        const result = await Promise.all(
            updateTypes.map(updateType =>
                this.waitForActionComplete<T>(sessionId, [updateType])
            )
        );
        if (result.length > 0) {
            result.sort((a, b) => {
                if (a.nextIndex < b.nextIndex) return -1;
                if (a.nextIndex > b.nextIndex) return 1;
                return 0;
            });
        }
        return result;
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
