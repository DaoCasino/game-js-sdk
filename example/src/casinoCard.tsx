import React from "react";
import {Casino} from "@daocasino/platform-back-js-lib";
import {Card, CardContent, Typography} from "@material-ui/core";


export const CasinoCard: React.FC<{ casino: Casino }> = ({casino}) => {
    return <Card style={{backgroundColor: "aquamarine"}}>
        <CardContent>
            <Typography variant={"h6"}>
                ID: {casino.id}
            </Typography>
            <Typography variant={"h6"}>
                Name: {casino.contract}
            </Typography>
        </CardContent>
    </Card>;
};
