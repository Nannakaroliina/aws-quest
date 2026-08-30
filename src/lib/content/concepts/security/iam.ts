import type { Concept } from '../../types';

export const iam: Concept = {
  id: 'iam',
  world: 'security',
  name: 'AWS IAM',
  sub: 'Identity & Access Management',
  icon: '🗝️',
  briefing: [
    'Before anything else in AWS, there is the question: who is allowed to do what?',
    'IAM answers it. Every API call is checked against IAM policies.',
    'Users and roles carry permissions; policies are JSON grants.',
    'The golden rule: least privilege. Grant only what is needed, nothing more.',
  ],
  metaphor:
    'A keycard system: each badge opens exactly the doors its holder needs, and every swipe is logged.',
  points: [
    'PRINCIPALS: IAM users (long-lived), IAM roles (assumed for temporary credentials), and federated identities.',
    'POLICIES are JSON: Effect (Allow/Deny), Action, Resource, and optional Condition.',
    'ROLES are the preferred pattern -- EC2/Lambda/ECS assume a role and get short-lived STS credentials.',
    'Evaluation: an explicit Deny always wins; otherwise you need an explicit Allow; default is deny.',
    'Guardrails: permission boundaries, and Service Control Policies (SCPs) across an AWS Organization.',
  ],
  deep: {
    works: [
      'When a request arrives, AWS gathers all applicable policies (identity, resource, permission boundary, SCP, session) and evaluates: any explicit Deny -> denied; else an Allow in every relevant scope -> allowed; else implicit deny.',
      'A role has a trust policy (who may assume it) and permission policies (what it can then do). sts:AssumeRole returns temporary keys that expire, so nothing long-lived sits on a server.',
      "IAM Identity Center (successor to SSO) federates human logins from your IdP and hands out role sessions per account -- humans shouldn't have IAM users at all in a mature setup.",
    ],
    diagram:
      '  request --> [ evaluate policies ]\n' +
      '                explicit Deny?  --yes--> DENY\n' +
      '                Allow in identity + boundary + SCP? --yes--> ALLOW\n' +
      '                otherwise --> DENY (implicit)\n' +
      '  EC2 --assumes--> Role --STS--> temp keys (expire in hours)',
    practice: [
      'No access keys on servers -- attach a role. Rotate/duplicate-check any remaining keys.',
      'Start from AWS managed policies, then tighten to custom least-privilege as patterns emerge.',
      'Lock the root user away: hardware MFA, no access keys, break-glass only.',
      "Use SCPs for org-wide 'never' rules (e.g. deny leaving regions, deny disabling CloudTrail).",
    ],
    gotchas: [
      'An explicit Deny anywhere (SCP, boundary, resource policy) overrides every Allow.',
      "Wildcards in Action/Resource ('*') are how over-permissioned roles happen -- scope them.",
      "Cross-account access needs BOTH a role trust policy and the caller's permission to assume it.",
    ],
    pricing:
      'IAM itself is free. IAM Identity Center is free. You only pay for the services actions are performed against.',
    cli: 'aws iam create-role --role-name app-role --assume-role-policy-document file://trust.json\naws iam attach-role-policy --role-name app-role --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess',
  },
  quiz: [
    {
      q: 'In IAM policy evaluation, what always wins?',
      choices: [
        'An explicit Allow',
        'An explicit Deny',
        'The most recent policy',
        'The resource policy',
      ],
      answer: 1,
      why: 'Explicit Deny overrides any Allow; without a Deny you still need an explicit Allow.',
    },
    {
      q: 'How should an EC2 instance get permission to read an S3 bucket?',
      choices: [
        'Hard-code an access key in the app',
        'Attach an IAM role (instance profile)',
        'Make the bucket public',
        'Use the root account keys',
      ],
      answer: 1,
      why: 'Roles give short-lived, rotating credentials with no secret stored on disk.',
    },
    {
      q: 'What is the recommended default posture for permissions?',
      choices: [
        'Grant admin, restrict later',
        "Least privilege -- grant only what's needed",
        'Allow all read, deny all write',
        "Copy a teammate's policy",
      ],
      answer: 1,
      why: 'Least privilege limits blast radius when credentials or code are compromised.',
    },
  ],
  badge: { name: 'GATE WARDEN', emoji: '🗝️' },
  sim: {
    game: 'iamEval',
    label: 'BE THE POLICY ENGINE',
    blurb:
      'A request arrives. Read the identity policy, SCP, permission boundary and any explicit Deny, then return ALLOW or DENY exactly like IAM would.',
  },
};
