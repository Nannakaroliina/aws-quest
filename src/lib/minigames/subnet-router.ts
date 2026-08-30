// @ts-nocheck -- transitional: imperative DOM code ported verbatim from the
// pre-SvelteKit src/minigames.js. Typed when rebuilt as Svelte components.
import { makeQuiz } from './make-quiz';

export const subnetRouter = makeQuiz({
  controls: '↑ ↓ pick a route  ·  ENTER send',
  winAt: 6,
  winLine:
    'A subnet is “public” only because its route table points 0.0.0.0/0 at an Internet Gateway. Private subnets reach out via NAT, reach AWS services via endpoints, and reach each other via the local route.',
  loseLine:
    'Re-read the routing section: IGW = in/out to the internet for public subnets, NAT = outbound-only for private, endpoints = private path to S3/DynamoDB, local = inside the VPC.',
  rounds: [
    {
      prompt:
        'An app server in a PRIVATE subnet needs to download an OS security patch from the public internet.',
      choices: ['Internet Gateway', 'NAT Gateway', 'Gateway VPC Endpoint', 'Local route'],
      answer: 1,
      why: 'Private subnets have no route to the IGW. Outbound-only internet access goes through a NAT Gateway sitting in a public subnet.',
    },
    {
      prompt:
        'That same private app server needs to PUT backup files into an S3 bucket in the same region.',
      choices: [
        'Internet Gateway',
        'NAT Gateway',
        'Gateway VPC Endpoint (S3/DynamoDB)',
        'Local route',
      ],
      answer: 2,
      why: 'A gateway endpoint keeps S3 traffic on the AWS network — no NAT data-processing charges, nothing traverses the internet.',
    },
    {
      prompt:
        'The app server needs to reach the database in a different private subnet of the SAME VPC.',
      choices: ['Internet Gateway', 'NAT Gateway', 'Gateway VPC Endpoint', 'Local route'],
      answer: 3,
      why: 'Every subnet in a VPC can reach every other subnet through the implicit local route. No gateway is involved.',
    },
    {
      prompt: 'A public Application Load Balancer must accept HTTPS from users on the internet.',
      choices: ['Internet Gateway', 'NAT Gateway', 'Gateway VPC Endpoint', 'Local route'],
      answer: 0,
      why: 'The ALB lives in a public subnet whose route table sends 0.0.0.0/0 to the Internet Gateway — that is what makes it reachable.',
    },
    {
      prompt: 'A Lambda function attached to the VPC needs to call the DynamoDB API.',
      choices: [
        'Internet Gateway',
        'NAT Gateway',
        'Gateway VPC Endpoint (S3/DynamoDB)',
        'Local route',
      ],
      answer: 2,
      why: 'DynamoDB, like S3, is reached through a gateway VPC endpoint — no NAT required and traffic stays private.',
    },
    {
      prompt: 'A private worker calls a third-party payment API at api.example-payments.com.',
      choices: ['Internet Gateway', 'NAT Gateway', 'Gateway VPC Endpoint', 'Local route'],
      answer: 1,
      why: 'An arbitrary internet endpoint has no VPC endpoint, so outbound traffic must go through NAT.',
    },
    {
      prompt: 'An instance in AZ-a talks to an instance in AZ-b — both private, same VPC.',
      choices: ['Internet Gateway', 'NAT Gateway', 'Gateway VPC Endpoint', 'Local route'],
      answer: 3,
      why: 'The local route spans every AZ of the VPC; that traffic never leaves the AWS network.',
    },
    {
      prompt:
        'A bastion host in a PUBLIC subnet receives an inbound SSH connection from an admin laptop on the internet.',
      choices: ['Internet Gateway', 'NAT Gateway', 'Gateway VPC Endpoint', 'Local route'],
      answer: 0,
      why: 'Inbound from the internet to a public subnet arrives via the IGW. (Better still: skip the bastion and use SSM Session Manager.)',
    },
  ],
});
