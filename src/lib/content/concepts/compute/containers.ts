import type { Concept } from '../../types';

export const containers: Concept = {
  id: 'containers',
  world: 'compute',
  name: 'ECS + FARGATE',
  sub: 'Run containers, not servers',
  icon: '📦',
  briefing: [
    'Containers package your app with its dependencies so it runs the same everywhere.',
    "ECS is AWS's orchestrator -- it schedules containers, keeps them running, wires up networking.",
    'FARGATE is the serverless engine underneath: no EC2 hosts for you to patch or scale.',
    'Prefer Kubernetes? EKS is the managed-K8s door down the hall.',
  ],
  metaphor:
    'A shipping yard: standard boxes (containers), a crane operator (ECS) placing them on ships (compute).',
  points: [
    'A TASK DEFINITION is the blueprint: image, CPU/memory, ports, env vars, IAM role, log config.',
    'A TASK is a running instance of that blueprint; a SERVICE keeps N tasks running and replaces failures.',
    'Launch type EC2 = you manage a cluster of instances. FARGATE = AWS runs the compute per task.',
    'ECR (Elastic Container Registry) stores your private Docker images.',
    'Tasks get their own elastic network interface and can sit behind an ALB target group.',
  ],
  deep: {
    works: [
      'You push an image to ECR, register a task definition referencing it, then create a Service with a desired count and (optionally) an ALB. ECS places tasks, registers them with the load balancer and restarts any that exit.',
      'With Fargate you only declare CPU/memory sizes (e.g. 0.5 vCPU / 1 GB); AWS finds capacity, runs the task in an isolated micro-VM and bills per second.',
      'Service Auto Scaling adjusts the task count on CloudWatch metrics, the same idea as EC2 Auto Scaling but for containers.',
    ],
    diagram:
      '  ECR image  -->  Task Definition  -->  ECS Service (desired=4)\n' +
      '                                          |    |    |    |\n' +
      '                                        task task task task   (Fargate micro-VMs)\n' +
      '                                          \\___ ALB target group ___/',
    practice: [
      'Start with Fargate; move to EC2 launch type only when you need GPUs, huge scale economics, or special kernels.',
      'One container concern per task definition; use sidecars for logging/proxy.',
      "Pull secrets from Secrets Manager / SSM at task start, don't bake them into the image.",
      'Ship logs to CloudWatch with the awslogs driver, or FireLens for routing elsewhere.',
    ],
    gotchas: [
      'Fargate task storage is ephemeral (20 GB default, up to 200 GB); mount EFS for shared/persistent files.',
      'Cold task launch is seconds, not milliseconds -- not a fit for spiky sub-second bursts.',
      'Fargate per-vCPU pricing beats EC2 only at low/variable utilisation; do the math at scale.',
    ],
    pricing:
      'Fargate: pay per vCPU-second and GB-second while a task runs. EC2 launch type: pay for the EC2 ' +
      'instances regardless of how packed they are. ECS control plane itself is free.',
    cli: 'aws ecs update-service --cluster prod --service web --desired-count 6',
  },
  quiz: [
    {
      q: 'What is an ECS task definition?',
      choices: [
        'A billing report',
        'The blueprint for a container: image, CPU/mem, ports, role',
        'A running EC2 instance',
        'A VPC subnet',
      ],
      answer: 1,
      why: 'Tasks are launched from a task definition; a service keeps a desired number of them alive.',
    },
    {
      q: 'The main benefit of the Fargate launch type over EC2 launch type is...',
      choices: [
        'It is always cheaper',
        'No EC2 hosts to provision, patch or scale',
        'It supports more regions',
        'It runs Windows only',
      ],
      answer: 1,
      why: 'Fargate removes host management; you declare task size and AWS supplies the compute.',
    },
    {
      q: 'Where do your private container images live?',
      choices: ['S3 bucket', 'ECR', 'DynamoDB', 'AMI catalog'],
      answer: 1,
      why: "Elastic Container Registry (ECR) is AWS's managed private image registry.",
    },
  ],
  badge: { name: 'CONTAINER CAPTAIN', emoji: '📦' },
};
