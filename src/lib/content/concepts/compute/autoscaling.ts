import type { Concept } from '../../types';

export const autoscaling: Concept = {
  id: 'autoscaling',
  world: 'compute',
  name: 'EC2 AUTO SCALING',
  sub: 'Capacity that follows demand',
  icon: '📈',
  briefing: [
    'Traffic is never flat. Mornings spike, nights fall quiet.',
    'An Auto Scaling group keeps a fleet of EC2 instances at the right size for right now.',
    'It also replaces instances that fail their health check -- self-healing capacity.',
    'You set the rules; it does the launching and terminating.',
  ],
  metaphor: 'A thermostat for servers: set the target, it adds or removes heat.',
  points: [
    'An Auto Scaling Group (ASG) has MIN, DESIRED and MAX instance counts.',
    'A LAUNCH TEMPLATE defines what each new instance looks like (AMI, type, security groups, user data).',
    'SCALING POLICIES adjust desired capacity: target tracking, step, scheduled, or predictive.',
    'The ASG spreads instances across multiple AZs and integrates with load balancer target groups.',
    'Failed health checks (EC2 or ELB) cause the ASG to terminate and replace the instance.',
  ],
  deep: {
    works: [
      'Target tracking is the common choice: pick a metric (e.g. average CPU 50%, or ALB requests-per-target) and the ASG adds/removes instances to hold that number, like cruise control.',
      'Scheduled actions handle known patterns (scale up at 08:00 weekdays). Predictive scaling uses ML on history to pre-provision before a forecast spike.',
      "Lifecycle hooks pause an instance in 'pending' or 'terminating' so you can warm caches or drain connections before it serves or dies.",
    ],
    diagram:
      '        CloudWatch metric (CPU / RPS)\n' +
      '                 |  crosses target\n' +
      '                 v\n' +
      '  [ Auto Scaling Group ]  min1 / desired3 / max10\n' +
      '     |        |        |\n' +
      '   AZ-a     AZ-b     AZ-c   <-- spread, behind an ALB',
    practice: [
      'Scale on a load metric that tracks user demand (requests per target) rather than CPU alone.',
      'Keep min >= 2 across 2 AZs so a single failure never drops you to zero.',
      'Use instance refresh to roll out a new launch template version safely.',
      'Enable termination protection for scale-in on stateful nodes, or move state off the instance.',
    ],
    gotchas: [
      'Scaling out is not instant -- boot + app warmup can be minutes; pre-scale for sharp spikes.',
      "Aggressive policies cause 'flapping'; tune cooldowns / step sizes.",
      'The ASG can only replace an instance, not fix bad app code that fails health checks in a loop.',
    ],
    pricing: 'The ASG feature is free. You pay only for the EC2 instances (and EBS/ELB) it runs.',
    cli: 'aws autoscaling put-scaling-policy --auto-scaling-group-name web-asg \\\n  --policy-name cpu50 --policy-type TargetTrackingScaling \\\n  --target-tracking-configuration \'{"PredefinedMetricSpecification":{"PredefinedMetricType":"ASGAverageCPUUtilization"},"TargetValue":50.0}\'',
  },
  quiz: [
    {
      q: "Which three numbers define an Auto Scaling group's size?",
      choices: [
        'Small, medium, large',
        'Min, desired, max',
        'CPU, memory, disk',
        'Dev, staging, prod',
      ],
      answer: 1,
      why: "The ASG keeps 'desired' running, never below min or above max.",
    },
    {
      q: 'What does target tracking scaling do?',
      choices: [
        'Runs instances only on a schedule',
        'Holds a chosen metric near a set value by adding/removing instances',
        'Tracks the cost target',
        'Pins instances to one AZ',
      ],
      answer: 1,
      why: 'Like a thermostat -- e.g. keep average CPU at 50% by changing capacity.',
    },
    {
      q: 'An instance fails its ELB health check. The ASG will...',
      choices: [
        'Email you and wait',
        'Terminate it and launch a replacement',
        'Reboot the load balancer',
        'Reduce the max size',
      ],
      answer: 1,
      why: 'Auto Scaling self-heals by replacing unhealthy instances.',
    },
  ],
  badge: { name: 'ELASTIC ENGINEER', emoji: '📈' },
  sim: {
    game: 'autoscale',
    label: 'RUN THE SCALER',
    blurb:
      'A live demand curve is coming. Keep capacity just above it -- not on the floor, not a giant idle fleet -- by hand, then let target tracking do it.',
  },
};
