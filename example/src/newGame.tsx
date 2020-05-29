import React from 'react';
import {Casino, Game, AccountInfo} from "@daocasino/platform-back-js-lib";
import {Typography} from "@material-ui/core";
import {CasinoList} from "./casinoList";
import {GamesList} from "./gamesList";
import {StartGame} from "./startGameDialog";


const initialState = {
    casinos: [] as Casino[],
    selectedCasino: "",
    games: [] as Game[],
    selectedGame: ""
}

type Props = {
    accountInfo: AccountInfo,
    onStarted: (sessionId: string) => any
}

class NewGame extends React.Component<Props, typeof initialState> {

    constructor(props: any, context: any) {
        super(props, context);
        this.state = initialState;
    }

    componentDidMount(): void {
        (async () => {
            try {
                const api = window.api;

                const casinos = await api!!.fetchCasinos();
                const games = await api!!.fetchGames();
                this.setState({
                    casinos,
                    games
                })
            } catch (e) {
                console.error(e)
            }
        })();
    }

    render() {
        const {onStarted} = this.props;
        const {casinos, games, selectedCasino, selectedGame} = this.state;
        return <div>
            <Typography variant="h6">
                Select casino to play in:
            </Typography>
            <CasinoList casinos={casinos} selectedCasino={selectedCasino}
                        onSelect={id => this.setState({selectedCasino: id})}/>
            {selectedCasino &&
            <div>
                <Typography variant="h6">
                    Select game to play in {casinos.find(c => c.id === selectedCasino)!!.contract}:
                </Typography>
                <GamesList games={games} selectedGame={selectedGame}
                           onSelect={id => this.setState({selectedGame: id})}/>
            </div>}
            {selectedGame &&
            <StartGame gameId={selectedGame} casinoId={selectedCasino}
                       onStarted={session => onStarted(session.id)}/>}
        </div>;
    }
}

export default NewGame;
