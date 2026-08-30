import type { Concept } from '../../types';

export const cloudformation: Concept = {
  id: 'cloudformation',
  world: 'ops',
  name: 'CLOUDFORMATION',
  sub: 'Infrastructure as Code',
  icon: '📐',
  briefing: [
    "Clicking through the console doesn't scale and can't be reviewed.",
    'CloudFormation describes your infrastructure as a template you commit to git.',
    'Deploy the template and it creates a STACK; update it and it computes the diff.',
    'Delete the stack and everything it made goes with it. Reproducible by design.',
  ],
  metaphor: 'A LEGO instruction booklet: the same steps rebuild the exact same model every time.',
  points: [
    'A TEMPLATE (YAML/JSON) declares resources and their properties; deploying it creates a STACK.',
    'It is declarative and dependency-aware -- you say what you want, it orders the create/update/delete.',
    'CHANGE SETS preview exactly what an update will add, modify or replace before you run it.',
    'Rollback on failure, drift detection, nested stacks, and StackSets for multi-account/region rollout.',
    'The AWS CDK lets you write infrastructure in real languages that synthesise to CloudFormation.',
  ],
  deep: {
    works: [
      'On create/update, CloudFormation builds a dependency graph from Ref / Fn::GetAtt references and provisions resources in order, in parallel where possible. If a step fails, it rolls the stack back to the last known-good state.',
      "Some property changes update in place; others force a replacement (new resource, then delete old) -- change sets tell you which, so you don't accidentally recreate a database.",
      'Templates use parameters, mappings, conditions and outputs to stay reusable across environments; outputs can be exported and imported by other stacks.',
    ],
    diagram:
      '  template.yaml (in git)\n' +
      '     |  aws cloudformation deploy\n' +
      '     v\n' +
      '  [ Stack: prod-network ]  --creates/updates in dependency order-->\n' +
      '     VPC -> Subnets -> Route Tables -> NAT GW -> SG\n' +
      '  change set = dry-run diff   |   delete stack = remove all of it',
    practice: [
      'Keep templates in version control and deploy them through CI, not the console.',
      "Always review a change set before updating production; watch for 'Replacement: True' on stateful resources.",
      'Split by lifecycle/blast radius: network, data, app as separate stacks with exported outputs.',
      'Use CDK (or at least modules/nested stacks) to avoid thousand-line copy-paste templates.',
    ],
    gotchas: [
      "Manual console changes cause 'drift' -- the stack no longer matches the template; detect and reconcile.",
      'Deleting a stack can delete your database unless the resource has DeletionPolicy: Retain / Snapshot.',
      'A failed create rolls back and deletes everything by default -- disable rollback to debug, then clean up.',
    ],
    pricing:
      'CloudFormation and CDK are free; you pay only for the AWS resources the stack provisions. (CloudFormation ' +
      'registry third-party resource handlers have a small per-operation charge.)',
    cli: 'aws cloudformation deploy --template-file template.yaml --stack-name prod-network \\\n  --parameter-overrides Env=prod --capabilities CAPABILITY_IAM',
  },
  quiz: [
    {
      q: 'What does a CloudFormation change set give you?',
      choices: [
        'A cost estimate only',
        'A preview of what an update will add, modify or replace',
        'A backup of the stack',
        'Faster deployments',
      ],
      answer: 1,
      why: 'Change sets are a dry run so you can catch risky replacements before applying.',
    },
    {
      q: 'Console edits to a CloudFormation-managed resource cause...',
      choices: [
        'An automatic template update',
        'Stack drift -- template and reality diverge',
        'Immediate rollback',
        'Nothing detectable',
      ],
      answer: 1,
      why: 'Out-of-band changes create drift; use drift detection and re-align via the template.',
    },
    {
      q: "How do you stop 'delete stack' from destroying your production database?",
      choices: [
        'Nothing can prevent it',
        'Set DeletionPolicy: Retain or Snapshot on that resource',
        'Rename the stack',
        'Use JSON instead of YAML',
      ],
      answer: 1,
      why: 'DeletionPolicy controls whether a resource is kept or snapshotted when removed.',
    },
  ],
  badge: { name: 'BLUEPRINT SAGE', emoji: '📐' },
};
