import type { Concept } from '../../types';

export const elb: Concept = {
  id: 'elb',
  world: 'network',
  name: 'ELASTIC LOAD BALANCING',
  sub: 'One door, many servers',
  icon: '⚖️',
  briefing: [
    'You have a fleet. Clients need one address, not a list of instances.',
    'A load balancer is that front door -- it spreads traffic and hides failures.',
    'Pick the right type: ALB for HTTP smarts, NLB for raw speed.',
    'It health-checks targets and quietly stops sending traffic to sick ones.',
  ],
  metaphor: 'A restaurant host seating guests across many tables so no waiter is overwhelmed.',
  points: [
    'APPLICATION LOAD BALANCER (ALB): Layer 7, HTTP/HTTPS, routes by path/host/header, WebSocket, gRPC.',
    'NETWORK LOAD BALANCER (NLB): Layer 4, TCP/UDP, ultra-low latency, static IPs, millions of req/s.',
    'GATEWAY LOAD BALANCER (GWLB): inserts third-party network appliances (firewalls, IDS) transparently.',
    'Targets live in TARGET GROUPS; health checks decide which receive traffic.',
    'The LB spans multiple AZs and terminates TLS using certificates from ACM.',
  ],
  deep: {
    works: [
      "An ALB has listeners (e.g. :443) with rules: 'host api.example.com -> target group A', '/images/* -> group B', default -> group C'. It adds X-Forwarded-For / -Proto headers and can auth users via OIDC/Cognito before forwarding.",
      "An NLB preserves the client IP and does little processing, so it's the choice for non-HTTP protocols, extreme throughput, or when you need a fixed IP / PrivateLink endpoint.",
      'Both integrate with Auto Scaling: new instances register into the target group and start receiving traffic once healthy; terminating instances are drained (connection draining / deregistration delay).',
    ],
    diagram:
      '            Internet\n' +
      '               |\n' +
      '        [ ALB :443 ]   (AZ-a + AZ-b)\n' +
      '        /     |      \\\n' +
      '  /app -> TG1  /img -> TG2   api.* -> TG3\n' +
      '   [EC2 EC2]    [EC2]         [Fargate tasks]\n' +
      '   health checks remove unhealthy targets',
    practice: [
      'Use ALB for web/microservice HTTP routing; NLB when you need TCP/UDP, static IP, or raw performance.',
      'Terminate TLS at the LB with an ACM cert; enable HTTP->HTTPS redirect on the :80 listener.',
      "Tune health check path/threshold so a slow-starting app isn't killed before it's ready (slow start).",
      'Turn on access logs (to S3) and put AWS WAF in front of the ALB for L7 protection.',
    ],
    gotchas: [
      'ALB nodes use DNS with changing IPs -- clients must resolve the name, not cache an IP (use NLB for fixed IPs).',
      'Idle connection timeout (default 60s) can cut long-poll / streaming connections; raise it deliberately.',
      'Cross-zone load balancing is free on ALB but bills inter-AZ data on NLB unless enabled thoughtfully.',
    ],
    pricing:
      "Pay per hour the load balancer runs plus 'LCU' (or NLCU) units that meter new connections, active " +
      'connections, bandwidth and rule evaluations. No per-instance charge.',
    cli: 'aws elbv2 create-target-group --name web-tg --protocol HTTP --port 80 --vpc-id vpc-0123 \\\n  --health-check-path /healthz',
  },
  quiz: [
    {
      q: 'You need to route requests to different services by URL path and host header. Which LB?',
      choices: [
        'Network Load Balancer',
        'Application Load Balancer',
        'Gateway Load Balancer',
        'Classic Load Balancer only',
      ],
      answer: 1,
      why: 'Path/host/header routing is a Layer 7 feature of the ALB.',
    },
    {
      q: 'Which load balancer preserves the client source IP and offers a static IP address?',
      choices: ['ALB', 'NLB', 'Both equally', 'Neither'],
      answer: 1,
      why: 'The NLB operates at Layer 4, keeps the client IP, and provides static/Elastic IPs per AZ.',
    },
    {
      q: 'What does a failed health check cause?',
      choices: [
        'The LB shuts down',
        'That target stops receiving new traffic',
        'All targets restart',
        'TLS is disabled',
      ],
      answer: 1,
      why: 'Unhealthy targets are removed from rotation until they pass again.',
    },
  ],
  badge: { name: 'TRAFFIC MARSHAL', emoji: '⚖️' },
  sim: {
    game: 'loadBalancer',
    label: 'MAN THE FRONT DOOR',
    blurb:
      'Six situations. Pick the right load balancer (ALB / NLB / GWLB) and the right behaviour for TLS, health checks and slow-starting targets.',
  },
};
