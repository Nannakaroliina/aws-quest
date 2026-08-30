import type { World, WorldId } from './types';

/** Ordered regions on the overworld map. */
export const WORLDS: World[] = [
  {
    id: 'compute',
    name: 'COMPUTE COVE',
    tint: '#ff9f43',
    blurb: 'Raw processing power washes ashore.',
  },
  {
    id: 'storage',
    name: 'STORAGE SHORES',
    tint: '#4db8ff',
    blurb: 'Endless vaults for your bytes.',
  },
  { id: 'network', name: 'NETWORK NEXUS', tint: '#37e660', blurb: 'Wire the world together.' },
  {
    id: 'data',
    name: 'DATA DUNGEON',
    tint: '#b06fff',
    blurb: 'Tables, keys and queries lurk below.',
  },
  {
    id: 'security',
    name: 'SENTINEL KEEP',
    tint: '#ffd93d',
    blurb: 'Guard the gates. Trust no one.',
  },
  { id: 'ops', name: 'ORACLE TOWER', tint: '#ff6b9d', blurb: 'See all. Automate all.' },
];

/** World -> ordered concept ids. Also defines unlock order within a world. */
export const WORLD_CONCEPTS: Record<WorldId, string[]> = {
  compute: ['ec2', 'lambda', 'autoscaling', 'containers'],
  storage: ['s3', 'ebs', 'storageclasses', 'efs'],
  network: ['vpc', 'elb', 'route53', 'cloudfront', 'apigateway'],
  data: ['rds', 'dynamodb', 'aurora', 'elasticache'],
  security: ['iam', 'kms', 'secretsmanager', 'cognito'],
  ops: ['cloudwatch', 'cloudtrail', 'sqs', 'sns', 'cloudformation', 'eventbridge', 'stepfunctions'],
};

/** Flat progression order across the whole game. */
export const PROGRESSION: string[] = [
  ...WORLD_CONCEPTS.compute,
  ...WORLD_CONCEPTS.storage,
  ...WORLD_CONCEPTS.network,
  ...WORLD_CONCEPTS.data,
  ...WORLD_CONCEPTS.security,
  ...WORLD_CONCEPTS.ops,
];
