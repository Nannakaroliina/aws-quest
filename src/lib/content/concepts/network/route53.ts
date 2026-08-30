import type { Concept } from '../../types';

export const route53: Concept = {
  id: 'route53',
  world: 'network',
  name: 'AMAZON ROUTE 53',
  sub: 'DNS + traffic steering',
  icon: '🧭',
  briefing: [
    'Names are easier than numbers. DNS turns example.com into an address.',
    "Route 53 is AWS's DNS -- authoritative, global, and very fast.",
    'It does more than lookups: it can steer users by latency, geography or health.',
    'It can also register the domain for you.',
  ],
  metaphor: 'A phone directory that also knows which branch office is nearest and open right now.',
  points: [
    'A HOSTED ZONE holds the records for a domain (A, AAAA, CNAME, MX, TXT, NS...).',
    'ALIAS records are an AWS extension: point the zone apex (example.com) straight at an ALB, CloudFront, S3 site -- free, and they follow AWS IP changes.',
    'ROUTING POLICIES: simple, weighted, latency-based, failover, geolocation, geoproximity, multivalue.',
    'HEALTH CHECKS monitor endpoints and can pull unhealthy targets out of DNS answers.',
    'Route 53 offers a 100% availability SLA for the DNS service.',
  ],
  deep: {
    works: [
      "When someone resolves your name, Route 53's edge answers from the record set that matches the query -- e.g. latency-based routing returns the region with the lowest measured latency to that resolver.",
      'Failover routing pairs a primary and secondary record with a health check; if the primary check fails, resolvers start getting the secondary answer within a TTL.',
      "CNAME can't sit at the zone apex (RFC), which is exactly why ALIAS exists -- it resolves apex names to AWS targets at query time.",
    ],
    diagram:
      '  user in EU        user in US\n' +
      '     |                 |\n' +
      '  Route 53 (latency-based + health checks)\n' +
      '     |                 |\n' +
      '  ALB eu-west-1     ALB us-east-1\n' +
      '  (if eu unhealthy -> answer us-east-1)',
    practice: [
      'Use ALIAS A/AAAA records for apex domains pointing at CloudFront or an ALB.',
      'Latency-based or geoproximity routing for multi-region apps; failover routing for active-passive DR.',
      'Keep TTLs moderate (60s) on records you may need to fail over; longer for static ones.',
      'Combine with health checks + CloudWatch alarms so DNS reflects reality automatically.',
    ],
    gotchas: [
      "DNS changes are gated by TTL and downstream resolver caching -- 'instant' cutover is a myth.",
      "A CNAME at the apex is invalid; forgetting this breaks 'https://example.com'.",
      'Health-check-driven failover still costs one TTL of errors; pair with app-level retries.',
    ],
    pricing:
      '~$0.50 per hosted zone per month for the first 25 zones (less beyond that), per-million-query charges (higher for latency/geo policies), ' +
      'health checks per month, and domain registration at cost.',
    cli: 'aws route53 change-resource-record-sets --hosted-zone-id Z123 \\\n  --change-batch file://alias-to-alb.json',
  },
  quiz: [
    {
      q: "Why use an ALIAS record instead of a CNAME for 'example.com'?",
      choices: [
        'ALIAS is encrypted',
        'CNAMEs are not allowed at the zone apex',
        'ALIAS is faster to type',
        'CNAMEs cost more per query',
      ],
      answer: 1,
      why: 'DNS rules forbid CNAME at the apex; ALIAS resolves apex names to AWS targets and is free.',
    },
    {
      q: 'Which routing policy sends users to the region with the lowest latency to them?',
      choices: ['Weighted', 'Failover', 'Latency-based', 'Simple'],
      answer: 2,
      why: 'Latency-based routing answers with the AWS region that measures lowest latency for that resolver.',
    },
    {
      q: 'What can a Route 53 health check do to DNS answers?',
      choices: [
        'Nothing, it only emails you',
        'Remove unhealthy endpoints from the responses',
        'Increase the TTL automatically',
        'Register a new domain',
      ],
      answer: 1,
      why: 'Failing health checks cause Route 53 to stop returning that endpoint.',
    },
  ],
  badge: { name: 'PATHFINDER', emoji: '🧭' },
};
