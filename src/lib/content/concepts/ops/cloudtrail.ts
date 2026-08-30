import type { Concept } from '../../types';

export const cloudtrail: Concept = {
  id: 'cloudtrail',
  world: 'ops',
  name: 'AWS CLOUDTRAIL',
  sub: 'API audit log',
  icon: '🧾',
  briefing: [
    "'Who deleted that bucket?' CloudTrail is how you answer.",
    'It records every API call in your account -- who, what, when, from where.',
    'Management events are on by default. Data events you opt into.',
    'It is the backbone of security investigations and compliance.',
  ],
  metaphor: 'CCTV plus a signed visitor log for every action taken in your account.',
  points: [
    'Records API activity as JSON events: identity, action, parameters, source IP, response, timestamp.',
    'MANAGEMENT EVENTS (control-plane: create/modify/delete) are logged free; 90 days visible in Event history.',
    'DATA EVENTS (S3 object GET/PUT, Lambda Invoke, DynamoDB item ops) are high-volume and opt-in / paid.',
    'A TRAIL delivers events continuously to S3 (and optionally CloudWatch Logs / EventBridge).',
    'Multi-region and organization trails capture everything in one place; log file integrity validation detects tampering.',
  ],
  deep: {
    works: [
      'Every call to an AWS API (console, CLI, SDK, or service-on-your-behalf) generates a CloudTrail event. Event history shows management events for the last 90 days with no setup; a trail is what gives you long-term, queryable, tamper-evident storage.',
      "Trails write batched log files to an S3 prefix; enabling integrity validation adds signed digest files so you can prove logs weren't altered or deleted.",
      "Route the trail to CloudWatch Logs for metric filters + alarms ('alarm if a security group is opened to 0.0.0.0/0'), or to EventBridge for real-time automated response.",
    ],
    diagram:
      '  console / CLI / SDK / AWS services\n' +
      '        |  every API call\n' +
      '  [ CloudTrail ] --> S3 bucket (long-term, integrity-validated)\n' +
      '        \\--> CloudWatch Logs --> metric filter --> alarm --> SNS\n' +
      '        \\--> EventBridge --> Lambda (auto-remediate)',
    practice: [
      'Create one org-wide, multi-region trail delivering to a locked-down S3 bucket in a separate security account.',
      'Enable log file integrity validation; restrict and monitor access to the log bucket.',
      'Add data events only for sensitive buckets/functions -- account-wide data events can be costly and noisy.',
      'Wire key events (root login, IAM changes, CloudTrail stopped) to alarms via CloudWatch Logs metric filters.',
    ],
    gotchas: [
      'Management events != data events: by default you do NOT get per-object S3 access logs.',
      'Event history is only 90 days and management-only -- you need a trail for real retention/forensics.',
      "CloudTrail delivery has a few-minutes lag; it's audit, not real-time prevention.",
    ],
    pricing:
      'First copy of management events to a trail is free; extra trails, data events and CloudTrail Insights ' +
      'are paid per event. You also pay S3 storage for the log files.',
    cli: 'aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=DeleteBucket',
  },
  quiz: [
    {
      q: 'By default (no trail configured), CloudTrail Event history shows...',
      choices: [
        'All events forever',
        'Management events for the last 90 days',
        'Only S3 data events',
        'Nothing',
      ],
      answer: 1,
      why: 'You get 90 days of management events free; a trail adds long-term and data events.',
    },
    {
      q: 'To see object-level S3 GET/PUT activity you must...',
      choices: [
        "Do nothing, it's automatic",
        'Enable data events (opt-in, paid)',
        'Enable CloudWatch',
        'Turn on VPC Flow Logs',
      ],
      answer: 1,
      why: 'Data events for S3 objects and Lambda invokes are opt-in and billed per event.',
    },
    {
      q: 'What does log file integrity validation give you?',
      choices: [
        'Faster delivery',
        'Proof that log files were not altered or deleted',
        'Cheaper storage',
        'Real-time blocking of bad API calls',
      ],
      answer: 1,
      why: 'Signed digest files let you detect tampering with the audit trail.',
    },
  ],
  badge: { name: 'CHRONICLE KEEPER', emoji: '📜' },
};
