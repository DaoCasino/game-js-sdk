import { InMsg, Request, WsErrorMsg } from './types';
import { wsError } from './errors';
import { DEFAULT_PLATFORM_ID } from './constants';

export type Params = {
    wsUrl: string;
    httpUrl: string;
    onClose?: (closeEvent: CloseEvent) => unknown;
    secure: boolean;
};

export class WalletAuth {
    private readonly walletUrl: string;
    private readonly redirectUrl: URL;
    private readonly platformId: string;
    public readonly token: string | null;

    constructor(
        walletUrl: string,
        redirectUrl: string,
        platformId = DEFAULT_PLATFORM_ID
    ) {
        this.walletUrl = walletUrl;
        this.redirectUrl = new URL(redirectUrl);
        this.platformId = platformId;
        this.token = this.getWalletToken();
    }

    public reset(): WalletAuth {
        return new WalletAuth(
            this.walletUrl,
            this.redirectUrl.toString(),
            this.platformId
        );
    }

    public hasToken(): boolean {
        return this.token && this.token !== '';
    }

    public auth(casinoName: string) {
        const url = new URL('/auth', this.walletUrl);
        const redirectToTrim = this.redirectUrl.toString();
        const redirect = redirectToTrim.endsWith('/')
            ? redirectToTrim.slice(0, -1)
            : redirectToTrim;
        url.searchParams.append('name', casinoName);
        url.searchParams.append('url', redirect);
        url.searchParams.append('id', this.platformId);

        window.location.href = url.toString();
    }

    private getWalletToken(): string | null {
        const url = new URL(window.location.toString());

        const clearUrl = new URL(window.location.toString());
        clearUrl.searchParams.forEach((value, key) => {
            clearUrl.searchParams.delete(key);
        });
        if (clearUrl.toString() !== this.redirectUrl.toString()) return null;

        return url.searchParams.get('token');
    }

    public clearLocation() {
        const url = new URL(window.location.toString());
        url.searchParams.delete('token');
        window.history.pushState({}, document.title, url.toString());
    }
}

export class Connection {
    protected params: Params;
    protected webSocket: WebSocket;

    private requestsCount = 0;
    private requests: Request[] = [];

    protected sendMessage(data: unknown) {
        return this.webSocket.send(JSON.stringify(data));
    }

    public close() {
        this.webSocket.close();
    }

    protected onClose(ev: CloseEvent) {
        this.requests.forEach(req => {
            req.rejecter(wsError(-1, 'Websocket was closed'));
        });
        if (this.params.onClose) {
            this.params.onClose(ev);
        }
    }

    private onMessage(ev: MessageEvent) {
        const data = JSON.parse(ev.data) as InMsg;
        if (data.type === 'response') {
            const request = this.requests.find(req => req.id === data.id);
            if (!request)
                // Have to be unreachable unless server responses to not-sent request
                return;
            if (data.status === 'ok') {
                request.handler(data.payload);
            } else {
                const errorMsg = data.payload as WsErrorMsg;
                const error = wsError(errorMsg.code);
                request.rejecter(error);
            }
        }
    }

    protected send<T>(request: string, payload: unknown = {}): Promise<T> {
        return new Promise((resolve, reject) => {
            if (this.webSocket.readyState !== WebSocket.OPEN) {
                reject(wsError(-1, 'Websocket is already closed'));
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
