import React from "react";
import {Casino} from "@daocasino/platform-back-js-lib";
import {ButtonBase, Grid, Paper} from "@material-ui/core";
import {CasinoCard} from "./casinoCard";


export const CasinoList: React.FC<{ casinos: Casino[], selectedCasino: string, onSelect: (id: string) => any }> = (props) => {
    const {casinos, onSelect, selectedCasino} = props;

    return <Grid container justify="center" spacing={2}>
        {casinos.map((casino) => (
            <Grid key={casino.id} item>
                <ButtonBase onClick={() => onSelect(casino.id)}>
                    <Paper style={{backgroundColor: casino.id === selectedCasino ? "aqua" : undefined, padding: 10}}>
                        <CasinoCard casino={casino}/>
                    </Paper>
                </ButtonBase>
            </Grid>
        ))}
    </Grid>;
};
