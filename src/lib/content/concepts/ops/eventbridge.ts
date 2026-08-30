import type { Concept } from '../../types';

export const eventbridge: Concept = {
  id: 'eventbridge',
  world: 'ops',
  name: 'AMAZON EVENTBRIDGE',
  sub: 'Serverless event bus',
  icon: '🔀',
  briefing: [
    "Services shouldn't have to know who cares about what they do.",
    'EventBridge is a bus: producers put events on it, rules route them to targets.',
    'AWS services, your apps, and SaaS partners all emit onto the same bus.',
    'Add a consumer by writing a rule -- the producer never changes.',
  ],
  metaphor:
    'A newsroom wire service: reporters file stories; each desk subscribes to the beats it covers.',
  points: [
    'An EVENT is JSON with source, detail-type and a detail object; it lands on an EVENT BUS (default, custom, or partner).',
    'RULES match events with an EVENT PATTERN (exact values, prefix, numeric, exists, anything-but) and fan out to up to 5 TARGETS each.',
    'Targets: Lambda, SQS, SNS, Step Functions, Kinesis, API destinations (any HTTP API), another bus, and more.',
    'SCHEDULER runs cron/rate schedules at scale (the successor to CloudWatch Events scheduled rules).',
    'PIPES does point-to-point source->filter->enrich->target; SCHEMA REGISTRY gives you typed code bindings for events.',
  ],
  deep: {
    works: [
      'On PutEvents, EventBridge evaluates every rule on that bus against the event. A rule whose pattern matches delivers the event (with at-least-once semantics) to each of its targets, retrying with backoff and sending permanent failures to a target dead-letter queue.',
      'Event patterns match structurally: each field you name must be present and the value must be in your allowed list or satisfy a content filter. Fields you omit are not constrained -- so a broad pattern matches a lot.',
      'It is push-based and near-real-time (typically sub-second), versus polling a queue. Use SQS between EventBridge and a fragile consumer when you need buffering or replay.',
    ],
    diagram:
      '  aws.s3 / your app / Datadog / Stripe\n' +
      '            |  PutEvents\n' +
      '        [ Event Bus ] --evaluate every rule-->\n' +
      '   rule A (source=aws.s3) --> Lambda, SQS\n' +
      '   rule B (detail.amount > 100) --> Step Functions\n' +
      "   rule C (prefix 'order_') --> SNS + API destination",
    practice: [
      'Use a custom bus per domain/bounded-context, not the default bus, so rules and permissions stay scoped.',
      "Make patterns as specific as the use case needs; over-broad rules invoke targets (and cost) you didn't intend.",
      'Attach a DLQ to every target and alarm on its depth; add SQS in front of brittle consumers for replay.',
      'Use EventBridge Scheduler (not a Lambda cron loop) for scheduled jobs; use Pipes for simple source-to-target plumbing.',
    ],
    gotchas: [
      'Delivery is at-least-once and unordered -- targets must be idempotent.',
      '256 KB event size limit; put large payloads in S3 and pass a pointer.',
      'A too-broad event pattern silently matches far more than you expect -- test with the sandbox / sample events.',
    ],
    pricing:
      'Custom/partner events are billed per million published (AWS-service events on the default bus are free to publish). ' +
      'Schema discovery, Scheduler and Pipes have their own small per-use charges. No hourly fee.',
    cli: 'aws events put-events --entries \'[{"Source":"app.orders","DetailType":"order_paid","Detail":"{\\"id\\":42}"}]\'',
  },
  quiz: [
    {
      q: 'How does a new consumer start receiving events from a producer on EventBridge?',
      choices: [
        'The producer adds a subscription in its code',
        'You create a rule with an event pattern and a target -- the producer is untouched',
        'You redeploy the producer with a new SDK',
        'You poll the bus for messages',
      ],
      answer: 1,
      why: 'Producers just PutEvents; routing lives entirely in rules, so adding a consumer never changes the producer.',
    },
    {
      q: 'An event pattern only lists {"source":["aws.s3"]}. Which events match?',
      choices: [
        "Only S3 'Object Created' events",
        'Every event from aws.s3, regardless of detail-type or bucket',
        'No events until you add a detail filter',
        'Only events you explicitly tag',
      ],
      answer: 1,
      why: "Fields the pattern doesn't mention aren't filtered, so this matches all S3 events -- narrow it with more fields.",
    },
    {
      q: "What must be true of an EventBridge target's processing?",
      choices: [
        'It must finish in 29 seconds',
        'It must be idempotent -- delivery is at-least-once and unordered',
        'It must be a Lambda function',
        'It must acknowledge each event synchronously',
      ],
      answer: 1,
      why: 'EventBridge can deliver an event more than once and out of order; handlers must tolerate that.',
    },
  ],
  badge: { name: 'SIGNAL WEAVER', emoji: '🔀' },
  sim: {
    game: 'eventPattern',
    label: 'MATCH THE PATTERN',
    blurb:
      "For each incoming event, decide whether the rule's event pattern matches it -- exact values, nested fields, prefix and numeric filters.",
  },
};
