import {Casino, Game, GameSession, GameSessionUpdate, PlayerInfo} from "./types";

type Request = {
    id: string,
    handler: (payload) => any
    rejecter: (reason: WsError) => any
}

type WsError = {
    code: number,
    message: string
}

type InMsg = {
    type: "response" | "update"
    id: string,
    status: "ok" | "error",
    payload: any
}

type Listener = () => any;

enum State {
    INIT,
    READY,
    CLOSED
}

export class Api {
    private readonly sendMessage: (data: any) => any;

    private requestsCount = 0;
    private requests: Request[] = [];

    private state = State.INIT;
    private listener: Listener = undefined;

    constructor(sendMessage: (data: any) => any) {
        this.sendMessage = sendMessage;
    }

    // PUBLIC API METHODS

    public newGame(deposit: string, casinoId: number, gameId: number) {
        return this.send<GameSession>("new_game", {
            deposit,
            casinoid: casinoId,
            gameid: gameId
        });
    }

    public accountInfo() {
        return this.send<PlayerInfo>("account_info");
    }

    public fetchGames() {
        return this.send<Game[]>("fetch_games");
    }

    public fetchSessionUpdates(sessionId: number) {
        return this.send<GameSessionUpdate[]>("fetch_session_updates", {
            sessionId
        });
    }

    public fetchCasinos() {
        return this.send<Casino[]>("fetch_casinos");
    }

    public gameAction(sessionId: number, actionType: number, params: number[]) {
        return this.send("game_action", {
            sessionId,
            actionType,
            params
        });

    }

    // PUBLIC API METHODS END

    /** @internal */
    public auth(accessToken: string) {
        return this.send("auth", {
            token: accessToken
        });
    }

    private send<T>(request: string, payload: any = {}): Promise<T> {
        return new Promise((resolve, reject) => {
            if (this.state === State.CLOSED) {
                const err: WsError = {
                    code: -1,
                    message: "Websocket is already closed"
                }
                reject(err);
                return;
            }
            if (this.state === State.READY && !this.listener) {
                const err: WsError = {
                    code: -1,
                    message: "Cannot call api methods before calling listen()"
                }
                reject(err);
                return;
            }
            this.requestsCount++;
            const id = this.requestsCount.toString();
            this.requests.push({
                id,
                handler: (payload) => {
                    resolve(payload);
                },
                rejecter: reject
            })
            this.sendMessage({
                request,
                id,
                payload
            })
        })
    }

    /** @internal */
    public onMessage(ev: MessageEvent) {
        const data = JSON.parse(ev.data) as InMsg;
        if (data.type === "response") {
            const request = this.requests.find(req => req.id === data.id);
            if (!request)
                // TODO wft, response to no-request
                return;
            if (data.status === "ok") {
                request.handler(data.payload)
            } else {
                request.rejecter(data.payload as WsError)
            }
        }
    }

    /** @internal */
    public close() {
        this.state = State.CLOSED;
        this.requests.forEach(req => {
            req.rejecter({code: -1, message: "Websocket was closed"});
        });
    }

    /** @internal */
    public setListener(listener: Listener) {
        if (this.listener)
            throw new Error("listen() can be called only once");
        this.state = State.READY;
        this.listener = listener;
    }
}
