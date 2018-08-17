var sodium = require('sodium-native')
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
    null,
    self.keypair.publicKey,
    self.keypair.secretKey,
    remoteKey
  )

  var discoveryPk = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES)
  var discoverySk = sodium.sodium_malloc(sodium.crypto_sign_SECRETKEYBYTES)
  sodium.crypto_sign_seed_keypair(discoveryPk, discoverySk, rendevousPoint)

  self.dht.put({
    v: message,
    k: discoveryPk,
    seq: 0,
    sign: function (buf) {
      var sig = Buffer.alloc(sodium.crypto_sign_BYTES)
      sodium.crypto_sign_detached(sig, buf, discoverySk)
      return sig
    }
  }, cb)
}

Rendezvous.prototype.read = function (remoteKey, cb) {
  assert(remoteKey.byteLength === sodium.crypto_kx_PUBLICKEYBYTES)

  var self = this
  var rendevousPoint = Buffer.allocUnsafe(sodium.crypto_kx_SESSIONKEYBYTES)

  sodium.crypto_kx_client_session_keys(
    null,
    rendevousPoint,
    self.keypair.publicKey,
    self.keypair.secretKey,
    remoteKey
  )

  var discoveryPk = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES)
  var discoverySk = sodium.sodium_malloc(sodium.crypto_sign_SECRETKEYBYTES)
  sodium.crypto_sign_seed_keypair(discoveryPk, discoverySk, rendevousPoint)
  var hash = crypto.createHash('sha1').update(discoveryPk).digest()

  self.dht.get(hash, {
    verify: sodium.crypto_sign_verify_detached,
    cache: false
  }, cb)
}
