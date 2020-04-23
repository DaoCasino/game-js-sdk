import React, {useEffect, useState} from "react";
import {Button, CircularProgress, TextField, Typography} from "@material-ui/core";


export const ActiveGameSession: React.FC<{ sessionId: number }> = ({sessionId}) => {
    const [loading, setLoading] = useState(true);
    const [rollValue, setRollValue] = useState("50");
    const [winAmount, setWinAmount] = useState("");
    const fetchUpdates = async () => {
        return window.api!!.fetchSessionUpdates(sessionId);
    }
    const waitForStart = () => {
        fetchUpdates().then(updates => {
            if (!updates.find(update => update.updateType === 1)) {
                setTimeout(waitForStart, 1000)
                return;
            }
            setLoading(false)
        })
    }
    const waitForActionComplete = () => {
        fetchUpdates().then(updates => {
            const update = updates.find(update => update.updateType === 4);
            if (!update) {
                setTimeout(waitForActionComplete, 1000)
                return;
            }
            setWinAmount(update.data.player_win_amount)
            setLoading(false)
        })
    }
    useEffect(() => {
        waitForStart()
    }, [])

    if (loading)
        return <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
        }}>
            <CircularProgress/>
        </div>

    return <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
    }}>
        {!winAmount && <>
            <Typography variant={"h6"}>
                Game session is waiting till you roll the dice!
            </Typography>
            <TextField name={"Roll value"} value={rollValue} onChange={e => setRollValue(e.target.value)}/>
            <Button color={"primary"} variant={"contained"} style={{margin: 10}} onClick={() => {
                setLoading(true)
                window.api!!.gameAction(sessionId, 0, [Number(rollValue)])
                    .then(() => waitForActionComplete())
                    .catch(e => {
                        console.log(e)
                    });
            }}>
                Roll!
            </Button>
        </>}
        {winAmount && <>
            <Typography variant={"h6"}>
                You {winAmount.startsWith("-") ? "lose" : "win"}!
            </Typography>
            <Typography variant={"h6"}>
                Your win is {winAmount}
            </Typography>
        </>}
    </div>
};
