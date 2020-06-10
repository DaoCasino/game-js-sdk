import { GameParams, GameSession } from './models';
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
        updateType: number,
        duration: number
    ): Promise<T> {
        const fetchUpdates = () => this.api.fetchSessionUpdates(sessionId);
        return new Promise((resolve, reject) => {
            const waitForActionComplete = () => {
                fetchUpdates()
                    .then(updates => {
                        const update = updates.find(
                            update => update.updateType === updateType
                        );
                        if (!update) {
                            setTimeout(waitForActionComplete, duration);
                            return;
                        }
                        resolve(update.data);
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
        duration: number = WAIT_ACTION_DURATION,
        updateType: number = UPDATE_TYPE
    ): Promise<T> {
        this.session = await this.api.newGame(
            this.casinoId,
            this.gameId,
            deposit,
            actionType,
            params
        );

        return this.waitForActionComplete<T>(
            this.session.id,
            updateType,
            duration
        );
    }

    public async gameAction<T>(
        actionType: number,
        params: number[],
        duration: number = WAIT_ACTION_DURATION,
        updateType: number = UPDATE_TYPE
    ): Promise<T> {
        if (!this.session) {
            throw new Error('No game session');
        }
        const response = await this.api.gameAction(
            this.session.id,
            actionType,
            params
        ); // TODO: add check response, if !OK throw new error
        console.log(response);

        return this.waitForActionComplete<T>(
            this.session.id,
            updateType,
            duration
        );
    }
}
