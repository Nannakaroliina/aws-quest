import type { Concept } from '../../types';

export const stepfunctions: Concept = {
  id: 'stepfunctions',
  world: 'ops',
  name: 'STEP FUNCTIONS',
  sub: 'Serverless workflows',
  icon: '🧩',
  briefing: [
    'Chaining Lambdas by hand means writing retries, timeouts and state tracking yourself.',
    'Step Functions is a managed state machine: you describe the steps, it runs them.',
    'It remembers where every execution is, retries failures, and shows a visual trace.',
    'Orchestration becomes configuration instead of glue code.',
  ],
  metaphor:
    'A board game track: each square says what to do and where to go next; the box keeps score.',
  points: [
    'A STATE MACHINE is JSON (Amazon States Language): states of type Task, Choice, Parallel, Map, Wait, Pass, Succeed, Fail.',
    'TASK states can call Lambda, ECS, SNS, SQS, DynamoDB, another state machine, and 220+ AWS services through optimized or AWS SDK integrations.',
    'Built-in RETRY and CATCH per state handle transient errors and route failures without custom code.',
    'STANDARD workflows: durable, auditable, up to 1 year, exactly-once. EXPRESS: high-volume, up to 5 min, cheap, at-least-once.',
    'MAP state fans out over a collection (inline or distributed for massive parallelism over S3 data).',
  ],
  deep: {
    works: [
      "Each state does its work then follows its 'Next' pointer (or a Choice picks a branch) until a terminal Succeed/Fail. Step Functions persists the state, input and output at every transition, so an execution can run for months and you can inspect exactly where it is.",
      'Retry is declarative: list error names, an interval, backoff rate and max attempts. Catch routes a still-failing state to a fallback state instead of failing the whole execution.',
      "'.sync' integrations make a Task wait for a long-running job (an ECS task, a Glue job) to finish; the callback pattern (waitForTaskToken) pauses until an external system calls back with success/failure.",
    ],
    diagram:
      '  Start\n' +
      '   -> Task: ValidateOrder\n' +
      '   -> Choice: valid?  --no--> Fail\n' +
      '        | yes\n' +
      '   -> Task: ReserveInventory   (Retry x3, Catch -> Compensate)\n' +
      '   -> Parallel: [ ChargeCard ] [ SendEmail ]\n' +
      '   -> Task: MarkComplete  -> Succeed',
    practice: [
      'Use Standard for business-critical, long-running or auditable flows; Express for high-frequency short event processing.',
      'Push retries/timeouts/catches into the state machine and keep Lambdas small and single-purpose.',
      'Model the failure paths explicitly (Catch -> compensation states) -- the happy path is the easy half.',
      'Use direct service integrations (DynamoDB, SNS, SQS) instead of a Lambda that just forwards a call.',
    ],
    gotchas: [
      'Standard workflow state transitions are billed per transition -- a chatty loop over thousands of items gets expensive; consider Express or a Map state.',
      'The 256 KB limit on state input/output -- pass S3 pointers for big payloads, not the data itself.',
      'Express workflows are at-least-once and only give you full history via CloudWatch Logs -- design idempotent steps.',
    ],
    pricing:
      'Standard: pay per state transition (first 4,000/month free). Express: pay per request + duration/memory (GB-second), ' +
      'much cheaper at volume. You also pay for whatever the tasks themselves invoke.',
    cli: 'aws stepfunctions start-execution --state-machine-arn arn:aws:states:...:stateMachine:orders --input \'{"orderId":42}\'',
  },
  quiz: [
    {
      q: 'Where do retries, timeouts and error handling live in a Step Functions workflow?',
      choices: [
        "In each Lambda's own code",
        'Declaratively in the state machine (Retry / Catch per state)',
        'In an SQS redrive policy',
        'You cannot retry a failed state',
      ],
      answer: 1,
      why: 'Retry and Catch are configured per state in the definition, so the orchestration handles failure, not your functions.',
    },
    {
      q: 'You need to process 20 million short events per day as cheaply as possible. Which workflow type?',
      choices: ['Standard', 'Express', 'Neither -- use raw Lambda', 'Standard with a Map state'],
      answer: 1,
      why: 'Express workflows are priced for high volume (per request + duration) and run up to 5 minutes; Standard bills per transition.',
    },
    {
      q: 'Why choose a direct DynamoDB service integration over a Lambda that just calls DynamoDB?',
      choices: [
        "Lambdas can't call DynamoDB",
        'Less code, no cold starts, and one fewer thing to run and pay for',
        'It bypasses IAM',
        'It makes the workflow synchronous',
      ],
      answer: 1,
      why: 'Step Functions can call 220+ AWS services and thousands of API actions directly; a passthrough Lambda is pure overhead.',
    },
  ],
  badge: { name: 'FLOW ARCHITECT', emoji: '🧩' },
  sim: {
    game: 'stateOrder',
    label: 'BUILD THE STATE MACHINE',
    blurb:
      'Put the states of an order-processing workflow in the order they run -- Task, Choice, Parallel, join, terminal.',
  },
};
