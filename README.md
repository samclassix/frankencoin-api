## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ yarn install
```

## create .env (see: .env.example)

```
PORT=3030
CONFIG_PROFILE=localhostMainnet
COINGECKO_API_KEY=CG-asdf
RPC_URL_MAINNET=https://eth-mainnet.g.alchemy.com/v2/asdf
RPC_URL_POLYGON=https://polygon-mainnet.g.alchemy.com/v2/asdf
```

## Adjust default profile app.config.ts

```
export const CONFIG_PROFILE = process.env.CONFIG_PROFILE || 'mainnet'; // <<<<<< SELECT DEFAULT CONFIG HERE <<<<<<
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## License

Nest is [MIT licensed](LICENSE).
This repo is [MIT licensed](LICENSE).
