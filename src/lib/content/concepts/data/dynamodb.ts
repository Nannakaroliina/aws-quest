import type { Concept } from '../../types';

export const dynamodb: Concept = {
  id: 'dynamodb',
  world: 'data',
  name: 'AMAZON DYNAMODB',
  sub: 'Serverless NoSQL at any scale',
  icon: '🔑',
  briefing: [
    'Some apps need predictable millisecond reads whether you have 10 users or 10 million.',
    'DynamoDB is a fully managed key-value and document database with no servers to size.',
    'It scales horizontally by partitioning your data across many nodes automatically.',
    'The catch: you must design around your access patterns, not a clean relational schema.',
  ],
  metaphor:
    'A vast wall of numbered lockers -- instant if you know the number, painful if you have to open them all.',
  points: [
    'Every item lives in a table and is found by its PRIMARY KEY: partition key, or partition key + sort key.',
    "The partition key's hash decides which physical partition stores the item -- pick a high-cardinality key.",
    'CAPACITY MODES: on-demand (pay per request, auto) or provisioned (set RCUs/WCUs, optional auto scaling).',
    'GLOBAL SECONDARY INDEXES (GSI) enable queries on other attributes; LSIs share the partition key.',
    'Extras: Streams (change feed), DAX (microsecond cache), TTL, transactions, global tables (multi-region).',
  ],
  deep: {
    works: [
      'DynamoDB spreads a table over partitions (~10 GB / 3,000 RCU / 1,000 WCU each). Requests hit the partition for your key, so throughput scales with the number of distinct partition-key values you use.',
      'A Query reads a single partition key (optionally a sort-key range) efficiently. A Scan reads the whole table -- avoid it in hot paths.',
      "Design is 'single-table': model relationships as item collections sharing a partition key, and add GSIs for secondary access patterns. Know your queries before you create the table.",
    ],
    diagram:
      '  Table: AppData   PK = USER#42\n' +
      '  +-------------------------------------------+\n' +
      '  | PK        | SK          | attributes      |\n' +
      '  | USER#42   | PROFILE     | name, email     |\n' +
      '  | USER#42   | ORDER#1001  | total, status   |\n' +
      '  | USER#42   | ORDER#1002  | total, status   |\n' +
      '  +-------------------------------------------+\n' +
      "  Query(PK=USER#42, SK begins_with 'ORDER#') -> that user's orders",
    practice: [
      "Choose a partition key that spreads load evenly (userId, tenantId) -- never a low-cardinality value or 'status'.",
      'Use on-demand for new/spiky workloads; switch to provisioned + auto scaling once the pattern is known and steady.',
      'Add GSIs for each additional query pattern; project only the attributes you need.',
      'Use DynamoDB Streams -> Lambda for derived data, search indexing, and event-driven side effects.',
    ],
    gotchas: [
      "A 'hot' partition key throttles even if total capacity looks fine -- watch for skew.",
      'Scans and filter expressions still consume capacity for every item read, not just returned.',
      'Item size is capped at 400 KB; large blobs belong in S3 with a pointer stored in the item.',
    ],
    pricing:
      'On-demand: pay per read/write request unit + storage. Provisioned: pay for RCU/WCU per hour + storage. ' +
      'Extra for GSIs, Streams, global tables, DAX and backups.',
    cli: 'aws dynamodb query --table-name AppData \\\n  --key-condition-expression "PK = :p AND begins_with(SK, :s)" \\\n  --expression-attribute-values \'{":p":{"S":"USER#42"},":s":{"S":"ORDER#"}}\'',
  },
  quiz: [
    {
      q: 'What decides which physical partition stores a DynamoDB item?',
      choices: ['The sort key', 'A hash of the partition key', 'Item size', 'Creation time'],
      answer: 1,
      why: 'The partition key is hashed to select a partition, so it must be high-cardinality and evenly used.',
    },
    {
      q: 'Which operation should you avoid on a hot request path?',
      choices: ['Query', 'GetItem', 'Scan', 'BatchGetItem'],
      answer: 2,
      why: 'Scan reads the entire table and consumes capacity for every item examined.',
    },
    {
      q: 'You need to query items by an attribute that is not the primary key. Use a...',
      choices: ['Global Secondary Index', 'Bigger instance', 'Read replica', 'Lifecycle rule'],
      answer: 0,
      why: 'GSIs provide alternative key schemas for additional access patterns.',
    },
  ],
  badge: { name: 'KEYMASTER', emoji: '🔑' },
  sim: {
    game: 'hotPartition',
    label: 'PICK THE PARTITION KEY',
    blurb:
      'Three tables, three access patterns. Choose a partition key and watch the write load land across 8 partitions -- a bad key melts one of them.',
  },
};
