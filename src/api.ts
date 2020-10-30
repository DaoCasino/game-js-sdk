import {
    AccountInfo,
    Casino,
    CasinoGame,
    Game,
    GameSession,
    GameSessionUpdate,
} from './models';
import { Connection, WalletAuth } from './connection';
import {
    AuthData,
    ConnectionParams,
    EventListener,
    AuthRequestParams,
    RestResponse,
} from './types';
import * as jwt from 'jsonwebtoken';
import { TokenExpiredError } from './errors';
import { Api as ApiInterface } from './interfaces';

const MILLIS_IN_SEC = 1000;
// In seconds
const PRE_REFRESH_TOKEN_TIME = 10;

export class Api extends Connection implements ApiInterface {
    private authData?: AuthData;

    private eventListener?: EventListener;
    private tokenRefreshTimer = undefined;

    private refreshedTokens: string[] = [];

    public isAuthorized() {
        return this.authData !== undefined;
    }

    private async getResponse<T>(promise): Promise<T> {
        const json = await promise;
        if ('response' in json && 'error' in json) {
            const { response, error }: RestResponse = json;
            if (error !== null) {
                throw new Error(error.message);
            }
            return response as T;
        }

        return json as T;
    }

    private saveTokens(authData: AuthData) {
        // save tokens directly to storage
        this.storage.setItem('accessToken', authData.accessToken);
        this.storage.setItem('refreshToken', authData.refreshToken);
    }

    private removeTokens() {
        // remove tokens from storage
        this.storage.removeItem('accessToken');
        this.storage.removeItem('refreshToken');
    }

    protected onClose(ev: CloseEvent) {
        if (this.tokenRefreshTimer) {
            clearTimeout(this.tokenRefreshTimer);
        }
        super.onClose(ev);
    }

    public async listen(onEvent: EventListener) {
        if (this.eventListener)
            throw new Error('listen() can be called only once');
        this.eventListener = onEvent;
    }

    public async getToken(walletAuth: WalletAuth): Promise<AuthData> {
        const params: AuthRequestParams = { tmpToken: walletAuth.token };
        const affiliateID = this.storage.getItem('affiliate_id');
        if (affiliateID) {
            params.affiliateID = affiliateID;
            this.storage.removeItem('affiliate_id');
        }
        const auth = await fetch(`${this.params.httpUrl}/auth`, {
            method: 'POST',
            body: JSON.stringify(params),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return auth.json() as Promise<AuthData>;
    }

    public async refreshToken(authData: AuthData): Promise<AuthData> {
        if (this.refreshedTokens.includes(authData.refreshToken))
            return Promise.resolve(authData);
        this.refreshedTokens.push(authData.refreshToken);
        const auth = await fetch(`${this.params.httpUrl}/refresh_token`, {
            method: 'POST',
            body: JSON.stringify({
                refreshToken: authData.refreshToken,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return this.getResponse(auth.json());
    }

    public async logout(authData: AuthData): Promise<boolean> {
        const response = await fetch(`${this.params.httpUrl}/logout`, {
            method: 'POST',
            body: JSON.stringify({
                accessToken: authData.accessToken,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            // remove tokens from storage
            this.removeTokens();
        }

        let json;
        try {
            json = await response.json();
        } catch (e) {
            // empty json response, old backend version
            return response.ok;
        }

        return this.getResponse(Promise.resolve(json));
    }

    public async optout(authData: AuthData): Promise<boolean> {
        const response = await fetch(`${this.params.httpUrl}/optout`, {
            method: 'POST',
            body: JSON.stringify({
                accessToken: authData.accessToken,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        // remove tokens from storage
        this.removeTokens();
        return this.getResponse(response.json());
    }

    public async auth(authData: AuthData) {
        const planRefresh = () => {
            console.log('SDK planRefresh');
            const refresh = async () => {
                console.log('SDK refresh');
                try {
                    this.authData = await this.refreshToken(this.authData);
                    this.eventEmitter.emit('tokensUpdate', this.authData);
                    // save tokens directly to storage
                    this.saveTokens(this.authData);
                    planRefresh();
                } catch (e) {
                    // remove tokens from storage if expired
                    this.removeTokens();
                    console.error('Token autoRefresh failed');
                }
            };
            const decoded = jwt.decode(this.authData.accessToken, {
                complete: true,
            });
            console.log('SDK token', { decoded });
            const exp = (decoded as { payload: { exp: number } }).payload!!.exp;

            const nowTime = new Date().getTime() / MILLIS_IN_SEC;

            if (this.params.autoRefresh) {
                const refreshAfter = exp - nowTime - PRE_REFRESH_TOKEN_TIME;
                console.log('SDK autoRefresh params', { refreshAfter });
                if (this.tokenRefreshTimer) {
                    clearTimeout(this.tokenRefreshTimer);
                }
                if (this.webSocket.readyState === WebSocket.OPEN) {
                    this.tokenRefreshTimer = setTimeout(
                        refresh,
                        refreshAfter * MILLIS_IN_SEC
                    );
                }
            }
        };

        // Try to auth, update authData tokens if authRefresh is enabled
        try {
            const accountInfo = await this.send<AccountInfo>('auth', {
                token: authData.accessToken,
            });
            this.authData = authData;
            // save tokens directly to storage
            this.saveTokens(authData);

            console.log('SDK call planRefresh 1');
            planRefresh();
            return accountInfo;
        } catch (e) {
            if (!this.params.autoRefresh) throw e;
            if (e instanceof TokenExpiredError) {
                try {
                    authData = await this.refreshToken(authData);
                } catch (refreshE) {
                    // remove tokens from storage if expired
                    this.removeTokens();
                    // Throw e just to be more comfortable catching in front
                    throw e;
                }
                console.log(authData);
                const accountInfo = await this.send<AccountInfo>('auth', {
                    token: authData.accessToken,
                });
                this.eventEmitter.emit('tokensUpdate', authData);
                // save tokens directly to storage
                this.saveTokens(authData);
                this.authData = authData;

                console.log('SDK call planRefresh 2');
                planRefresh();
                return accountInfo;
            }
            throw e;
        }
    }

    public newGame(
        casinoId: string,
        gameId: string,
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
        return this.send<AccountInfo>('account_info');
    }

    public fetchGames() {
        return this.send<Game[]>('fetch_games');
    }

    public fetchSessions() {
        return this.send<GameSession[]>('fetch_sessions');
    }

    public async subscribe() {
        const resp = await this.send('subscribe');
        this.subscribed = true;
        return resp;
    }

    public fetchGlobalSessions(filter: 'all' | 'wins' | 'losts') {
        return this.send<GameSession[]>('fetch_global_sessions', {
            filter,
        });
    }

    public fetchCasinoSessions(
        filter: 'all' | 'wins' | 'losts',
        casinoId: string
    ) {
        return this.send<GameSession[]>('fetch_casino_sessions', {
            filter,
            casinoId,
        });
    }

    public fetchGamesInCasino(casinoId: string) {
        return this.send<CasinoGame[]>('fetch_games_in_casino', {
            casinoId,
        });
    }

    public fetchSessionUpdates(sessionId: string) {
        // eslint-disable-next-line
        return this.send<GameSessionUpdate<any>[]>(
            'fetch_session_updates',
            {
            sessionId,
        });
    }

    public fetchCasinos() {
        return this.send<Casino[]>('fetch_casinos');
    }

    public gameAction(
        sessionId: string,
        actionType: number,
        params: number[],
        deposit = ''
    ) {
        const payload = {
            sessionId,
            actionType,
            params,
            deposit,
        };
        return this.send('game_action', payload);
    }

    private static isHasProtocol(url: string) {
        try {
            const u = new URL(url);
            return u.protocol !== 'localhost:';
        } catch (e) {
            return false;
        }
    }

    // URL should not contain schema!
    public static async connect(
        url: string,
        params: ConnectionParams = {}
    ): Promise<Api> {
        // If we can construct URL - user provided schema
        if (Api.isHasProtocol(url))
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
                autoReconnect: params.autoReconnect || false,
                autoRefresh: params.autoRefresh || false,
                secure,
            },
            webSocket,
            localStorage
        );
    }
}

export const connect = Api.connect;
