

Websocket package, binary format.

`[type, data]`

# Types

## Server to Client

- 0: position
    - data is an Int32Array. 7 ints per player
        - [playerId, x position, y position, 1e6 * x velocity, 1e6 * y velocity, target x velocity, target y velocity]
- 1: other
- 2: player info
- 3: map data
- 4: remove player

## Client to Server

- 0: position
    - data is a bitfield
        - [left, up, right, down]
