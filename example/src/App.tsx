import React from 'react';
import {Api, AuthData, connect, AccountInfo, TokenExpiredError, WalletAuth, GameService} from "@daocasino/platform-back-js-lib";
import {AppBar, Button, Divider, Switch, Toolbar, Typography} from "@material-ui/core";
import NewGame from "./newGame";
import {ActiveGameSession} from "./activeGameSession";
import config from "./config";

enum State {
    NOT_CONNECTED,
    CONNECTED,
    CONNECTING
}

enum Mode {
    NEW_GAME,
    SESSION
}

declare global {
    interface Window {
        api?: Api
    }
}

const initialState = {
    cstate: State.NOT_CONNECTED,
    accountInfo: undefined as AccountInfo | undefined,
    gameService: undefined as GameService | undefined,
    mode: Mode.NEW_GAME
}

class App extends React.Component<any, typeof initialState> {
    // Create walletAuth object to be able to do authorization via DaoWallet
    // It automatically takes token from location if present
    private walletAuth = new WalletAuth(config.walletUrl, config.walletAuthRedirectUrl);

    constructor(props: any, context: any) {
        super(props, context);

        // Remove token from the window location
        this.walletAuth.clearLocation();
        this.state = initialState;

        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");
        if (accessToken && refreshToken) {
            // there are already tokens, can connect immideately
            this.connect();
        }

        this.connect = this.connect.bind(this)
        this.authWithWallet = this.authWithWallet.bind(this)
    }

    authWithWallet() {
        // Redirect to DaoWallet
        this.walletAuth.auth(config.casinoName);
    }

    connect() {
        (async () => {
            try {
                // First you call connect to create api.
                const api = await connect(config.backendAddr, {
                    secure: false,
                    autoRefresh: true,
                    onClose: () => {
                        console.log("onClose");
                        // This triggers when the connection is closed
                        this.setState({
                            cstate: State.NOT_CONNECTED,
                            accountInfo: undefined
                        })
                    }
                });
                window.api = api;

                // Just to show 30 wins, lost or all sessions
                // console.log(await api.fetchGlobalSessions("all"));
                // console.log(await api.fetchGlobalSessions("wins"));
                // console.log(await api.fetchGlobalSessions("losts"));
                //
                // console.log(await api.fetchCasinoSessions("all", "0"))

                // Listen to eventEmitter if it updates tokens
                api.eventEmitter.on("tokensUpdate", (authData: AuthData) => {
                    console.log("eventEmitter tokensUpdate:")
                    console.log(authData);
                    localStorage.setItem("accessToken", authData.accessToken);
                    localStorage.setItem("refreshToken", authData.refreshToken);
                })

                // Then you can authorize using old token or by getting a new one
                const accessToken = localStorage.getItem("accessToken");
                const refreshToken = localStorage.getItem("refreshToken");
                const newLogin = async () => {
                    // Here walletAuth must contain token
                    const newAuthData = await api.getToken(this.walletAuth);
                    localStorage.setItem("accessToken", newAuthData.accessToken);
                    localStorage.setItem("refreshToken", newAuthData.refreshToken);
                    await api.auth(newAuthData)
                }
                if (accessToken && refreshToken) {
                    const authData: AuthData = {
                        accessToken,
                        refreshToken
                    }
                    try {
                        await api.auth(authData)
                    } catch (e) {
                        // if autoRefresh is enabled, there TokenExpiredError is just fired when refreshToken is too old
                        // (barely never or in case of bad token)
                        if (e instanceof TokenExpiredError) {
                            localStorage.removeItem("accessToken");
                            localStorage.removeItem("refreshToken");
                        }
                        console.error(e);
                        return;
                    }
                } else {
                    try {
                        await newLogin();
                    } catch (e) {
                        console.error(e);
                        return;
                    }
                }



                // Then you call subscribe to be able to get websocket updates
                await api.subscribe()

                // Now you are fully connected
                this.setState({
                    cstate: State.CONNECTED
                })

                // Now you can use backend rpc methods
                const accountInfo = await api.accountInfo();
                this.setState({
                    accountInfo,
                })
            } catch (e) {
                // There was error during connection to webSocket
                this.setState({
                    cstate: State.NOT_CONNECTED
                })
                console.error(e)
            }
        })();
    }

    render() {
        const {cstate, mode, gameService} = this.state;
        const canAuth = this.walletAuth.hasToken() || localStorage.getItem("accessToken");
        return (
            <div style={{width: "100%"}}>
                <AppBar position="static">
                    <Toolbar>
                        <Typography variant="h6">
                            {cstate === State.NOT_CONNECTED && "Not connected"}
                            {cstate === State.CONNECTING && "Connecting..."}
                            {cstate === State.CONNECTED && "Connected!"}
                        </Typography>
                    </Toolbar>
                </AppBar>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 10
                }}>
                    <Button onClick={this.authWithWallet} disabled={!(cstate === State.NOT_CONNECTED && !canAuth)} size={"large"}
                            color={"primary"} variant={"contained"} style={{margin: 10}}>
                        Auth with wallet
                    </Button>
                    <Button onClick={() => {
                        localStorage.removeItem("accessToken");
                        localStorage.removeItem("refreshToken");
                        this.walletAuth = this.walletAuth.reset();
                        this.setState({});
                    }} disabled={!(cstate === State.NOT_CONNECTED)} size={"large"}
                            color={"primary"} variant={"contained"} style={{margin: 10}}>
                        Clear auth data
                    </Button>
                    <Button onClick={this.connect} disabled={!(cstate === State.NOT_CONNECTED && canAuth)} size={"large"}
                            color={"primary"} variant={"contained"} style={{margin: 10}}>
                        Connect!
                    </Button>
                    <Button onClick={() => {
                        window.api?.close();
                    }} disabled={cstate !== State.CONNECTED} size={"large"} color={"secondary"} variant={"contained"}
                            style={{margin: 10}}>
                        Disconnect
                    </Button>
                    {this.state.accountInfo &&
                    <div>
                        <Typography variant="h6">
                            Backend said your account balance is {this.state.accountInfo.balance}<br/>
                            Backend said your account name is {this.state.accountInfo.accountName}<br/>
                            Backend said your account email is {this.state.accountInfo.email}<br/>
                        </Typography>
                        <Divider style={{margin: 20}}/>
                        <div style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            <Typography variant={"h6"}>
                                New Game
                            </Typography>
                            <Switch
                                checked={mode === Mode.SESSION}
                                onChange={(e) => {
                                    this.setState({
                                        mode: e.target.checked ? Mode.SESSION : Mode.NEW_GAME
                                    })
                                }}
                                disabled={!gameService}
                            />
                            <Typography variant={"h6"}>
                                Active Game
                            </Typography>
                        </div>
                        {mode === Mode.NEW_GAME &&
                        <NewGame accountInfo={this.state.accountInfo}
                                 onStarted={(gameService) => {
                                     this.setState({
                                         gameService,
                                         mode: Mode.SESSION
                                     })
                                 }}/>}
                        {gameService && mode === Mode.SESSION &&
                        <ActiveGameSession gameService={gameService}/>}
                    </div>
                    }
                </div>
            </div>
        );
    }
}


export default App;
