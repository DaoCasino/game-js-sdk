export type PlayerInfo = {
    balance: string;
    activePermission: string;
    ownerPermission: string;
    linkedCasinos: string;
};

export type Casino = {
    id: number;
    contract: string;
    paused: boolean;
};

export type Game = {
    id: number;
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
    value: number;
};

export type CasinoGame = {
    gameId: number;
    paused: boolean;
    params: GameParams[];
};

export type GameSession = {
    id: number;
    player: string;
    casinoID: number;
    gameID: number;
    blockchainSesID: number;
    state: number;
};

export type GameSessionUpdate = {
    sessionId: number;
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