import type { Concept } from '../../types';

export const lambda: Concept = {
  id: 'lambda',
  world: 'compute',
  name: 'AWS LAMBDA',
  sub: 'Serverless functions',
  icon: '⚡',
  briefing: [
    "Sometimes you don't want a server at all -- just your code, on demand.",
    'Lambda runs a function when an event fires, then bills you for the milliseconds it ran.',
    'No patching, no capacity planning. It scales from zero to thousands automatically.',
    'The trade: short-lived, stateless, and you live inside its limits.',
  ],
  metaphor: 'A vending machine for code: insert an event, get a result, walk away.',
  points: [
    'You upload a function (zip or container image); AWS runs it in a managed micro-VM (Firecracker).',
    'Triggered by events: API Gateway, S3, SQS, EventBridge, DynamoDB Streams, and many more.',
    'Max run time is 15 minutes; memory 128 MB - 10 GB, and CPU scales with the memory you pick.',
    'Each concurrent event gets its own isolated execution environment -- that is how it scales.',
    'Stateless: persist anything you need in S3, DynamoDB, etc. Local /tmp is scratch only.',
  ],
  deep: {
    works: [
      "On the first call in an environment, Lambda downloads your code, starts a runtime and runs your init code -- that latency is the 'cold start'. The warm environment is then reused for later calls.",
      'Concurrency = number of environments running at once. Default soft limit is 1,000 per account per region; you can reserve or provision concurrency for hot paths.',
      'Async sources (S3, SNS, EventBridge) queue internally and retry on failure; poll sources (SQS, Kafka) are read by the Lambda service in batches.',
    ],
    diagram:
      '  S3 upload ---\\\n' +
      '  API Gateway --+--> [ Lambda fn ] --> DynamoDB\n' +
      '  EventBridge --/        |\n' +
      '                     CloudWatch Logs\n' +
      '  scale: 1 event = 1 env, N events = N envs (auto)',
    practice: [
      'Keep the deployment package small and move heavy init above the handler so warm calls skip it.',
      'Set a sensible timeout and a Dead-Letter Queue / on-failure destination for async work.',
      'Give each function its own least-privilege IAM execution role.',
      'For steady high volume, do the math -- containers/EC2 can be cheaper than always-on Lambda.',
    ],
    gotchas: [
      'Buffered synchronous requests/responses have a 6 MB payload cap; supported REST API integrations can opt into response streaming for larger incremental responses.',
      'VPC-attached Lambdas need a NAT path or VPC endpoints to reach AWS APIs / the internet.',
      'Retries can double-invoke your function -- make handlers idempotent.',
    ],
    pricing:
      'Pay per request (~$0.20 per million) plus GB-seconds of compute. Large perpetual free tier ' +
      '(1M requests + 400,000 GB-s per month). Idle costs nothing.',
    cli: 'aws lambda invoke --function-name my-fn --payload \'{"key":"value"}\' out.json',
  },
  quiz: [
    {
      q: "What is a Lambda 'cold start'?",
      choices: [
        'Running in a cold AWS region',
        'First-call latency to set up a new execution environment',
        'A function that timed out',
        'A scheduled nightly run',
      ],
      answer: 1,
      why: 'A new environment must download code and run init before your handler; reused warm environments skip that.',
    },
    {
      q: 'Maximum time a single Lambda invocation can run?',
      choices: ['30 seconds', '5 minutes', '15 minutes', '1 hour'],
      answer: 2,
      why: 'Hard limit is 900 seconds (15 minutes). Longer work belongs in Step Functions / ECS / Batch.',
    },
    {
      q: 'Where should a Lambda keep data it needs on the next invocation?',
      choices: [
        'In /tmp',
        'In a global variable',
        'In an external store like DynamoDB or S3',
        'In the deployment zip',
      ],
      answer: 2,
      why: 'Environments are ephemeral and not shared, so durable state must live outside the function.',
    },
  ],
  badge: { name: 'SERVERLESS SPARK', emoji: '⚡' },
};
