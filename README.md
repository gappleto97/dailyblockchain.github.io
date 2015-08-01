Blockchain Visualization
=========================

This is the reference implementation of my Blockchain Visualizer project. The backend is currently under development, and will aggregate the necessary data. This will allow other implementations (such as one in Java, C++, etc) to visualize the blockchain in real time.

The Javascript implementation utilizes Vivagraph.js to map out bitcoin transactions in real time. It is forked from [dailyblockchain.github.io](http://dailyblockchain.github.io). The backend is currently leveraging the Blockchain.info API, but will soon include others to give a larger and more accurate picture of Bitcoin.

Currently proposed data definitions:

New Block:

  {
    "op": "block",
    "x": {
        "txs": [
            (see transaction def.)
        ],
        "nTx": 0,
        "totalBTCSent": 0,
        "estimatedBTCSent": 0,
        "reward": 0,
        "size": 0,
        "blockIndex": 190460,
        "prevBlockIndex": 190457,
        "height": 170359,
        "hash": "00000000000006436073c07dfa188a8fa54fefadf571fd774863cda1b884b90f",
        "mrklRoot": "94e51495e0e8a0c3b78dac1220b2f35ceda8799b0a20cfa68601ed28126cfcc2",
        "version": 1,
        "time": 1331301261,
        "bits": 436942092,
        "nonce": 758889471
    }
  }

New Transaction:

  {
    "op": "utx",
    "x": {
        "hash": "f6c51463ea867ce58588fec2a77e9056046657b984fd28b1482912cdadd16374",
        "ver": 1,
        "vin_sz": 4,
        "vout_sz": 2,
        "lock_time": "Unavailable",
        "size": 796,
        "relayed_by": "209.15.238.250",
        "tx_index": 3187820,
        "time": 1331300839,
        "counterparty": true,
        "cp_asset_type": "gems",
        "cp_asset_count": 24.0,
        "cp_tx_type": "issuance",
        "inputs": [
            {
                "prev_out": {
                    "value": 10000000,
                    "type": 0,
                    "addr": "12JSirdrJnQ8QWUaGZGiBPBYD19LxSPXho",
                    "colored": true,
                    "asset_id": "AN51SPP6iZBHFJ3aux1jtn6MMMD13Gh3t7",
                    "asset_quantity": "500"
                }
            }
        ],
        "out": [
            {
                "value": 2800000000,
                "type": 0,
                "addr": "1FzzMfNt46cBeS41r6WHDH1iqxSyzmxChw",
                "colored": false,
                "asset_id": null,
                "asset_quantity": null
            }
        ]
    }
  }

This is being created in partnership with [bits.coinlaunch.com](http://bits.coinlaunch.com).
