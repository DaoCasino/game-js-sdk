import React, {useEffect, useState} from "react";
import {CircularProgress, Typography} from "@material-ui/core";
import {GameService, UpdateTypes} from "@daocasino/platform-back-js-lib";


export const ActiveGameSession: React.FC<{ gameService: GameService }> = ({gameService}) => {
    const [loading, setLoading] = useState(true);
    const [winAmount, setWinAmount] = useState("");

    useEffect(() => {
        gameService.waitForUpdate(UpdateTypes.GameFinishedUpdate).then((update) => {
            // @ts-ignore
            setWinAmount(update.data.player_win_amount)
            setLoading(false)
        })
    }, [])

    console.log(winAmount)

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
