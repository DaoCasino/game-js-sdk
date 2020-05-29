import React, {useState} from "react";
import {Button, TextField, Typography} from "@material-ui/core";
import {GameSession} from "@daocasino/platform-back-js-lib";


export const StartGame: React.FC<{ gameId: string, casinoId: string, onStarted: (gameSession: GameSession) => any }> =
    ({gameId, casinoId, onStarted}) => {
        const [deposit, setDeposit] = useState("1.0000 BET");
        const [rollNumber, setRollNumber] = useState("50");
        return <div>
            <Typography gutterBottom variant={"h6"}>
                Please enter desired deposit and roll number
            </Typography>
            <TextField name={"Deposit"} value={deposit} onChange={e => setDeposit(e.target.value)} fullWidth/>
            <TextField name={"Roll value"} value={rollNumber} onChange={e => setRollNumber(e.target.value)} fullWidth/>
            <Button fullWidth variant={"contained"} autoFocus onClick={() => {
                // first action type for dice in '0'
                window.api!!.newGame(casinoId, gameId, deposit, 0, [Number(rollNumber)]).then((session) => {
                    onStarted(session)
                }).catch(e => console.error(e))
            }} color="secondary">
                Start!
            </Button>
        </div>;
    };
