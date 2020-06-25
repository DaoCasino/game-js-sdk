# Platform JS sdk

This is the frontend library for DaoPlatform

## Architecture

This library is used to work as handy client for platform backend. It is written with TypeScrypt, compiled into JavaScript. It also exports types similar to ones used in backend.

The project is structured as node.js project, containing package.json, so it can be imported as npm module in frontend frameworks like react.js.

## Usage

This library has a simple api. It exports the next methods:

- Connect - creates connection to backend. Takes address of the platform Backend and object with optional params:

    - secure - if true, will use https and wss, else http and ws.

    - autoRefresh - if true, after websocket authorization it will automatically check timeout of authorization tokens and refresh them, firing event emits.

    - onClose - function that is called when socket is closed

- WalletAuth - the constructor that creates WalletAuth object. This can be used to implement authorization via DaoWallet. It takes walletUrl and redirectUrl as params. When constructor is invoked, it checks if token is present in browser url. If so, it stores it inside the created WalletAuth object. Then user can invoke the next methods:

    - clearLocation - removes token from the browser url (if present)

    - getWalletToken - returns stored token (if present, null otherwise)

    - hasToken - returns true if token is stored inside

    - reset - creates new WalletAuth object based on this one

    - auth - redirects browser to DaoWallet to proceed authorization. It takes caisnoName as argument.

Method connect returns api object that can be used to communicate with platform backend. Methods of the api object are described below.

## Api methods

This section describes methods of the api object. This methods work just as rpc calls to methods described in  documentation.

- getToken - used to get access and refresh tokens to authorize in websocket based on DaoWallet token.

    - Takes walletAuth as argument - to get DaoWallet token.

    - Returns access and refresh tokens (as one object).

- auth - authorizes webSocket connection.

    - Takes access and refresh tokens (as one object)

    - Returns information about authorized account, including name and email.

- accountInfo

    - Do not take any arguments.

    - Returns information about authorized account, including name and email.

- fetchCasinos

    - Do not take any arguments.

    - Returns information about casinos in this system.

- fetchGames

    - Do not take any arguments.

    - Returns information about games in this system.

- fetchSessions

    - Do not take any arguments.

    - Returns information about game sessions of authorized account.

- fetchGamesInCasino

    - Takes casinoId as argument.

    - Returns information about games presented in this casino.

- fetchSessionUpdates

    - Takes sessionId as argument.

    - Returns information about updates of this session.

- gameAction - used to do any action in the current game session.

    - Takes sessionId, actionType, params as arguments.

    - Returns nothing.

- newGame - used to create new game sessions.

    - Takes deposit, casinoId, gameId, actionType, actionParams as arguments.

    - Returns information about created GameSession

## Example

You can find example in the example folder of a project. 
It is a react spa that uses this library.

