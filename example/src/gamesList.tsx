import React from "react";
import {Game} from "@daocasino/platform-back-js-lib";
import {ButtonBase, Grid, Paper} from "@material-ui/core";
import {GameCard} from "./gameCard";


export const GamesList: React.FC<{ games: Game[], selectedGame: string, onSelect: (id: string) => any }> = (props) => {
    const {games, onSelect, selectedGame} = props;

    return <Grid container justify="center" spacing={2}>
        {games.map((game) => (
            <Grid key={game.id} item>
                <ButtonBase onClick={() => onSelect(game.id)}>
                    <Paper style={{backgroundColor: game.id === selectedGame ? "aqua" : undefined, padding: 10}}>
                        <GameCard game={game}/>
                    </Paper>
                </ButtonBase>
            </Grid>
        ))}
    </Grid>;
};
