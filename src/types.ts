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
