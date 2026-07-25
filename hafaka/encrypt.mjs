// Encrypts hafaka/data.json with the vendor password and injects the ciphertext
// into hafaka/index.html between the PAYLOAD markers. Uses Node's built-in Web
// Crypto so the parameters match the browser decryption exactly.
import { webcrypto as crypto } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PASSWORD = "DBBZ";
const ITER = 200000;

const b64 = (u8) => Buffer.from(u8).toString("base64");

const data = readFileSync(join(HERE, "data.json"), "utf8");

const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));

const baseKey = await crypto.subtle.importKey(
  "raw", new TextEncoder().encode(PASSWORD), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" },
  baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
const ct = new Uint8Array(await crypto.subtle.encrypt(
  { name: "AES-GCM", iv }, key, new TextEncoder().encode(data)));

const payload = JSON.stringify({ salt: b64(salt), iv: b64(iv), ct: b64(ct), iter: ITER });

const htmlPath = join(HERE, "index.html");
let html = readFileSync(htmlPath, "utf8");
const re = /\/\*PAYLOAD_START\*\/[\s\S]*?\/\*PAYLOAD_END\*\//;
if (!re.test(html)) {
  console.error("ERROR: payload markers not found in index.html");
  process.exit(1);
}
html = html.replace(re, `/*PAYLOAD_START*/${payload}/*PAYLOAD_END*/`);
writeFileSync(htmlPath, html);

console.log(`injected encrypted payload: ${data.length} plaintext bytes -> ${ct.length} ciphertext bytes`);
