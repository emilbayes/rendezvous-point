var Rendezvous = require('.')
var sodium = require('sodium-native')

var DHT = require('bittorrent-dht')
var assert = require('nanoassert')

var dht = new DHT()

dht.listen(20000, function loop () {
  var keyA = keygen()
  var keyB = keygen()

  var peerA = new Rendezvous(dht, keyA)
  var peerB = new Rendezvous(dht, keyB)

  peerA.write(keyB.publicKey, Buffer.from('Hello world!'), function (err, hash) {
    if (err) throw err

    peerB.read(keyA.publicKey, function (err, obj) {
      if (err) throw err

      assert(obj.v.equals(Buffer.from('Hello world!')))

      dht.destroy()
    })
  })
})

function keygen () {
  var pk = sodium.sodium_malloc(sodium.crypto_kx_PUBLICKEYBYTES)
  var sk = sodium.sodium_malloc(sodium.crypto_kx_SECRETKEYBYTES)

  sodium.crypto_kx_keypair(pk, sk)

  return {publicKey: pk, secretKey: sk}
}
