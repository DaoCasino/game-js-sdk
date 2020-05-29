export type AccountInfo = {
    accountName: string;
    email: string;
    balance: string;
    activePermission: string;
    ownerPermission: string;
    linkedCasinos: Casino[];
};

export type Casino = {
    id: string;
    contract: string;
    paused: boolean;
};

export type Game = {
    id: string;
    contract: string;
    paramsCnt: number;
    paused: number;
};

export enum GameParamsType {
    minBet = 0,
    maxBet = 1,
}

export type GameParams = {
    type: GameParamsType;
    value: string;
};

export type CasinoGame = {
    gameId: string;
    paused: boolean;
    params: GameParams[];
};

export type GameSession = {
    id: string;
    player: string;
    casinoID: string;
    gameID: string;
    blockchainSesID: string;
    state: number;
};

export type GameSessionUpdate = {
    sessionId: string;
    updateType: number;
    timestamp: number;
    // eslint-disable-next-line
    data: any;
};

export enum SessionState {
    NewGameTrxSent = 0,
    GameStartedInBC = 1,
    RequestedGameAction = 2,
    GameActionTrxSent = 3,
    SignidicePartOneTrxSent = 4,
    GameFinished = 5,
    GameFailed = 6,
}
