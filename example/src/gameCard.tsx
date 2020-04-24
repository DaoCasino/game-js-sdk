import React from "react";
import {Game} from "@daocasino/platform-back-js-lib";
import {Card, CardContent, Typography} from "@material-ui/core";


export const GameCard: React.FC<{ game: Game }> = ({game}) => {
    return <Card style={{backgroundColor: "aquamarine"}}>
        <CardContent>
            <Typography variant={"h6"}>
                ID: {game.id}
            </Typography>
            <Typography variant={"h6"}>
                Name: {game.contract}
            </Typography>
        </CardContent>
    </Card>;
};
