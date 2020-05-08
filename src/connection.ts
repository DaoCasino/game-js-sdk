import { InMsg, Request, WsError } from './types';

export type Params = {
    wsUrl: string;
    httpUrl: string;
    onClose?: (closeEvent: CloseEvent) => unknown;
    token?: string;
    secure: boolean;
};

export class Connection {
    protected params: Params;
    protected webSocket: WebSocket;

    private requestsCount = 0;
    private requests: Request[] = [];

    private readonly onCloseUser: (ev: CloseEvent) => unknown | undefined;

    protected sendMessage(data: unknown) {
        return this.webSocket.send(JSON.stringify(data));
    }

    public close() {
        this.webSocket.close();
    }

    protected onClose(ev: CloseEvent) {
        this.requests.forEach(req => {
            req.rejecter({ code: -1, message: 'Websocket was closed' });
        });
        if (this.onCloseUser) {
            this.onCloseUser(ev);
        }
    }

    private onMessage(ev: MessageEvent) {
        const data = JSON.parse(ev.data) as InMsg;
        if (data.type === 'response') {
            const request = this.requests.find(req => req.id === data.id);
            if (!request)
                // TODO wft, response to no-request
                return;
            if (data.status === 'ok') {
                request.handler(data.payload);
            } else {
                request.rejecter(data.payload as WsError);
            }
        }
    }

    protected send<T>(request: string, payload: unknown = {}): Promise<T> {
        return new Promise((resolve, reject) => {
            if (this.webSocket.readyState !== WebSocket.OPEN) {
                const err: WsError = {
                    code: -1,
                    message: 'Websocket is already closed',
                };
                reject(err);
                return;
            }
            this.requestsCount++;
            const id = this.requestsCount.toString();
            this.requests.push({
                id,
                handler: payload => {
                    resolve(payload as T);
                },
                rejecter: reject,
            });
            this.sendMessage({
                request,
                id,
                payload,
            });
        });
    }

    protected constructor(params: Params, webSocket: WebSocket) {
        this.params = params;
        this.webSocket = webSocket;

        webSocket.onclose = this.onClose.bind(this);
        webSocket.onmessage = this.onMessage.bind(this);
    }
}
