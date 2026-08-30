import type { Concept } from '../../types';

export const secretsmanager: Concept = {
  id: 'secretsmanager',
  world: 'security',
  name: 'SECRETS MANAGER',
  sub: 'Store and rotate secrets',
  icon: '📜',
  briefing: [
    "Database passwords in a config file. API keys in an env var checked into git. We've all seen it.",
    'Secrets Manager keeps those values encrypted, access-controlled, and out of your code.',
    'Your app fetches the secret at runtime via the API.',
    'It can also rotate the secret on a schedule with zero downtime.',
  ],
  metaphor:
    'A safe-deposit box with a logbook and an assistant who quietly changes the lock every 30 days.',
  points: [
    'Secrets are encrypted at rest with KMS and returned only to principals your resource/IAM policy allows.',
    'AUTOMATIC ROTATION runs a Lambda that creates a new credential, updates the service, and promotes it.',
    'Secrets are versioned with staging labels (AWSCURRENT, AWSPENDING, AWSPREVIOUS).',
    'Cross-region replication keeps read-local copies for multi-region apps and DR.',
    'SSM Parameter Store (SecureString) is a cheaper alternative without built-in rotation.',
  ],
  deep: {
    works: [
      'On rotation, the Lambda: (1) creates a new secret value and labels it AWSPENDING, (2) sets it on the target service (e.g. ALTER USER in the DB), (3) tests it, (4) moves the AWSCURRENT label to the new version. Old sessions keep working; new fetches get the new value.',
      'Apps call GetSecretValue at startup (and refresh periodically / on auth failure). SDK caching libraries avoid hammering the API.',
      'RDS/Aurora/Redshift/DocumentDB have managed rotation Lambdas provided by AWS -- you mostly just enable it.',
    ],
    diagram:
      '  app --GetSecretValue--> [ Secrets Manager ] --KMS decrypt--> value\n' +
      '  schedule --> Rotation Lambda:\n' +
      '     create new pw (AWSPENDING) -> set on DB -> test -> label AWSCURRENT',
    practice: [
      'Never bake secrets into images, env vars in source, or task definitions -- reference the secret ARN.',
      'Enable rotation for database credentials; use the AWS-provided rotation function where one exists.',
      'Grant read on a per-secret basis; tag secrets and use ABAC for scale.',
      'Cache retrieved secrets in memory with a short TTL; handle rotation by retrying on auth errors.',
    ],
    gotchas: [
      "Rotation that doesn't update every consumer causes outages -- inventory who uses the secret.",
      'It costs per secret per month + per API call; very high-read low-sensitivity config may fit Parameter Store better.',
      "A hardcoded fallback 'just in case' defeats the whole purpose -- don't.",
    ],
    pricing:
      '~$0.40 per secret per month + ~$0.05 per 10,000 API calls. Replica secrets are billed per region.',
    cli: 'aws secretsmanager get-secret-value --secret-id prod/app/db\naws secretsmanager rotate-secret --secret-id prod/app/db --rotation-lambda-arn arn:aws:lambda:...',
  },
  quiz: [
    {
      q: 'What does automatic rotation change the secret to during the process?',
      choices: [
        'Deletes it then recreates it',
        'Creates an AWSPENDING version, applies and tests it, then promotes it to AWSCURRENT',
        'Emails you a new password to set manually',
        'Nothing -- rotation is only a reminder',
      ],
      answer: 1,
      why: 'Staging labels let the new value be created and verified before it becomes current, avoiding downtime.',
    },
    {
      q: 'A cheaper option for non-rotating config values is...',
      choices: [
        'Hard-coding them',
        'SSM Parameter Store SecureString',
        "An S3 bucket named 'secrets'",
        'Environment variables in the Dockerfile',
      ],
      answer: 1,
      why: 'Parameter Store SecureString is KMS-encrypted and cheaper, but lacks built-in rotation.',
    },
    {
      q: 'Where should a running app get its DB password?',
      choices: [
        'From a committed .env file',
        'By calling GetSecretValue at runtime',
        'From the AMI',
        'From a public S3 object',
      ],
      answer: 1,
      why: 'Fetching at runtime keeps the secret out of code, images and version control.',
    },
  ],
  badge: { name: 'VAULT KEEPER', emoji: '📜' },
};
