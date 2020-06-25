import { GameParams, GameSession, GameSessionUpdate } from './models';
import { WAIT_ACTION_DURATION, UPDATE_TYPE } from './constants';
import { Api } from './api';

export class GameService {
    private gameId: string;
    private gameParams: GameParams[];
    private casinoId: string;
    private api: Api;
    private session: GameSession;

    constructor(api: Api, { id, params }, casinoId: string) {
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
        const fetchUpdates = () => this.api.fetchSessionUpdates(sessionId);
        return new Promise((resolve, reject) => {
            const waitForActionComplete = () => {
                fetchUpdates()
                    .then(updates => {
                        const update = updates.find(update =>
                            updateTypes.includes(update.updateType)
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
