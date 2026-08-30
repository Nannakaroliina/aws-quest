import type { Concept } from '../../types';

export const ec2: Concept = {
  id: 'ec2',
  world: 'compute',
  name: 'AMAZON EC2',
  sub: 'Elastic Compute Cloud',
  icon: '🖥️',
  briefing: [
    'Welcome, recruit. I am CIRRUS, your cloud guide.',
    'EC2 rents you virtual servers by the second.',
    'Pick a size, pick an image, press start -- a machine boots in the cloud.',
    'It is the oldest building block. Master it and the rest makes sense.',
  ],
  metaphor: 'Like renting a PC in a giant warehouse instead of buying one for your closet.',
  points: [
    'An EC2 instance is a virtual machine running on AWS hardware in one Availability Zone.',
    'You choose an INSTANCE TYPE (family + size, e.g. m7i.large) for CPU / RAM / network balance.',
    'An AMI (Amazon Machine Image) is the disk template it boots from.',
    'SECURITY GROUPS act as a stateful virtual firewall around the instance.',
    'USER DATA is a script that runs once on first boot to configure the box.',
  ],
  deep: {
    works: [
      'AWS runs a hypervisor (Nitro) on physical hosts. Your instance is a slice of that host with dedicated vCPUs, memory and Nitro-backed networking and storage.',
      'Root disk is usually an EBS volume (network block storage) so the instance can stop/start and keep its data. Instance-store disks are physically attached but vanish on stop.',
      'Instances live in a subnet of your VPC and get a private IP; a public IP or Elastic IP is optional for inbound internet access.',
    ],
    diagram:
      '  Region (us-east-1)\n' +
      '  +-------------------------------------+\n' +
      '  |  AZ us-east-1a      AZ us-east-1b   |\n' +
      '  |  [ EC2 m7i.large ]  [ EC2 ...    ]  |\n' +
      '  |     | EBS gp3          | EBS gp3    |\n' +
      '  |     +--- Security Group (firewall) |\n' +
      '  +-------------------------------------+',
    practice: [
      'Bake golden AMIs (or use user-data + config mgmt) so instances are disposable, not pets.',
      'Put instances behind a load balancer in 2+ AZs and let an Auto Scaling group replace failures.',
      'Use IAM roles on the instance (instance profile) instead of copying access keys onto disk.',
      'Reach shells with SSM Session Manager -- no open port 22, full audit log.',
    ],
    gotchas: [
      'Stopping an instance releases its auto-assigned public IP; use an Elastic IP if it must be stable.',
      'Right-sizing matters -- most bills are wasted on idle oversized instances.',
      "An instance is tied to one AZ; AZ outage = design for it, don't hope against it.",
    ],
    pricing:
      'On-Demand = per-second, no commitment. Savings Plans / Reserved = up to ~72% off for a 1-3 yr commit. ' +
      'Spot = spare capacity up to ~90% off but can be reclaimed with a 2-minute warning.',
    cli: 'aws ec2 run-instances --image-id ami-0abcd1234 --instance-type t3.micro \\\n  --key-name my-key --security-group-ids sg-0123 --subnet-id subnet-0123',
  },
  quiz: [
    {
      q: 'What does a Security Group do for an EC2 instance?',
      choices: [
        'Encrypts the root volume',
        'Acts as a stateful virtual firewall',
        'Backs up the instance nightly',
        'Assigns the instance type',
      ],
      answer: 1,
      why: 'Security Groups filter inbound/outbound traffic and are stateful -- return traffic is auto-allowed.',
    },
    {
      q: 'You stop and later start an instance. What is most likely to change?',
      choices: [
        'Its private IP',
        'Its auto-assigned public IP',
        'Its AMI',
        'Its attached EBS data',
      ],
      answer: 1,
      why: 'Auto-assigned public IPs are released on stop. Private IP and EBS data persist.',
    },
    {
      q: 'Which purchase option can be reclaimed by AWS with a 2-minute notice?',
      choices: ['On-Demand', 'Reserved Instance', 'Spot Instance', 'Dedicated Host'],
      answer: 2,
      why: 'Spot uses spare capacity cheaply but AWS can interrupt it when it needs the hardware back.',
    },
  ],
  badge: { name: 'COMPUTE CADET', emoji: '⚙️' },
};
