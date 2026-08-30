import type { Concept } from '../../types';

export const sqs: Concept = {
  id: 'sqs',
  world: 'ops',
  name: 'AMAZON SQS',
  sub: 'Simple Queue Service',
  icon: '📨',
  briefing: [
    'Directly calling a downstream service means its outage is your outage.',
    'Put a queue between them. The producer drops a message and moves on.',
    'The consumer pulls work at its own pace, and retries are built in.',
    'This is how you decouple and absorb spikes.',
  ],
  metaphor:
    'A ticket spike at a diner: orders queue up so the kitchen works steadily no matter the rush.',
  points: [
    'Producers SendMessage; consumers ReceiveMessage, process, then DeleteMessage. Unfinished work reappears.',
    'STANDARD queues: near-unlimited throughput, at-least-once delivery, best-effort ordering.',
    'FIFO queues preserve order within each message group and deduplicate sends within a 5-minute window. Default throughput is 300 API calls/sec per partition (3,000 messages/sec with batching); high-throughput mode and regional quotas can be much higher.',
    'VISIBILITY TIMEOUT hides a message while one consumer works on it; DEAD-LETTER QUEUE catches poison messages.',
    'Retention is 1 minute to 14 days (default 4 days); native payloads are up to 1 MiB (larger via the S3 Extended Client).',
  ],
  deep: {
    works: [
      "On ReceiveMessage, SQS makes the message invisible for the visibility timeout. If the consumer deletes it in time, it's gone; if not (crash, slow), it becomes visible again for another attempt. After maxReceiveCount failures it's moved to the DLQ.",
      'Standard queues may deliver a message more than once and slightly out of order -- consumers must be idempotent. FIFO adds message group IDs (ordering scope) and deduplication IDs (5-minute dedup window).',
      'Long polling (WaitTimeSeconds up to 20) waits for messages instead of returning empty, cutting empty-receive cost and latency. Lambda has a native SQS event source that scales pollers for you.',
    ],
    diagram:
      '  producer --SendMessage--> [ SQS queue ] <--ReceiveMessage-- consumer(s)\n' +
      '                               |  (invisible for visibility timeout)\n' +
      '                               |  fail x maxReceiveCount\n' +
      '                               v\n' +
      '                          [ Dead-Letter Queue ] --> alarm / manual review',
    practice: [
      'Make consumers idempotent (dedupe on a business key) -- assume at-least-once.',
      'Set visibility timeout to ~6x your function/handler timeout; always attach a DLQ with an alarm on depth.',
      'Use long polling everywhere; batch send/receive/delete to cut cost and API calls.',
      'Reach for FIFO only when strict order / exactly-once truly matters -- it has lower throughput.',
    ],
    gotchas: [
      'Forgetting to DeleteMessage causes infinite reprocessing after the visibility timeout.',
      'Standard queue duplicates are normal, not a bug -- design for them.',
      'The native payload cap is 1 MiB -- put larger blobs in S3 and send a pointer.',
    ],
    pricing:
      'Pay per request (each API call; batching up to 10 messages counts as one). ~1M requests/month free. ' +
      'FIFO requests cost slightly more. Data transfer out is billed normally.',
    cli: 'aws sqs send-message --queue-url $Q --message-body \'{"job":"resize","id":42}\'\naws sqs receive-message --queue-url $Q --wait-time-seconds 20 --max-number-of-messages 10',
  },
  quiz: [
    {
      q: 'A Standard SQS queue guarantees...',
      choices: [
        'Exactly-once, strict order',
        'At-least-once delivery, best-effort ordering',
        'At-most-once delivery',
        'Order only, no delivery guarantee',
      ],
      answer: 1,
      why: 'Standard = at-least-once + best-effort order; use FIFO for exactly-once and strict ordering.',
    },
    {
      q: 'What happens if a consumer receives a message but never deletes it?',
      choices: [
        'It is lost',
        'After the visibility timeout it becomes visible again for reprocessing',
        'It goes straight to the DLQ',
        'The queue locks',
      ],
      answer: 1,
      why: "Non-deletion is treated as failure; the message reappears until deleted or DLQ'd.",
    },
    {
      q: 'Where do messages go after failing more than maxReceiveCount times?',
      choices: [
        'Back to the producer',
        'The dead-letter queue',
        'CloudWatch Logs',
        'They are deleted silently',
      ],
      answer: 1,
      why: 'A DLQ isolates poison messages so they stop blocking the main queue.',
    },
  ],
  badge: { name: 'QUEUE COURIER', emoji: '📨' },
  sim: {
    game: 'visibilityQueue',
    label: 'WORK THE QUEUE',
    blurb:
      'Receive, process and delete six messages before the clock runs out. One job never succeeds -- get it to the dead-letter queue.',
  },
};
