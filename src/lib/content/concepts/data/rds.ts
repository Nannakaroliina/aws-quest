import type { Concept } from '../../types';

export const rds: Concept = {
  id: 'rds',
  world: 'data',
  name: 'AMAZON RDS',
  sub: 'Managed relational databases',
  icon: '🛢️',
  briefing: [
    'You need a SQL database, but not the pager duty that comes with running one.',
    'RDS runs MySQL, PostgreSQL, MariaDB, Oracle or SQL Server for you.',
    'Backups, patching, failover, replicas -- handled by the service.',
    'You get an endpoint and a connection string. No shell on the box.',
  ],
  metaphor: 'Renting a fully serviced apartment instead of owning a house with a leaky roof.',
  points: [
    'RDS manages provisioning, OS/engine patching, automated backups and point-in-time recovery (1-35 days).',
    'MULTI-AZ keeps a synchronous standby in another AZ and fails over automatically on trouble.',
    'READ REPLICAS are asynchronous copies that scale read traffic (and can be promoted / cross-region).',
    'You never get OS access; you tune via parameter groups and option groups.',
    'Storage can autoscale; RDS Proxy pools connections for spiky / serverless clients.',
  ],
  deep: {
    works: [
      'Multi-AZ replicates every write to a hidden standby synchronously. On failure, the DNS endpoint is repointed to the standby in ~60-120s -- your app just reconnects. It is for availability, not read scaling.',
      'Read replicas ship the binlog / WAL asynchronously; they lag slightly and are eventually consistent. Point reporting and read-heavy endpoints at them.',
      'Automated backups are daily snapshots + continuous transaction logs, enabling restore to any second in the retention window (as a new instance).',
    ],
    diagram:
      '  app --writes--> [ RDS primary (AZ-a) ] ==sync==> [ standby (AZ-b) ]\n' +
      '                       |  async\n' +
      '                       +--> [ read replica ] <-- reporting / read traffic\n' +
      '  failover: endpoint swings to standby automatically',
    practice: [
      "Turn on Multi-AZ for anything production; test a failover so the app's reconnect logic is proven.",
      'Send read-only workloads to replicas; keep the primary for writes and low-latency reads.',
      'Use RDS Proxy in front of Lambda / large fleets to avoid exhausting DB connections.',
      'Store credentials in Secrets Manager with rotation; restrict access with Security Groups + IAM auth.',
    ],
    gotchas: [
      'Read replicas can lag -- never rely on one for read-after-write correctness.',
      'Multi-AZ failover causes a brief outage; connection pools must retry.',
      'Scaling instance size or storage type can need a maintenance window; plan it.',
    ],
    pricing:
      'Pay per instance-hour (by class + engine), provisioned storage and IOPS, backup storage beyond the DB ' +
      'size, and cross-AZ / cross-region data transfer. Reserved Instances cut the compute cost.',
    cli: 'aws rds create-db-instance --db-instance-identifier app-db --engine postgres \\\n  --db-instance-class db.m6g.large --allocated-storage 100 --multi-az',
  },
  quiz: [
    {
      q: 'What is the PRIMARY purpose of RDS Multi-AZ?',
      choices: [
        'Scaling read traffic',
        'High availability via automatic failover to a standby',
        'Cheaper storage',
        'Global low-latency reads',
      ],
      answer: 1,
      why: 'Multi-AZ is about availability. Read scaling is what read replicas are for.',
    },
    {
      q: 'Read replicas are kept in sync...',
      choices: [
        'Synchronously (zero lag)',
        'Asynchronously (may lag)',
        'Only once per day',
        'By manual export',
      ],
      answer: 1,
      why: 'Replication is async, so replicas can be slightly behind the primary.',
    },
    {
      q: 'How do you tune an RDS engine if you have no OS access?',
      choices: [
        'SSH in and edit configs',
        'Parameter groups and option groups',
        'You cannot tune it',
        'Edit the AMI',
      ],
      answer: 1,
      why: 'RDS exposes engine settings through parameter/option groups instead of shell access.',
    },
  ],
  badge: { name: 'QUERY KNIGHT', emoji: '🛢️' },
};
