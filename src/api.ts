import {
    Casino,
    CasinoGame,
    Game,
    GameSession,
    GameSessionUpdate,
    PlayerInfo,
} from './models';
import { randString } from './tools';
import { Connection } from './connection';
import { AuthData } from './types';

export class Api extends Connection {
    private accessToken?: string;

    private eventListener?: EventListener;

    public authorized() {
        return this.accessToken !== undefined;
    }

    public async listen(onEvent: EventListener) {
        if (this.eventListener)
            throw new Error('listen() can be called only once');
        this.eventListener = onEvent;
    }

    public async auth(account: string) {
        if (!this.params.token) {
            const auth = await fetch(`${this.params.httpUrl}/auth`, {
                method: 'POST',
                body: JSON.stringify({
                    accountName: account,
                    email: randString(),
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            }).catch(e => {
                // TODO handle auth error
                throw e;
            });
            const authData: AuthData = await auth.json();
            this.params.token = authData.accessToken;
        }

        if (!this.params.token) {
            throw new Error('Invalid authorization data');
        }

        await this.send('auth', {
            token: this.params.token,
        });

        this.accessToken = this.params.token;

        return this.accessToken;
    }

    public newGame(
        casinoId: number,
        gameId: number,
        deposit: string,
        actionType: number,
        actionParams: number[]
    ) {
        return this.send<GameSession>('new_game', {
            deposit,
            actionType,
            actionParams,
            casinoId,
            gameId,
        });
    }

    public accountInfo() {
        return this.send<PlayerInfo>('account_info');
    }

    public fetchGames() {
        return this.send<Game[]>('fetch_games');
    }

    public fetchGamesInCasino(casinoId: number) {
        return this.send<CasinoGame[]>('fetch_games_in_casino', {
            casinoId,
        });
    }

    public fetchSessionUpdates(sessionId: number) {
        return this.send<GameSessionUpdate[]>('fetch_session_updates', {
            sessionId,
        });
    }

    public fetchCasinos() {
        return this.send<Casino[]>('fetch_casinos');
    }

    public gameAction(sessionId: number, actionType: number, params: number[]) {
        return this.send('game_action', {
            sessionId,
            actionType,
            params,
        });
    }

    public static async connect(
        url: string,
        params: {
            onClose?: (closeEvent: CloseEvent) => unknown;
            token?: string;
            secure?: boolean;
        }
    ): Promise<Api> {
        if (url.startsWith('http') || url.startsWith('ws'))
            throw new Error('The url should not contain connection schema');

        const secure = params.secure !== undefined ? params.secure : true;

        const wsUrl = secure ? `wss://${url}/connect` : `ws://${url}/connect`;
        const httpUrl = secure ? `https://${url}` : `http://${url}`;

        const webSocket = new WebSocket(wsUrl);
        await new Promise((resolve, reject) => {
            webSocket.onopen = resolve;
            webSocket.onclose = reject;
        });
        return new Api(
            {
                httpUrl,
                wsUrl,
                onClose: params.onClose,
                token: params.token,
                secure,
            },
            webSocket
        );
    }
}

export const connect = Api.connect;
