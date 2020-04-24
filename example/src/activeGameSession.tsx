import React, {useEffect, useState} from "react";
import {Button, CircularProgress, TextField, Typography} from "@material-ui/core";


export const ActiveGameSession: React.FC<{ sessionId: number }> = ({sessionId}) => {
    const [loading, setLoading] = useState(true);
    const [winAmount, setWinAmount] = useState("");
    const fetchUpdates = async () => {
        return window.api!!.fetchSessionUpdates(sessionId);
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
        waitForActionComplete()
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
