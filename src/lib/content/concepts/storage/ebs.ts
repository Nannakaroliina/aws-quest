import type { Concept } from '../../types';

export const ebs: Concept = {
  id: 'ebs',
  world: 'storage',
  name: 'AMAZON EBS',
  sub: 'Elastic Block Store',
  icon: '💽',
  briefing: [
    'EC2 needs a disk. EBS is that disk -- but delivered over the network.',
    'It behaves like a raw drive you format and mount, yet it outlives the instance.',
    'Snapshots back it up to S3 automatically and incrementally.',
    'One volume, one instance, one AZ (with a couple of exceptions).',
  ],
  metaphor:
    'An external SSD on a very fast cable -- unplug from one PC, plug into another in the same room.',
  points: [
    'EBS volumes provide block storage to a single EC2 instance in the same AZ.',
    'Volume types: gp3/gp2 (general SSD), io2/io1 (high provisioned IOPS), st1 (throughput HDD), sc1 (cold HDD).',
    'gp3 lets you set IOPS and throughput independently of size (baseline 3,000 IOPS / 125 MB/s).',
    'SNAPSHOTS are incremental point-in-time copies stored in S3; create a new volume (any AZ) from one.',
    'Encryption is via KMS and is transparent once enabled.',
  ],
  deep: {
    works: [
      "The volume data actually lives on redundant storage within one AZ; the Nitro card presents it to the instance as a local NVMe device. That network hop is invisible but real -- it's why IOPS/throughput are provisioned quantities.",
      'First snapshot copies all used blocks; later snapshots copy only changed blocks, but each snapshot is still a complete restore point. Deleting an old snapshot never breaks newer ones.',
      'You can grow a volume and change its type live (elastic volumes); the filesystem then needs an online resize.',
    ],
    diagram:
      '  EC2 instance (AZ-a)\n' +
      '     |  NVMe (presented by Nitro)\n' +
      '  [ EBS gp3 100GB / 3000 IOPS ]  --- replicated within AZ-a\n' +
      '         |  snapshot (incremental)\n' +
      '         v\n' +
      '       S3-backed snapshot  --> restore as new volume in AZ-b',
    practice: [
      'Default to gp3 -- cheaper than gp2 and you tune IOPS/throughput to the workload.',
      'Automate snapshots with Data Lifecycle Manager or AWS Backup; test restores.',
      "Enable 'encryption by default' at the account level so every new volume is encrypted.",
      'For databases needing sustained low latency, use io2 Block Express and spread across AZs at the app layer.',
    ],
    gotchas: [
      "A volume can't move AZs -- you snapshot and recreate. Plan HA at the application tier.",
      'Deleting an instance can delete its root volume (DeleteOnTermination) -- check the flag.',
      'Burst-based gp2 can silently throttle under sustained load; gp3 removes that surprise.',
    ],
    pricing:
      'Pay per provisioned GB-month (not used) by type, plus extra provisioned IOPS/throughput on gp3/io2. ' +
      'Snapshots bill for changed-block storage in S3.',
    cli: 'aws ec2 create-snapshot --volume-id vol-0abcd --description "nightly"\naws ec2 modify-volume --volume-id vol-0abcd --volume-type gp3 --iops 6000',
  },
  quiz: [
    {
      q: 'How many EC2 instances can a standard EBS volume attach to at once?',
      choices: ['Unlimited', 'One (per AZ)', 'Up to 10', 'One per region'],
      answer: 1,
      why: 'Standard EBS is single-attach within one AZ; only io2 Multi-Attach is an exception.',
    },
    {
      q: 'An EBS snapshot is stored...',
      choices: [
        "On the instance's local disk",
        'In S3, incrementally',
        'In DynamoDB',
        'In the AMI catalog only',
      ],
      answer: 1,
      why: 'Snapshots are incremental, S3-backed point-in-time copies you can restore in any AZ.',
    },
    {
      q: 'Which volume type lets you set IOPS and throughput independently of capacity?',
      choices: ['gp2', 'gp3', 'st1', 'sc1'],
      answer: 1,
      why: "gp3 decouples performance from size; gp2's performance scaled with GB.",
    },
  ],
  badge: { name: 'BLOCK WARDEN', emoji: '💽' },
};
