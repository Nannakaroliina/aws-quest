import type { Concept } from '../../types';

export const sns: Concept = {
  id: 'sns',
  world: 'ops',
  name: 'AMAZON SNS',
  sub: 'Pub/Sub notifications',
  icon: '📢',
  briefing: [
    'Sometimes one event needs to reach many places at once.',
    'SNS is publish/subscribe: publish to a topic, every subscriber gets a copy.',
    'Subscribers can be queues, functions, HTTP endpoints, email or SMS.',
    'Pair it with SQS for the classic fan-out pattern.',
  ],
  metaphor: 'A radio broadcast: transmit once, every tuned-in receiver hears it.',
  points: [
    'Publishers send to a TOPIC; SNS pushes the message to every current SUBSCRIPTION.',
    'Subscriber types: SQS, Lambda, HTTP/S, email, SMS, mobile push, and Kinesis Data Firehose.',
    'FAN-OUT: SNS topic -> multiple SQS queues, so each downstream service processes independently.',
    'MESSAGE FILTERING: subscriptions set filter policies so they receive only relevant messages.',
    'Standard topics (high throughput, best-effort order) or FIFO topics (ordered, dedup, pair with FIFO SQS).',
  ],
  deep: {
    works: [
      'SNS is push-based: on Publish it immediately delivers to each subscriber, retrying failed HTTP/S deliveries on a schedule and sending permanent failures to a subscription DLQ.',
      "Fan-out beats calling each service directly: the publisher doesn't know or care who's listening, and adding a consumer is just a new SQS subscription -- no publisher change.",
      "Filter policies are evaluated on message attributes (or body), so one topic can serve many consumers that each opt into a slice (e.g. eventType in ['order_paid']).",
    ],
    diagram:
      '                       +--> SQS: fulfilment  --> worker\n' +
      '  service --Publish--> [ SNS topic ] --+--> SQS: analytics  --> worker\n' +
      '                       +--> Lambda: fraud-check\n' +
      '                       +--> HTTPS: partner webhook\n' +
      '  (each subscription can have a filter policy + DLQ)',
    practice: [
      'Use SNS->SQS fan-out (not SNS->Lambda directly) when you need buffering, retries and replay per consumer.',
      'Always attach a subscription DLQ (redrive policy) for undeliverable messages.',
      'Use message filtering to keep one topic instead of many near-duplicate topics.',
      'For strict ordering across the fan-out, use FIFO topic + FIFO queues with matching group IDs.',
    ],
    gotchas: [
      'SNS->Lambda has no built-in buffer; a Lambda outage relies on SNS retries then DLQ -- SQS in between is safer.',
      'SNS message size is capped at 256 KB; unlike SNS, SQS now accepts native messages up to 1 MiB.',
      'SMS delivery involves carrier rules, spend limits and per-country pricing -- test early.',
    ],
    pricing:
      'Pay per million publishes + per delivery by protocol (SQS/Lambda cheap, SMS/email/mobile push more). ' +
      'Generous free tier for publishes and SQS/Lambda/HTTP deliveries.',
    cli: 'aws sns publish --topic-arn arn:aws:sns:...:orders --message \'{"orderId":42,"status":"paid"}\' \\\n  --message-attributes \'{"eventType":{"DataType":"String","StringValue":"order_paid"}}\'',
  },
  quiz: [
    {
      q: 'SNS delivery is best described as...',
      choices: [
        'Pull-based, one consumer wins each message',
        'Push-based, every subscriber gets a copy',
        'Batch nightly export',
        'Point-to-point only',
      ],
      answer: 1,
      why: 'SNS is pub/sub -- publish once, fan out a copy to every subscription. SQS is the pull-based one.',
    },
    {
      q: "The classic 'fan-out' pattern is...",
      choices: [
        'SQS -> SNS -> SQS',
        'SNS topic -> multiple SQS queues',
        'Lambda -> Lambda -> Lambda',
        'S3 -> S3 replication',
      ],
      answer: 1,
      why: 'One publish reaches many SQS queues, each buffering work for an independent consumer.',
    },
    {
      q: "What lets a subscription receive only a subset of a topic's messages?",
      choices: [
        'Visibility timeout',
        'A filter policy on message attributes',
        'A dead-letter queue',
        'Long polling',
      ],
      answer: 1,
      why: 'Filter policies match message attributes so consumers opt into relevant messages only.',
    },
  ],
  badge: { name: 'BROADCAST HERALD', emoji: '📢' },
};
