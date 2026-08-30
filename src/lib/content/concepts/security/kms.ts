import type { Concept } from '../../types';

export const kms: Concept = {
  id: 'kms',
  world: 'security',
  name: 'AWS KMS',
  sub: 'Key Management Service',
  icon: '🔐',
  briefing: [
    'Encryption is easy. Managing the keys is the hard part.',
    'KMS creates, stores and controls access to encryption keys for you.',
    'The key material never leaves KMS unencrypted -- you call the API to use it.',
    'Nearly every AWS service can encrypt with a KMS key by ticking a box.',
  ],
  metaphor:
    'A bank vault for master keys: you ask the teller to lock or unlock a box; the master key never leaves the vault.',
  points: [
    'A KMS KEY (formerly CMK) is a logical key: AWS-managed, customer-managed, or AWS-owned.',
    'ENVELOPE ENCRYPTION: KMS generates a data key, you encrypt data locally with it, and store the KMS-encrypted data key alongside.',
    'Access is controlled by a KEY POLICY plus IAM plus optional grants; every use is logged to CloudTrail.',
    'Customer-managed keys support automatic yearly rotation and fine-grained policies.',
    'KMS keys are regional; use multi-Region keys or re-encrypt to cross regions. CloudHSM is the dedicated-hardware option.',
  ],
  deep: {
    works: [
      'To encrypt a large object, a service calls GenerateDataKey: KMS returns a plaintext data key (used once, in memory) and an encrypted copy. The data is encrypted locally; only the encrypted data key is persisted. To decrypt, the service sends the encrypted data key back to KMS.',
      "This means KMS isn't in the data path for bulk bytes -- it only guards the small data keys, so it scales and stays cheap.",
      'S3/EBS/RDS/Secrets Manager integration is just this pattern with the plumbing hidden: you pick a key, they handle GenerateDataKey/Decrypt.',
    ],
    diagram:
      '  encrypt:  KMS GenerateDataKey --> {plaintext DK, encrypted DK}\n' +
      '            data XOR AES(plaintext DK)  --> ciphertext\n' +
      '            store: ciphertext + encrypted DK   (discard plaintext DK)\n' +
      '  decrypt:  send encrypted DK --> KMS Decrypt --> plaintext DK --> unwrap data',
    practice: [
      "Use customer-managed keys when you need your own rotation, policy, or audit boundary; AWS-managed keys for 'just encrypt it'.",
      'Enable automatic annual rotation on customer-managed keys.',
      'Scope key policies tightly -- separate who can administer a key from who can use it.',
      'Use multi-Region keys for cross-region DR of encrypted data.',
    ],
    gotchas: [
      "Delete a key and everything it protected is unrecoverable -- there's a mandatory 7-30 day waiting period for that reason.",
      'KMS has request rate limits; very high-volume encryption should reuse data keys (envelope) rather than call Encrypt per item.',
      'A key is regional; copying an encrypted snapshot to another region requires re-encryption with a key there.',
    ],
    pricing:
      '~$1 per customer-managed key per month, plus per-10,000 API requests. AWS-managed keys have no monthly ' +
      'fee but still bill requests. CloudHSM is priced per HSM-hour.',
    cli: 'aws kms generate-data-key --key-id alias/app --key-spec AES_256\naws kms decrypt --ciphertext-blob fileb://encrypted-dk.bin',
  },
  quiz: [
    {
      q: 'What is envelope encryption?',
      choices: [
        'Encrypting email attachments',
        'Using a KMS key to encrypt a data key, which encrypts the actual data',
        'Double-encrypting with two passwords',
        'Encrypting only file metadata',
      ],
      answer: 1,
      why: 'A locally-used data key encrypts the bulk data; KMS only protects the small data key.',
    },
    {
      q: "Why isn't KMS a bottleneck when encrypting terabytes in S3?",
      choices: [
        'It streams all the data through KMS',
        'It only handles the small data keys, not the bulk bytes',
        'S3 skips encryption for large files',
        'KMS caches the whole object',
      ],
      answer: 1,
      why: 'Bulk data is encrypted locally with a data key; KMS just wraps/unwraps that key.',
    },
    {
      q: 'A customer-managed KMS key can be configured to...',
      choices: [
        'Never be logged',
        'Rotate automatically once per year',
        'Leave KMS in plaintext',
        'Work in every region at once by default',
      ],
      answer: 1,
      why: 'Automatic annual rotation is a customer-managed key feature; keys are regional unless multi-Region.',
    },
  ],
  badge: { name: 'CIPHER SENTINEL', emoji: '🔐' },
  sim: {
    game: 'envelopeCrypto',
    label: 'SEAL THE ENVELOPE',
    blurb:
      'Put the six steps of envelope encryption -- and decryption -- in the exact order they happen. See why KMS never touches the bulk data.',
  },
};
