import React from 'react';
import {connect, PlatformBackendConnection, PlayerInfo} from "platform-back-js-lib";
import {AppBar, Button, TextField, Toolbar, Typography} from "@material-ui/core";

enum State {
    NOT_CONNECTED,
    CONNECTED,
    CONNECTING
}

class App extends React.Component<any, { cstate: State, accountInfo: PlayerInfo | undefined, userName: string }> {
    private connection?: PlatformBackendConnection = undefined;


    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            cstate: State.NOT_CONNECTED,
            accountInfo: undefined,
            userName: "eosio"
        }
        this.connect = this.connect.bind(this)
    }

    connect() {
        (async () => {
            try {
                // First you call connect to create connection. You can close connection or get api
                this.connection = await connect("localhost:8080", this.state.userName, false);

                // Then you call listen to subscribe to backend events and get api object
                const api = await this.connection.listen(() => {
                    // This triggers when backend sends update of game session
                }, () => {
                    // This triggers when the connection is closed
                    this.setState({
                        cstate: State.NOT_CONNECTED
                    })
                });

                // Now you are fully connected
                this.setState({
                    cstate: State.CONNECTED
                })

                // Now you can use backend rpc methods
                this.setState({
                    accountInfo: await api.accountInfo()
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
        const {cstate} = this.state;
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
                        this.connection?.close()
                    }} disabled={cstate !== State.CONNECTED} size={"large"} color={"secondary"} variant={"contained"}
                            style={{margin: 10}}>
                        Disconnect
                    </Button>
                    {this.state.accountInfo && <div>
                        <Typography variant="h6">
                            Backend said your account balance is {this.state.accountInfo.balance}
                        </Typography>
                    </div>}
                </div>
            </div>
        );
    }

}


export default App;
