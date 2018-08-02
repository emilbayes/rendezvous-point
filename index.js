var sodium = require('sodium-native')
var ed = require('ed25519-supercop')
var crypto = require('crypto')
var assert = require('nanoassert')

module.exports = Rendezvous
function Rendezvous (dht, keypair) {
  if (!(this instanceof Rendezvous)) return new Rendezvous(dht, keypair)
  assert(keypair)
  assert(keypair.publicKey.byteLength === sodium.crypto_kx_PUBLICKEYBYTES)
  assert(keypair.secretKey.byteLength === sodium.crypto_kx_SECRETKEYBYTES)

  this.dht = dht
  this.keypair = keypair
}

Rendezvous.prototype.write = function (remoteKey, message, cb) {
  assert(remoteKey.byteLength === sodium.crypto_kx_PUBLICKEYBYTES)
  assert(message.byteLength <= 1000)

  var self = this
  var rendevousPoint = Buffer.allocUnsafe(sodium.crypto_kx_SESSIONKEYBYTES)

  sodium.crypto_kx_server_session_keys(
    rendevousPoint,
    Buffer.alloc(sodium.crypto_kx_SESSIONKEYBYTES),
    self.keypair.publicKey,
    self.keypair.secretKey,
    remoteKey
  )

  var discoveryKeypair = ed.createKeyPair(rendevousPoint)

  self.dht.put({
    v: message,
    k: discoveryKeypair.publicKey,
    seq: 0,
    sign: function (buf) {
      return ed.sign(buf, discoveryKeypair.publicKey, discoveryKeypair.secretKey)
    }
  }, cb)
}

Rendezvous.prototype.read = function (remoteKey, cb) {
  assert(remoteKey.byteLength === sodium.crypto_kx_PUBLICKEYBYTES)

  var self = this
  var rendevousPoint = Buffer.allocUnsafe(sodium.crypto_kx_SESSIONKEYBYTES)

  sodium.crypto_kx_client_session_keys(
    Buffer.alloc(sodium.crypto_kx_SESSIONKEYBYTES),
    rendevousPoint,
    self.keypair.publicKey,
    self.keypair.secretKey,
    remoteKey
  )

  var discoveryKeypair = ed.createKeyPair(rendevousPoint)
  var hash = crypto.createHash('sha1').update(discoveryKeypair.publicKey).digest()

  self.dht.get(hash, {
    verify: ed.verify,
    cache: false
  }, cb)
}
