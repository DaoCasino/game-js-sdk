import { AccountInfo, GameSessionUpdate, GameSession } from './models';
import { EventEmitter } from './eventEmitter';

interface Connection {
    eventEmitter: EventEmitter;
}

export interface Api extends Connection {
    accountInfo(): Promise<AccountInfo>;
    fetchSessionUpdates(sessionId: string): Promise<GameSessionUpdate<any>[]>;
    newGame(
        casinoId: string,
        gameId: string,
        deposit: string,
        actionType: number,
        actionParams: number[]
    ): Promise<GameSession>;

    gameAction(
        sessionId: string,
        actionType: number,
        params: number[],
        deposit?: string
    ): Promise<unknown>;
}
