export type PlayerInfo = {
    balance: string,
    activePermission: string,
    ownerPermission: string,
    linkedCasinos: string
}

export type Casino = {
    id: number,
    contract: string,
    paused: boolean
}

export type Game = {
    id: number,
    contract: string,
    params_cnt: number,
    paused: number
}

export type GameSession = {
    id: number,
    player: string,
    casinoID: number,
    gameID: number,
    blockchainSesID: number,
    state: number
}

export type GameSessionUpdate = {
    sessionId:  number,
    updateType: number,
    timestamp:  number,
    data:       any
}

export enum SessionState {
    NewGameTrxSent = 0,
    GameStartedInBC = 1,
    RequestedGameAction = 2,
    GameActionTrxSent = 3,
    RequestedSignidicePartOne = 4,
    SignidicePartOneTrxSent = 5,
    GameFinished = 6,
    GameFailed = 7,
}
