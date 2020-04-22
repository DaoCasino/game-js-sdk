import React, {useState} from "react";
import {Button, TextField, Typography} from "@material-ui/core";
import {GameSession} from "platform-back-js-lib";


export const StartGame: React.FC<{ gameId: number, casinoId: number, onStarted: (gameSession: GameSession) => any }> =
    ({gameId, casinoId, onStarted}) => {
        const [deposit, setDeposit] = useState("1.0000 BET");
        return <div>
            <Typography gutterBottom variant={"h6"}>
                Please enter desired deposit
            </Typography>
            <TextField name={"Deposit"} value={deposit} onChange={e => setDeposit(e.target.value)} fullWidth/>
            <Button fullWidth variant={"contained"} autoFocus onClick={() => {
                window.api!!.newGame(deposit, casinoId, gameId).then((session) => {
                    onStarted(session)
                }).catch(e => console.error(e))
            }} color="secondary">
                Start!
            </Button>
        </div>;
    };
