import type { Concept } from '../../types';

export const vpc: Concept = {
  id: 'vpc',
  world: 'network',
  name: 'AMAZON VPC',
  sub: 'Virtual Private Cloud',
  icon: '🌐',
  briefing: [
    'Every resource needs somewhere to live on the network. That place is a VPC.',
    'It is your own private slice of the AWS network, isolated from everyone else.',
    'You carve it into subnets, decide what is public, and control every route.',
    'Get the VPC right and security, scaling and connectivity all get easier.',
  ],
  metaphor:
    'Your own gated neighbourhood inside a huge city -- you lay the streets and man the gates.',
  points: [
    'A VPC is defined by a CIDR block (e.g. 10.0.0.0/16) within one region.',
    "SUBNETS are CIDR slices, each pinned to one AZ. 'Public' = route to an Internet Gateway.",
    'PRIVATE subnets reach the internet outbound via a NAT Gateway; nothing gets in unsolicited.',
    'SECURITY GROUPS (stateful, per-ENI, allow-only) vs NACLs (stateless, per-subnet, allow+deny).',
    'VPC ENDPOINTS let you reach S3, DynamoDB and other services without traversing the internet.',
  ],
  deep: {
    works: [
      "Route tables are the brain: a subnet is 'public' only because its route table sends 0.0.0.0/0 to an Internet Gateway. Private subnets send 0.0.0.0/0 to a NAT Gateway that lives in a public subnet.",
      'Security Groups are evaluated as a whole and are stateful -- allow inbound 443 and the response is automatically allowed out. NACLs are checked in numbered order and you must allow return traffic explicitly.',
      'To connect VPCs or on-prem: VPC Peering (1:1, no transitive), Transit Gateway (hub-and-spoke at scale), or Site-to-Site VPN / Direct Connect for the data centre.',
    ],
    diagram:
      '  VPC 10.0.0.0/16\n' +
      '  +--------------------------------------------------+\n' +
      '  | Public subnet 10.0.1.0/24 (AZ-a)                 |\n' +
      '  |   [ALB]   [NAT GW] --- Internet Gateway --- WWW  |\n' +
      '  | Private subnet 10.0.11.0/24 (AZ-a)              |\n' +
      '  |   [App EC2] --0.0.0.0/0--> NAT GW               |\n' +
      '  |   [--> S3 via Gateway Endpoint, no internet]    |\n' +
      '  +--------------------------------------------------+',
    practice: [
      'Standard layout: public subnets for load balancers/NAT only; app and DB tiers in private subnets, per AZ.',
      'Use one NAT Gateway per AZ for HA (they are AZ-bound).',
      'Add Gateway Endpoints for S3/DynamoDB and Interface Endpoints for other AWS APIs to cut NAT cost and stay private.',
      'Keep Security Groups tight and reference other SGs (not IP ranges) so rules scale with the fleet.',
    ],
    gotchas: [
      'VPC Peering is not transitive -- A-B and B-C does not give you A-C.',
      "NAT Gateways cost per hour and per GB processed; endpoint-able traffic shouldn't go through them.",
      "You can't shrink or renumber a VPC CIDR later (you can add secondary CIDRs). Plan address space up front.",
    ],
    pricing:
      'The VPC, subnets, route tables, IGW and Security Groups are free. You pay for NAT Gateways (hourly + per GB), ' +
      'Interface Endpoints (hourly + per GB), and inter-AZ / internet data transfer.',
    cli: 'aws ec2 create-vpc --cidr-block 10.0.0.0/16\naws ec2 create-subnet --vpc-id vpc-0123 --cidr-block 10.0.1.0/24 --availability-zone us-east-1a',
  },
  quiz: [
    {
      q: "What makes a subnet 'public'?",
      choices: [
        'It has a public IP range',
        'Its route table sends 0.0.0.0/0 to an Internet Gateway',
        "It is in AZ 'a'",
        'It has no NACL',
      ],
      answer: 1,
      why: 'Public vs private is purely about the route to an Internet Gateway.',
    },
    {
      q: 'Which is stateful and evaluated as a whole set of allow rules?',
      choices: ['Network ACL', 'Security Group', 'Route table', 'DHCP option set'],
      answer: 1,
      why: 'Security Groups are stateful allow-only rules per ENI; NACLs are stateless per subnet.',
    },
    {
      q: 'How do instances in a private subnet get software updates from the internet?',
      choices: [
        'Directly via the Internet Gateway',
        'Outbound through a NAT Gateway',
        'They cannot, ever',
        'Through a Security Group',
      ],
      answer: 1,
      why: 'A NAT Gateway in a public subnet provides outbound-only internet for private subnets.',
    },
  ],
  badge: { name: 'NETWORK ARCHITECT', emoji: '🌐' },
  sim: {
    game: 'subnetRouter',
    label: 'ROUTE THE PACKETS',
    blurb:
      'Eight packets leave a subnet. Send each one out the right door: Internet Gateway, NAT Gateway, a VPC endpoint, or the local route.',
  },
};
