const { KeyGen768, Encrypt768, Decrypt768 } = require('./kyber768.js'); // Adjust path as needed
const crypto = require("crypto");
const secp256k1 = require("secp256k1");
const { keccak256 } = require("js-sha3");
const bitcoin = require("bitcoinjs-lib");

// Convert Shared Secret to Entropy
function sharedSecretToEntropy(sharedSecret) {
  const hash = crypto.createHash("sha256");
  hash.update(Buffer.from(sharedSecret));
  return hash.digest(); // 32 bytes of entropy
}

// BTC Key Pair Generation
function generateBTCKeyPair(sharedSecret) {
  const entropy = sharedSecretToEntropy(sharedSecret);
  const privateKey = Buffer.from(entropy);

  if (privateKey.length !== 32) {
    throw new Error("Invalid private key length.");
  }

  // Generate public key in compressed format
  const publicKey = Buffer.from(secp256k1.publicKeyCreate(privateKey, true));

  // Generate BTC address
  const address = bitcoin.payments.p2pkh({
    pubkey: publicKey,
    network: bitcoin.networks.bitcoin, // Mainnet
  }).address;

  return {
    privateKey: privateKey.toString("hex"),
    publicKey: publicKey.toString("hex"),
    address,
  };
}

// ETH Key Pair Generation
function generateETHKeyPair(sharedSecret) {
  const entropy = sharedSecretToEntropy(sharedSecret);
  const privateKey = Buffer.from(entropy);

  if (privateKey.length !== 32) {
    throw new Error("Invalid private key length.");
  }

  // Generate public key
  const publicKey = secp256k1.publicKeyCreate(privateKey, false).slice(1); // Remove prefix byte

  // Generate ETH address
  const address = `0x${keccak256(publicKey).slice(-40)}`;

  return {
    privateKey: privateKey.toString("hex"),
    address,
  };
}

// Main Execution
(async function () {
  try {
    console.log("Generating Kyber768 key pair...");
    const [publicKey, privateKey] = KeyGen768();

    console.log("Public Key:", publicKey);
    console.log("Private Key:", privateKey);

    console.log("Encrypting shared secret...");
    const [ciphertext, sharedSecret] = Encrypt768(publicKey);

    console.log("Ciphertext:", ciphertext);
    console.log("Shared Secret (Sender):", sharedSecret);

    console.log("Decrypting shared secret...");
    const recoveredSecret = Decrypt768(ciphertext, privateKey);

    console.log("Shared Secret (Receiver):", recoveredSecret);

    if (JSON.stringify(sharedSecret) !== JSON.stringify(recoveredSecret)) {
      throw new Error("Shared secrets do not match!");
    }

    console.log("Generating BTC key pair...");
    const btcKeys = generateBTCKeyPair(sharedSecret);
    console.log("BTC Private Key:", btcKeys.privateKey);
    console.log("BTC Public Key:", btcKeys.publicKey);
    console.log("BTC Address:", btcKeys.address);

    console.log("Generating ETH key pair...");
    const ethKeys = generateETHKeyPair(sharedSecret);
    console.log("ETH Private Key:", ethKeys.privateKey);
    console.log("ETH Address:", ethKeys.address);
  } catch (error) {
    console.error("Error:", error.message);
  }
})();
