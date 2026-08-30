// @ts-nocheck -- transitional: imperative DOM code ported verbatim from the
// pre-SvelteKit src/minigames.js. Typed when rebuilt as Svelte components.
import { makeOrder } from './make-order';

export const envelopeCrypto = makeOrder({
  controls: '↑ ↓ pick step  ·  ENTER place',
  winLine:
    'That is envelope encryption: KMS only ever handles a tiny data key, your app does the bulk crypto locally — so KMS never sits in the data path and the whole thing stays fast and cheap.',
  steps: [
    {
      t: 'App calls KMS GenerateDataKey for the KMS key',
      tip: 'KMS returns a plaintext data key AND a copy of that key encrypted under the KMS key.',
    },
    {
      t: 'Encrypt the file locally with the plaintext data key',
      tip: 'The bulk bytes are encrypted on your side — they never travel to KMS.',
    },
    {
      t: 'Store the ciphertext + the encrypted data key together',
      tip: 'They travel as a pair. The encrypted data key is useless to anyone without KMS.',
    },
    {
      t: 'Wipe the plaintext data key from memory',
      tip: 'Now nothing on disk can decrypt the file without a call back to KMS.',
    },
    {
      t: 'Later: send the encrypted data key to KMS Decrypt',
      tip: 'KMS checks the key policy / grants, then returns the plaintext data key.',
    },
    {
      t: 'Decrypt the file locally with the recovered data key',
      tip: 'Same envelope pattern in reverse — KMS stayed out of the data path the entire time.',
    },
  ],
});
