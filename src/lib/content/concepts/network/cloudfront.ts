import type { Concept } from '../../types';

export const cloudfront: Concept = {
  id: 'cloudfront',
  world: 'network',
  name: 'AMAZON CLOUDFRONT',
  sub: 'Content Delivery Network',
  icon: '🛰️',
  briefing: [
    'Your server is in one place. Your users are everywhere.',
    'CloudFront caches your content at hundreds of edge locations near them.',
    'First request fills the cache; the rest are served locally in milliseconds.',
    'It also shields your origin and terminates TLS at the edge.',
  ],
  metaphor:
    'Neighbourhood corner shops stocking the popular items so nobody drives to the central warehouse.',
  points: [
    'A DISTRIBUTION has one or more ORIGINS (S3, ALB, EC2, or any HTTP server) and cache BEHAVIORS per path.',
    'Edge locations cache responses by cache key; TTLs and cache policies control freshness.',
    'ORIGIN ACCESS CONTROL (OAC) lets only CloudFront read a private S3 bucket.',
    'CloudFront Functions (lightweight, viewer) and Lambda@Edge (heavier) customise requests/responses at the edge.',
    'Integrates with ACM (certs must be in us-east-1), AWS WAF, and Shield for DDoS protection.',
  ],
  deep: {
    works: [
      'On a viewer request, CloudFront routes to the nearest edge. Cache hit -> served immediately. Miss -> the edge fetches from the origin (often via a regional edge cache), stores it per the cache policy, then responds.',
      'The cache key defaults to the URL; you choose which headers, cookies and query strings are included. Fewer keys = higher hit ratio.',
      'Invalidations force-expire cached paths (e.g. /index.html) after a deploy; versioned asset filenames avoid needing them.',
    ],
    diagram:
      '  user (Tokyo) --> [Edge TYO]  hit? --> serve (ms)\n' +
      '                       |\n' +
      '                     miss --> Regional Edge Cache --> Origin (S3 / ALB)\n' +
      '  OAC: S3 bucket only answers CloudFront, not the public internet',
    practice: [
      'Put CloudFront in front of S3 static sites and APIs; lock S3 with OAC and Block Public Access.',
      'Use long TTLs + content-hashed filenames for assets; short/again-validate for HTML.',
      'Attach WAF for L7 rules and rate limiting; Shield Standard is automatic.',
      'Do lightweight edge logic (redirects, header rewrites, auth checks) in CloudFront Functions.',
    ],
    gotchas: [
      'The ACM certificate for a CloudFront custom domain MUST be in us-east-1, regardless of origin region.',
      'Over-forwarding headers/cookies/query strings shreds your cache hit ratio.',
      'Invalidations beyond the free 1,000 paths/month cost money -- prefer versioned filenames.',
    ],
    pricing:
      'Pay for data transfer out to viewers (per region tier) and per 10,000 HTTP/S requests. ' +
      'Origin fetches from AWS are free of inter-service transfer charges. Generous always-free tier.',
    cli: 'aws cloudfront create-invalidation --distribution-id E123ABC --paths "/index.html" "/"',
  },
  quiz: [
    {
      q: 'Where must an ACM certificate live to be used on a CloudFront custom domain?',
      choices: [
        'The same region as the origin',
        'us-east-1 (N. Virginia)',
        'Any region',
        'eu-west-1',
      ],
      answer: 1,
      why: 'CloudFront only reads certificates from us-east-1.',
    },
    {
      q: 'What is the purpose of Origin Access Control (OAC)?',
      choices: [
        'Speed up cache invalidations',
        'Allow only CloudFront to fetch from a private S3 bucket',
        'Encrypt data at rest in S3',
        'Route by latency',
      ],
      answer: 1,
      why: 'OAC keeps the S3 origin private while letting CloudFront serve it.',
    },
    {
      q: 'Which practice most improves cache hit ratio?',
      choices: [
        'Forwarding all headers and cookies',
        'Minimising the cache key (few headers/query strings)',
        'Disabling TLS',
        'Using a single edge location',
      ],
      answer: 1,
      why: 'A smaller cache key means more requests match the same cached object.',
    },
  ],
  badge: { name: 'EDGE RUNNER', emoji: '🛰️' },
};
