// TS3 Protocol Library (ported from DreamSpeak/TSLib)

export { Ts3Client } from './client.ts';
export type { Ts3ClientOptions } from './client.ts';
export { buildCommand, parseCommand, tsEscape, tsUnescape } from './commands.ts';
export type { ParsedCommand } from './commands.ts';
export { eaxEncrypt, eaxDecrypt, deriveKeyNonce, hashPassword, sha1, sha256, sha512 } from './crypto.ts';
export { generateIdentity, generateIdentityAsync, restoreIdentity, fromTsIdentity, fromBase64Key, exportPublicKeyString, getSharedSecret } from './identity.ts';
export type { IdentityData } from './identity.ts';
export { parseLicense, deriveLicenseKey, generateTemporaryKey, getSharedSecret2 } from './license.ts';
export { qlzDecompress } from './quicklz.ts';
