import type { Concept } from '../../types';

export const storageclasses: Concept = {
  id: 'storageclasses',
  world: 'storage',
  name: 'S3 STORAGE CLASSES',
  sub: 'Pay for the access you need',
  icon: '🧊',
  briefing: [
    "Not all data is equal. Some is read every second; some hasn't been touched in a year.",
    'S3 storage classes trade retrieval speed and cost for cheaper storage.',
    'Lifecycle rules move objects down the tiers automatically as they age.',
    'Choose wrong and you either overpay or wait hours for a file.',
  ],
  metaphor:
    'Desk drawer vs. filing cabinet vs. offsite warehouse -- same papers, very different retrieval time.',
  points: [
    'STANDARD: hot data, millisecond access, highest storage price, no retrieval fee.',
    'STANDARD-IA / ONE ZONE-IA: infrequent access, cheaper storage, per-GB retrieval fee, 30-day minimum.',
    'INTELLIGENT-TIERING: S3 moves objects between tiers by observed access; small monitoring fee, no retrieval fee.',
    'GLACIER INSTANT RETRIEVAL: archive price, still millisecond reads, 90-day minimum.',
    'GLACIER FLEXIBLE / DEEP ARCHIVE: cheapest; retrieval takes minutes to hours (Deep Archive is ~12h for Standard retrieval and up to 48h for Bulk).',
  ],
  deep: {
    works: [
      'All classes except One Zone-IA store across >=3 AZs with the same 11-nines durability; they differ in availability SLA, minimum storage duration, and whether/what you pay to read.',
      "A lifecycle configuration is rules like 'after 30 days -> Standard-IA, after 90 -> Glacier Flexible, after 365 -> Deep Archive, expire non-current versions after 60 days'.",
      "Glacier Flexible retrieval has Expedited (1-5 min), Standard (3-5 h) and Bulk (5-12 h) options; you 'restore' a temporary copy for N days.",
    ],
    diagram:
      '  age 0d        30d           90d              365d\n' +
      '  STANDARD ---> STANDARD-IA ---> GLACIER FLEX ---> DEEP ARCHIVE\n' +
      '  ms access     ms + fee        minutes-hours     12-48h restore\n' +
      '  (or: INTELLIGENT-TIERING does this automatically)',
    practice: [
      'Unknown or changing access pattern? Use Intelligent-Tiering and stop guessing.',
      'Logs/backups you rarely read: lifecycle to Glacier Flexible or Deep Archive after a short window.',
      "Don't put tiny, short-lived objects in IA/Glacier -- minimum-duration and per-object overhead eat the savings.",
      'Model retrieval cost + time before archiving data you might need in an incident.',
    ],
    gotchas: [
      'Early deletion before the class minimum (30/90/180 days) still bills for the full minimum.',
      'One Zone-IA lives in a single AZ -- fine for reproducible data, risky for the only copy.',
      'Deep Archive restores are slow; not suitable for anything time-critical.',
    ],
    pricing:
      'Storage $/GB drops sharply Standard -> IA -> Glacier -> Deep Archive, but retrieval $/GB and latency rise. ' +
      'Intelligent-Tiering adds a small per-object monitoring charge.',
    cli: 'aws s3api put-bucket-lifecycle-configuration --bucket my-logs \\\n  --lifecycle-configuration file://lifecycle.json',
  },
  quiz: [
    {
      q: 'You have data with an unpredictable, changing access pattern. Best class?',
      choices: ['Standard-IA', 'Glacier Deep Archive', 'S3 Intelligent-Tiering', 'One Zone-IA'],
      answer: 2,
      why: 'Intelligent-Tiering auto-moves objects by real access, with no retrieval fees.',
    },
    {
      q: 'Which class can require 12-48 hours to retrieve an object, depending on retrieval tier?',
      choices: ['S3 Standard', 'Glacier Instant Retrieval', 'Standard-IA', 'Glacier Deep Archive'],
      answer: 3,
      why: 'Deep Archive restores take about 12 hours with Standard retrieval and up to 48 hours with Bulk retrieval.',
    },
    {
      q: 'What moves objects between classes automatically over time?',
      choices: [
        'A lifecycle configuration',
        'A bucket policy',
        'A security group',
        'Transfer Acceleration',
      ],
      answer: 0,
      why: 'Lifecycle rules transition or expire objects based on age or version state.',
    },
  ],
  badge: { name: 'TIER TACTICIAN', emoji: '🧊' },
  sim: {
    game: 'storageTiers',
    label: 'TIER THE BUCKET',
    blurb:
      'Assign each object a storage class. Chase the lowest monthly bill without ever missing a retrieval-time requirement.',
  },
};
