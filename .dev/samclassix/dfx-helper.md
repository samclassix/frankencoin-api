# Frankencoin - Api

> OpenApi Swagger: https://api.frankencoin.org

## DFX Helper

## https://api.frankencoin.org/ecosystem/collateral/stats

Response body

```
{
  "num": 8,
  "addresses": [
    "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    "0x8747a3114ef7f0eebd3eb337f745e31dbf81a952",
    "0x1ba26788dfde592fec8bcb0eaff472a42be341b2",
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
    "0x8c1bed5b9a0928467c9b1341da1d7bd5e10b6549",
    "0x553c7f9c780316fc1d34b8e14ac2465ab22a090b",
    "0x2e880962a9609aa3eab4def919fe9e917e99073b"
  ],
  "totalValueLocked": {
    "usd": 17439345.571799956,
    "chf": 16102812.162326828
  },
  "map": {
    "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": {
      "address": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      "name": "Wrapped BTC",
      "symbol": "WBTC",
      "decimals": 8,
      "positions": {
        "total": 15,
        "open": 11,
        "requested": 0,
        "closed": 4,
        "denied": 0,
        "originals": 2,
        "clones": 13
      },
      "totalBalance": {
        "raw": 8830900744,
        "amount": 88.30900744
      },
      "totalValueLocked": {
        "usd": 5349583.05270032,
        "chf": 4939596.539889493
      },
      "price": {
        "usd": 60578,
        "chf": 55935.36
      }
    },
    "0x8747a3114ef7f0eebd3eb337f745e31dbf81a952": {
      "address": "0x8747a3114Ef7f0eEBd3eB337F745E31dBF81a952",
      "name": "Draggable quitt.shares",
      "symbol": "DQTS",
      "decimals": 0,
      "positions": {
        "total": 1,
        "open": 1,
        "requested": 0,
        "closed": 0,
        "denied": 0,
        "originals": 1,
        "clones": 0
      },
      "totalBalance": {
        "raw": 250000,
        "amount": 250000
      },
      "totalValueLocked": {
        "usd": 2227500,
        "chf": 2056786.7036011082
      },
      "price": {
        "usd": 8.91,
        "chf": 8.23
      }
    }

    ...
```

## https://api.frankencoin.org/ecosystem/fps/info

Response body

```
{
  "values": {
    "price": 1179.2163203825417,
    "totalSupply": 9662.88772629495,
    "fpsMarketCapInChf": 11394634.908871155
  },
  "raw": {
    "price": "1179216320382541683086",
    "totalSupply": "9662887726294950166587"
  }
}
```

## https://api.frankencoin.org/ecosystem/frankencoin/info

Response body

```
{
  "erc20": {
    "name": "Frankencoin",
    "address": "0xB58E61C3098d85632Df34EecfB899A1Ed80921cB",
    "symbol": "ZCHF",
    "decimals": 18
  },
  "chain": {
    "name": "Ethereum",
    "id": 1
  },
  "price": {
    "usd": 1.08
  },
  "total": {
    "mint": 10139638.486907825,
    "burn": 985951.2522128457,
    "supply": 9153687.23469498
  },
  "raw": {
    "mint": "10139638486907824056138529",
    "burn": "985951252212845786819674"
  },
  "counter": {
    "mint": 252,
    "burn": 87
  }
}
```

## https://api.frankencoin.org/ecosystem/frankencoin/mintburnmapping

Response body

```
{
  "num": 62,
  "addresses": [
    "0x0000000000a84d1a9b0063a910315c7ffa9cd248",
    "0x0000f70bc78af03f14132c68b59153e4788bab20",
    "0x0273308ef6bf133756fd57e2252ca526bd43b234",
    "0x055c75620c89b086d3f444b3e2714384c55af5ed",
    "0x0ab6527027ecff1144dec3d78154fce309ac838c",
    "0x0cc8ef9f687232eb39021b83acd23ca4c73cdf31",
    ...
    ...
    ...
  ],
  "map": {
    "0x0000000000a84d1a9b0063a910315c7ffa9cd248": {
      "mint": "27597186934476206898589",
      "burn": "13841700160715191803830"
    },
    "0x0000f70bc78af03f14132c68b59153e4788bab20": {
      "mint": "185017745816288109306",
      "burn": "0"
    },
    "0x0273308ef6bf133756fd57e2252ca526bd43b234": {
      "mint": "398728109739000000000",
      "burn": "0"
    },
    "0x055c75620c89b086d3f444b3e2714384c55af5ed": {
      "mint": "867795769740452186986",
      "burn": "0"
    },
    "0x0ab6527027ecff1144dec3d78154fce309ac838c": {
      "mint": "6588952912879958281126",
      "burn": "0"
    },
    ...
    ...
    ...
  }
}
```

## https://api.frankencoin.org/dfx/info

Response body

```
{
  "totalSupplyZchf": 9153687.23469498,
  "totalValueLockedInChf": 16135527.143824244,
  "fpsMarketCapInChf": 11394634.908871155
}
```
