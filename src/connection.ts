import { randString } from './tools';
import { Api } from './api';

export type AuthData = {
    accessToken: string;
    refreshToken: string;
};

export class PlatformBackendConnection {
    private wsUrl: string;
    private httpUrl: string;
    private authData: AuthData;
    private webSocket: WebSocket;
    private readonly api: Api;

    private closed = false;
    private clientOnClose: ((ev: CloseEvent) => any) | undefined = undefined;

    public async listen(
        onEvent: () => any,
        onClose: (closeEvent: CloseEvent) => any
    ): Promise<Api> {
        if (this.closed) throw new Error('Connection is already closed');
        this.clientOnClose = onClose;
        this.api.setListener(onEvent);
        return this.api;
    }

    public close() {
        this.webSocket.close();
    }

    private onClose(ev: CloseEvent) {
        this.closed = true;
        if (this.clientOnClose) this.clientOnClose(ev);
        this.api.close();
    }

    private constructor(
        wsUrl: string,
        httpUrl: string,
        authData: AuthData,
        webSocket: WebSocket
    ) {
        this.wsUrl = wsUrl;
        this.httpUrl = httpUrl;
        this.authData = authData;
        this.webSocket = webSocket;

        this.api = new Api(data => this.webSocket.send(JSON.stringify(data)));

        webSocket.onmessage = this.api.onMessage.bind(this.api);
        webSocket.onclose = this.onClose.bind(this);
    }

    // Initializes websocket connection and authorizes it
    static async init(
        wsUrl: string,
        httpUrl: string,
        authData: AuthData
    ): Promise<PlatformBackendConnection> {
        const webSocket = new WebSocket(wsUrl);
        await new Promise((resolve, reject) => {
            webSocket.onopen = resolve;
            webSocket.onclose = reject;
        });
        const conn = new PlatformBackendConnection(
            wsUrl,
            httpUrl,
            authData,
            webSocket
        );
        await conn.api.auth(authData.accessToken);
        return conn;
    }
}

export async function connect(
    url: string,
    account: string,
    secure = true
): Promise<PlatformBackendConnection> {
    if (url.startsWith('http') || url.startsWith('ws'))
        throw new Error('The url should not contain connection schema');

    const wsUrl = secure ? `wss://${url}/connect` : `ws://${url}/connect`;
    const httpUrl = secure ? `https://${url}` : `http://${url}`;

    const auth = await fetch(`${httpUrl}/auth`, {
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

    if (!authData.accessToken || !authData.refreshToken) {
        throw new Error('Invalid authorization data');
    }

    return PlatformBackendConnection.init(wsUrl, httpUrl, authData);
}
