import type { Concept } from '../../types';

export const efs: Concept = {
  id: 'efs',
  world: 'storage',
  name: 'AMAZON EFS',
  sub: 'Elastic File System',
  icon: '🗂️',
  briefing: [
    'EBS gives one instance a disk. EFS gives many instances the same folder.',
    'It is a fully managed NFS share that grows and shrinks automatically.',
    'Mount it from EC2, from containers, even from Lambda -- all at once.',
    'Linux and POSIX only. It is a file system, not object storage.',
  ],
  metaphor:
    'A shared network drive for your whole fleet -- everyone sees the same files instantly.',
  points: [
    'EFS presents an NFSv4 file system reachable from mount targets in each AZ of your VPC.',
    'Thousands of clients can read/write concurrently with standard file locking and permissions.',
    'Capacity is elastic -- you pay for what you store, no pre-provisioning.',
    'Regional storage classes: Standard, Standard-IA, and Archive; One Zone file systems offer One Zone and One Zone-IA. Lifecycle policies move cold files to lower-cost classes.',
    'Throughput modes: Elastic (default, scales with load), Bursting, or Provisioned.',
  ],
  deep: {
    works: [
      'You create one mount target per AZ (an ENI with an IP). Clients in that AZ mount nfs://<ip>:/ or use the EFS mount helper with TLS. Data is stored redundantly across all AZs in the region (Standard).',
      "Because it's multi-AZ and network file storage, per-operation latency is higher than a local EBS volume -- great for shared config, content, and home directories; poor for a busy transactional database.",
      'Access Points give an application a locked-down entry: enforced POSIX user/group and a root directory, so multi-tenant apps stay isolated.',
    ],
    diagram:
      '        VPC\n' +
      '  AZ-a           AZ-b           AZ-c\n' +
      '  [EC2]-mt-\\      [EC2]-mt-\\     [Lambda]-mt-\\\n' +
      '           \\----- EFS file system (data across all AZs) -----/',
    practice: [
      'Use it for shared assets across an Auto Scaling web fleet, CMS uploads, CI caches, ML datasets.',
      'Turn on lifecycle management to drop untouched files to IA and cut cost.',
      'Mount with the EFS mount helper and encryption in transit; enable encryption at rest (KMS).',
      'Prefer Access Points over hand-managed permissions for per-app isolation.',
    ],
    gotchas: [
      "Latency is higher than EBS -- don't run a write-heavy relational DB on it.",
      'Per-GB cost is higher than EBS or S3; keep only genuinely shared, active data here.',
      'Linux/NFS only; Windows workloads need FSx for Windows File Server instead.',
    ],
    pricing:
      'Pay per GB-month stored (Standard vs IA priced very differently), optional Provisioned Throughput, ' +
      "and small per-GB charges when reading/writing IA data. No charge for capacity you don't use.",
    cli: 'sudo mount -t efs -o tls fs-0123abcd:/ /mnt/shared',
  },
  quiz: [
    {
      q: 'The key difference between EFS and EBS is that EFS...',
      choices: [
        'Is cheaper per GB',
        'Can be mounted by many instances at once',
        'Only works on Windows',
        'Stores objects, not files',
      ],
      answer: 1,
      why: 'EFS is a shared multi-AZ NFS file system; EBS attaches to a single instance.',
    },
    {
      q: 'Which workload is a POOR fit for EFS?',
      choices: [
        'Shared web assets across an ASG',
        'A write-heavy transactional database',
        'A CI build cache',
        'Home directories for a dev fleet',
      ],
      answer: 1,
      why: 'Higher network-file latency makes EFS unsuitable for busy transactional DBs.',
    },
    {
      q: 'How is EFS capacity managed?',
      choices: [
        'You pre-provision GBs like EBS',
        'It is elastic -- grows and shrinks automatically',
        'Fixed 1 TB per file system',
        'You buy it in Reserved blocks',
      ],
      answer: 1,
      why: 'EFS scales storage automatically and you pay only for what you store.',
    },
  ],
  badge: { name: 'SHARE KEEPER', emoji: '🗂️' },
};
