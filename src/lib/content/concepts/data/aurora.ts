import type { Concept } from '../../types';

export const aurora: Concept = {
  id: 'aurora',
  world: 'data',
  name: 'AMAZON AURORA',
  sub: 'Cloud-native MySQL / PostgreSQL',
  icon: '🌌',
  briefing: [
    "Aurora is AWS's own database engine, wire-compatible with MySQL and PostgreSQL.",
    'It splits compute from a distributed storage layer that spans three AZs.',
    'Storage grows on its own, replicas are cheap, and failover is fast.',
    'Same SQL you know, rebuilt for the cloud underneath.',
  ],
  metaphor: 'A familiar car body bolted onto a completely re-engineered chassis.',
  points: [
    'One shared, log-structured storage volume auto-grows to 128 TiB (up to 256 TiB for supported Aurora PostgreSQL versions) and keeps 6 copies across 3 AZs.',
    'Up to 15 read replicas share that same storage, so replica lag is typically milliseconds.',
    'Failover to a replica is usually under ~30 seconds because there is no data to copy.',
    'AURORA SERVERLESS v2 scales compute in fine-grained ACU steps for variable workloads.',
    'GLOBAL DATABASE replicates to other regions with typical sub-second lag for DR and local reads.',
  ],
  deep: {
    works: [
      "Aurora compute nodes don't write data pages -- they send redo log records to the storage layer, which materialises pages. Six-way replication with quorum writes (4/6) and reads (3/6) means an AZ or disk failure is invisible.",
      "Because replicas read the same storage volume, adding one doesn't copy the dataset and lag stays tiny; the writer and readers share a cluster endpoint (writes) and reader endpoint (load-balanced reads).",
      'Serverless v2 adjusts capacity in ~0.5 ACU increments in-place, so a workload can idle cheaply and burst without a failover.',
    ],
    diagram:
      '  [ Writer ]      [ Reader ] [ Reader ] ... (up to 15)\n' +
      '      \\             |          /\n' +
      '       \\----- shared distributed storage -----/\n' +
      '        6 copies across AZ-a / AZ-b / AZ-c, auto-grow to 128/256 TiB*',
    practice: [
      'Use the cluster endpoint for writes and the reader endpoint to spread read load automatically.',
      'Pick Aurora Serverless v2 for spiky or unpredictable load; provisioned for steady high throughput.',
      'Use Global Database for cross-region disaster recovery and low-latency local reads.',
      "Enable Backtrack (MySQL) or fast clones for quick 'oops' recovery and test environments.",
    ],
    gotchas: [
      'Aurora costs more per hour than the equivalent open-source RDS engine -- justify it with the HA/scale features.',
      "You still can't get OS access; it is managed like RDS.",
      'Many Serverless v2 clusters keep a small paid capacity floor. Supported engine versions can use a 0-ACU minimum and auto-pause, trading idle compute cost for resume latency.',
    ],
    pricing:
      'Pay per instance-hour (or per-ACU-hour for Serverless v2), plus storage per GB-month and I/O ' +
      '(or a flat I/O-Optimized rate), plus backups and cross-region replication.',
    cli: 'aws rds create-db-cluster --db-cluster-identifier app --engine aurora-postgresql \\\n  --engine-mode provisioned --master-username admin --manage-master-user-password',
  },
  quiz: [
    {
      q: 'Why is Aurora replica lag usually only milliseconds?',
      choices: [
        'Replicas use faster CPUs',
        'Replicas read the same shared storage volume as the writer',
        'Replication is synchronous SQL replay',
        'Lag is actually always zero',
      ],
      answer: 1,
      why: "All nodes attach to one distributed storage layer, so there's little to replicate node-to-node.",
    },
    {
      q: 'How many copies of the data does Aurora keep, and across how many AZs?',
      choices: [
        '2 copies, 1 AZ',
        '3 copies, 2 AZs',
        '6 copies, 3 AZs',
        '1 copy, replicated nightly',
      ],
      answer: 2,
      why: 'Six-way replication across three Availability Zones with quorum reads/writes.',
    },
    {
      q: 'Best Aurora option for a workload with unpredictable, spiky traffic?',
      choices: [
        'Provisioned single instance',
        'Aurora Serverless v2',
        'A read replica only',
        'Multi-AZ RDS MySQL',
      ],
      answer: 1,
      why: 'Serverless v2 scales compute up and down in fine steps without failover.',
    },
  ],
  badge: { name: 'VOID SCRIBE', emoji: '🌌' },
};
