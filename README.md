# `rendezvous-point`

[![Build Status](https://travis-ci.org/emilbayes/rendezvous-point.svg?branch=master)](https://travis-ci.org/emilbayes/rendezvous-point)

> Rendezvous points on the DHT where two authenticated peers can leave data

Data could be eg. a `ip:port` pair

## Usage

```js
var rendezvous = require('rendezvous-point')

var keypairA = {publicKey: Buffer.from('...'), secretKey: Buffer.from('...')}
var peerA = rendezvous(dht, keypairA)

var keypairB = {publicKey: Buffer.from('...'), secretKey: Buffer.from('...')}
var peerB = rendezvous(dht, keypairB)

// Leave a message for peerB on the DHT
peerA.write(keypairB.publicKey, Buffer.from('Hello B!'), function (err) {
  if (err) throw err

  peerB.read(keypairA.publicKey, function (err, message) {
    if (err) throw err

    console.log(message.equal(Buffer.from('Hello B!')))
  })
})
```

## API

### `var peer = rendezvous(dht, keypair)`

Create a rendezvous instance for `bittorrent-dht` instance and a given
`libsodium` `X25519` key pair, eg. generated with `crypto_kx_keypair`

### `peer.write(recepientPublicKey, buf, cb)`

Write a message `buf` at the rendezvous point between `keypair` and
`recepientPublicKey`, calling `cb(err, hash)` with any error or the resulting
hash key in the DHT.

### `peer.read(senderPublicKey, cb)`

Read any message at the rendezvous point between `keypair` and
`senderPublicKey`, calling `cb(err, messageObj)` with any error or the message
left in the DHT with the [DHT result object](https://github.com/webtorrent/bittorrent-dht#dhtgethash-opts-callback)


## Design

The rendezvous point is a public key generated from a seed, where the seed is
the shared secret from a Diffie-Hellman key exchange between two peers. This
means that either side can leave messages in the DHT at the rendezvous point,
because both can generate the same key pair. The rendezvous point can therefore
be seen as a shared mailbox between the two peers. A future extension may be to
leave messages encrypted to the other party, so messages are only readable by
the other party and no one else who happens upon the rendezvous point (eg. an
adverse DHT node).

## Install

```sh
npm install rendezvous-point
```

## License

[ISC](LICENSE)
