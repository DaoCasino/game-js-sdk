import React from 'react';
import {Api, connect, PlatformBackendConnection, PlayerInfo} from "@daocasino/platform-back-js-lib";
import {AppBar, Button, Divider, Switch, TextField, Toolbar, Typography} from "@material-ui/core";
import NewGame from "./newGame";
import {ActiveGameSession} from "./activeGameSession";

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
        connection?: PlatformBackendConnection;
        api?: Api
    }
}

const initialState = {
    cstate: State.NOT_CONNECTED,
    accountInfo: undefined as PlayerInfo | undefined,
    userName: "tplayer",
    sessionId: -1,
    mode: Mode.NEW_GAME
}

class App extends React.Component<any, typeof initialState> {

    constructor(props: any, context: any) {
        super(props, context);
        this.state = initialState;
        this.connect = this.connect.bind(this)
    }

    connect() {
        (async () => {
            try {
                // First you call connect to create connection. You can close connection or get api
                window.connection = await connect("localhost:8080", this.state.userName, false);

                // Then you call listen to subscribe to backend events and get api object
                const api = await window.connection.listen(() => {
                    // This triggers when backend sends update of game session
                }, () => {
                    // This triggers when the connection is closed
                    this.setState({
                        cstate: State.NOT_CONNECTED,
                        accountInfo: undefined
                    })
                });
                window.api = api;

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
        const {cstate, mode, sessionId} = this.state;
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
                    <Typography variant="h6">
                        Enter the account name:
                    </Typography>
                    <TextField value={this.state.userName} onChange={(e) => {
                        this.setState({
                            userName: e.target.value
                        })
                    }} name={"Account name"}/>
                    <Button onClick={this.connect} disabled={cstate !== State.NOT_CONNECTED} size={"large"}
                            color={"primary"} variant={"contained"} style={{margin: 10}}>
                        Connect!
                    </Button>
                    <Button onClick={() => {
                        window.connection?.close()
                    }} disabled={cstate !== State.CONNECTED} size={"large"} color={"secondary"} variant={"contained"}
                            style={{margin: 10}}>
                        Disconnect
                    </Button>
                    {this.state.accountInfo &&
                    <div>
                        <Typography variant="h6">
                            Backend said your account balance is {this.state.accountInfo.balance}<br/>
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
                                disabled={sessionId === -1}
                            />
                            <Typography variant={"h6"}>
                                Active Game
                            </Typography>
                        </div>
                        {mode === Mode.NEW_GAME &&
                        <NewGame accountInfo={this.state.accountInfo} userName={this.state.userName}
                                 onStarted={(sessionId) => {
                                     this.setState({
                                         sessionId,
                                         mode: Mode.SESSION
                                     })
                                 }}/>}
                        {sessionId !== -1 && mode === Mode.SESSION &&
                        <ActiveGameSession sessionId={sessionId}/>}
                    </div>
                    }
                </div>
            </div>
        );
    }
}


export default App;
