// @ts-nocheck -- transitional: imperative DOM code ported verbatim from the
// pre-SvelteKit src/minigames.js. Typed when rebuilt as Svelte components.
import { makeQuiz } from './make-quiz';

export const loadBalancer = makeQuiz({
  controls: '↑ ↓ pick  ·  ENTER lock in',
  winAt: 4,
  winLine:
    'ALB = Layer 7 (routes by host/path/header, terminates TLS, auth). NLB = Layer 4 (raw TCP/UDP, static IP, extreme throughput). Health checks pull sick targets out of rotation; Auto Scaling replaces them.',
  loseLine:
    'Re-read the ELB card: match the OSI layer to the need, terminate TLS at the balancer, and let health checks + slow start protect a warming app.',
  rounds: [
    {
      prompt:
        'You must route example.com/api/* to one target group and /images/* to another, purely by URL path.',
      choices: [
        'Application Load Balancer',
        'Network Load Balancer',
        'Route 53 records',
        'A Security Group rule',
      ],
      answer: 0,
      why: 'Path / host / header routing is a Layer 7 feature — that is the ALB.',
    },
    {
      prompt:
        'A game backend needs raw TCP throughput, the lowest possible latency, and a fixed static IP for an allow-list.',
      choices: ['Application Load Balancer', 'Network Load Balancer', 'CloudFront', 'API Gateway'],
      answer: 1,
      why: 'The NLB works at Layer 4, preserves the client IP, hands out static/Elastic IPs, and scales to millions of req/s.',
    },
    {
      prompt: 'One instance in a target group starts failing its health check.',
      choices: [
        'The load balancer terminates the instance',
        'The LB stops sending it new requests until it passes again',
        'All targets in the group restart',
        'TLS is disabled for the listener',
      ],
      answer: 1,
      why: 'Unhealthy targets are removed from rotation, not killed. Auto Scaling (a separate service) is what replaces them.',
    },
    {
      prompt:
        'Where should you terminate TLS and attach the ACM certificate for a web app behind a fleet?',
      choices: [
        'On every EC2 instance',
        'On the load balancer listener',
        'In the Route 53 hosted zone',
        'On the VPC',
      ],
      answer: 1,
      why: 'Terminate at the balancer with an ACM cert and add an HTTP→HTTPS redirect on the :80 listener. Instances stay plain HTTP inside the VPC.',
    },
    {
      prompt:
        'A newly registered instance needs ~40 seconds to warm caches before it can serve well.',
      choices: [
        'Nothing — it takes full traffic immediately and errors',
        'Use the health check + slow start so traffic ramps only once it is healthy',
        'Disable health checks so it is never marked down',
        'Move it to a different AZ',
      ],
      answer: 1,
      why: 'Health checks keep traffic off until the app is ready; slow start then ramps requests in gradually instead of hitting it at full load.',
    },
    {
      prompt:
        'You need to run a third-party firewall / IDS appliance transparently in the traffic path.',
      choices: [
        'Application Load Balancer',
        'Network Load Balancer',
        'Gateway Load Balancer',
        'CloudFront',
      ],
      answer: 2,
      why: 'The Gateway Load Balancer inserts inline appliances (firewalls, IDS/IPS) using the GENEVE protocol, invisibly to the application.',
    },
  ],
});
