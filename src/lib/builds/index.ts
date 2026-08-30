import type { BuildSpec } from '../content/types';

/* =========================================================================
   AWS QUEST -- BUILD TASKS  ("provision it yourself")
   One hands-on setup task per concept, keyed by concept id. Rendered by
   makeBuild() in src/lib/minigames/make-build.ts. game.js falls back to this
   map when a concept record has no inline `build`.

   Spec: { label, blurb, resource, success, steps: [ { prompt, options[],
   correct (index into the authored options order), explain } ] }.
   Options are shuffled at mount time, so `correct` is semantic.
   ========================================================================= */

export const BUILDS: Record<string, BuildSpec> = {
  /* ================= COMPUTE COVE ================= */

  ec2: {
    label: 'PROVISION AN EC2 INSTANCE',
    blurb:
      'Stand up one instance for a steady production web API. Pick the safe, right-sized option for each slot.',
    resource: 'EC2 INSTANCE',
    success:
      'A right-sized instance in a private subnet, booting a trusted AMI, using a role for credentials and SSM for shell access — disposable, not a pet.',
    steps: [
      {
        prompt: 'instance type',
        options: [
          't3.nano — burstable, tiny',
          'm7i.large — balanced CPU/mem',
          'p4d.24xlarge — 8 GPUs',
        ],
        correct: 1,
        explain:
          'A general web API wants balanced compute and memory. nano starves under load; the GPU box is for ML training.',
      },
      {
        prompt: 'machine image (AMI)',
        options: [
          'a random community AMI',
          'the official Amazon Linux 2023 AMI',
          'boot with a blank disk',
        ],
        correct: 1,
        explain:
          'Start from a trusted, patched base image — ideally your own golden AMI baked from it.',
      },
      {
        prompt: 'network placement',
        options: [
          'public subnet with a public IP',
          'private subnet, behind a load balancer',
          'wherever the default VPC puts it',
        ],
        correct: 1,
        explain:
          'App servers belong in private subnets; only the load balancer is exposed to the internet.',
      },
      {
        prompt: 'AWS credentials',
        options: [
          'paste an access key into user-data',
          'attach an IAM role (instance profile)',
          'use the root account keys',
        ],
        correct: 1,
        explain:
          'A role hands the instance short-lived, rotating credentials with nothing written to disk.',
      },
      {
        prompt: 'shell access',
        options: [
          'open port 22 to 0.0.0.0/0',
          'no inbound SSH — use SSM Session Manager',
          'open port 22 to the whole office subnet',
        ],
        correct: 1,
        explain:
          'SSM needs no open port and records every session; an open 22 is a standing invitation.',
      },
      {
        prompt: 'root storage',
        options: [
          'instance store (vanishes on stop)',
          'an EBS gp3 volume',
          'no volume, run from RAM',
        ],
        correct: 1,
        explain: 'EBS survives stop/start and can be snapshotted; instance store is scratch only.',
      },
    ],
  },

  lambda: {
    label: 'SHIP A LAMBDA FUNCTION',
    blurb:
      "Configure a function that handles an event-driven job. Choose the option that respects Lambda's limits.",
    resource: 'LAMBDA FUNCTION',
    success:
      'A small package with heavy init hoisted out of the handler, a sane timeout, its own least-privilege role, and a dead-letter path for async failures.',
    steps: [
      {
        prompt: 'deployment',
        options: [
          'a zip or container image',
          'paste code in the console, no dependencies',
          'upload source over FTP',
        ],
        correct: 0,
        explain: 'You ship a zip or an image; keep it small so cold starts stay short.',
      },
      {
        prompt: 'memory',
        options: ['always 128 MB', 'right-size it (CPU scales with memory)', 'always 10,240 MB'],
        correct: 1,
        explain:
          'More memory also buys more CPU. Tune to the workload rather than pinning to either extreme.',
      },
      {
        prompt: 'timeout',
        options: [
          'leave it at the 3s default',
          'set it just above the observed P99 runtime',
          'always the 900s maximum',
        ],
        correct: 1,
        explain:
          'A tight, deliberate timeout fails fast on hangs instead of billing for 15 idle minutes.',
      },
      {
        prompt: 'hot-path concurrency',
        options: [
          'nothing special',
          'reserved / provisioned concurrency',
          'lower the account concurrency limit',
        ],
        correct: 1,
        explain: 'Provisioned concurrency keeps environments warm for latency-sensitive paths.',
      },
      {
        prompt: 'async failure handling',
        options: [
          'let failures disappear',
          'a DLQ or on-failure destination',
          'retry forever inside the handler',
        ],
        correct: 1,
        explain:
          'Async invokes retry a few times then drop — capture the failures for inspection and replay.',
      },
      {
        prompt: 'permissions',
        options: [
          "reuse another function's admin role",
          'a dedicated least-privilege execution role',
          'no role at all',
        ],
        correct: 1,
        explain: 'Each function gets its own role scoped to exactly what it touches.',
      },
    ],
  },

  autoscaling: {
    label: 'BUILD AN AUTO SCALING GROUP',
    blurb:
      'Wire up a self-healing web fleet that follows demand. Pick the resilient option each time.',
    resource: 'AUTO SCALING GROUP',
    success:
      'Min 2 across multiple AZs, one launch template, target tracking on a load metric, ELB health checks, and rolling instance refresh for updates.',
    steps: [
      {
        prompt: 'min / desired / max',
        options: ['1 / 1 / 1', '2 / 3 / 10', '0 / 0 / 100'],
        correct: 1,
        explain:
          'Keep min ≥ 2 so a single failure never drops you to zero; max caps the blast radius and the bill.',
      },
      {
        prompt: 'instance definition',
        options: [
          'configure each instance by hand',
          'one launch template',
          'clone a running instance each time',
        ],
        correct: 1,
        explain: 'A launch template makes every instance identical and versioned.',
      },
      {
        prompt: 'scaling policy',
        options: [
          'manual capacity changes only',
          'target tracking on a load metric',
          'scale on instance age',
        ],
        correct: 1,
        explain:
          'Target tracking holds a metric (requests-per-target, CPU) near a set value like a thermostat.',
      },
      {
        prompt: 'AZ spread',
        options: ['one AZ', 'span 2–3 AZs', 'every AZ in every region'],
        correct: 1,
        explain: 'Spreading across AZs survives an AZ outage; an ASG is regional but AZ-aware.',
      },
      {
        prompt: 'health checks',
        options: ['EC2 status only', 'EC2 + ELB health checks', 'no health checks'],
        correct: 1,
        explain: 'ELB checks catch an app that is up but not serving; the ASG then replaces it.',
      },
      {
        prompt: 'rolling out a new template',
        options: [
          'terminate everything and relaunch',
          'instance refresh (rolling replace)',
          'never update the template',
        ],
        correct: 1,
        explain:
          'Instance refresh cycles the fleet gradually so capacity stays up during the change.',
      },
    ],
  },

  containers: {
    label: 'DEPLOY AN ECS SERVICE',
    blurb:
      'Run a containerised web app on Fargate. Choose the managed, least-effort option that still follows good practice.',
    resource: 'ECS SERVICE (FARGATE)',
    success:
      'A Fargate service from a lean task definition, image in ECR, secrets pulled at start, a desired count with service auto scaling, and tasks behind an ALB.',
    steps: [
      {
        prompt: 'launch type',
        options: ['an EC2 cluster you patch', 'Fargate', 'Lambda'],
        correct: 1,
        explain:
          'Fargate removes host management — you declare task size, AWS supplies the compute.',
      },
      {
        prompt: 'task definition',
        options: [
          'one giant container doing everything',
          'one concern per task, sidecars for logging/proxy',
          'no task definition',
        ],
        correct: 1,
        explain: 'Keep the main container focused; add sidecars for cross-cutting jobs.',
      },
      {
        prompt: 'image source',
        options: [
          'a public Docker Hub image, no auth',
          'a private ECR repository',
          'baked into an AMI',
        ],
        correct: 1,
        explain: 'ECR is the managed private registry ECS pulls from with an execution-role grant.',
      },
      {
        prompt: 'secrets',
        options: [
          'env vars in the task definition',
          'pull from Secrets Manager / SSM at task start',
          'bake them into the image',
        ],
        correct: 1,
        explain:
          'Reference the secret ARN so the value never sits in the task def or the image layers.',
      },
      {
        prompt: 'capacity',
        options: [
          'one task, no scaling',
          'a desired count plus service auto scaling',
          'always run the maximum tasks',
        ],
        correct: 1,
        explain:
          'Service auto scaling adjusts the task count on CloudWatch metrics, like an ASG for containers.',
      },
      {
        prompt: 'traffic',
        options: [
          'expose task IPs directly',
          'register tasks in an ALB target group',
          'no load balancer',
        ],
        correct: 1,
        explain: 'The ALB gives one stable address, health checks, and drains tasks on deploy.',
      },
    ],
  },

  /* ================= STORAGE SHORES ================= */

  s3: {
    label: 'PROVISION AN S3 BUCKET',
    blurb:
      'Set up a bucket for production web assets the way a review would expect. Deploy when every slot is right.',
    resource: 'S3 BUCKET',
    success:
      'A private, versioned, encrypted bucket fronted by CloudFront with Origin Access Control, and audit logging on — the standard pattern.',
    steps: [
      {
        prompt: 'bucket name',
        options: ['my-bucket', 'acme-app-prod-assets-use1', 'App Bucket 1'],
        correct: 1,
        explain:
          'Names are global DNS labels: lowercase, unique, and descriptive with env + region.',
      },
      {
        prompt: 'Block Public Access',
        options: ['off — bucket is public', 'on — all four settings', 'off for reads only'],
        correct: 1,
        explain: 'Keep BPA fully on; serve public content through CloudFront with OAC instead.',
      },
      {
        prompt: 'versioning',
        options: [
          'disabled',
          'enabled, plus a lifecycle rule to expire old versions',
          'enabled, keep every version forever',
        ],
        correct: 1,
        explain:
          'Versioning makes mistakes and ransomware recoverable; expiry keeps it from costing forever.',
      },
      {
        prompt: 'default encryption',
        options: ['none', 'SSE-S3 or SSE-KMS', 'undocumented client-side only'],
        correct: 1,
        explain:
          'Turn on default encryption so every object is encrypted at rest with no client effort.',
      },
      {
        prompt: 'public delivery path',
        options: [
          'the bucket website endpoint, public',
          'CloudFront + Origin Access Control',
          'a pre-signed URL for every asset',
        ],
        correct: 1,
        explain: 'CloudFront caches at the edge and lets you keep the bucket private via OAC.',
      },
      {
        prompt: 'audit',
        options: [
          'nothing',
          'access logging / CloudTrail data events on',
          'only in the dev account',
        ],
        correct: 1,
        explain: 'You want a record of who read or wrote what when something goes wrong.',
      },
    ],
  },

  ebs: {
    label: 'ATTACH AN EBS VOLUME',
    blurb: 'Give a database instance its disk. Pick the modern, durable option each time.',
    resource: 'EBS VOLUME',
    success:
      "A gp3 volume with tuned IOPS, encrypted by default, on an automated snapshot schedule, and detached from the instance's lifecycle.",
    steps: [
      {
        prompt: 'volume type',
        options: ['gp2', 'gp3', 'sc1 cold HDD'],
        correct: 1,
        explain:
          'gp3 is cheaper than gp2 and lets you set IOPS and throughput independently of size.',
      },
      {
        prompt: 'encryption',
        options: [
          'off',
          'on with KMS (and "encrypt by default" set account-wide)',
          'encrypt it later somehow',
        ],
        correct: 1,
        explain:
          "Encryption is transparent once enabled and can't be added to an existing volume in place.",
      },
      {
        prompt: 'backups',
        options: [
          'manual snapshots when you remember',
          'Data Lifecycle Manager / AWS Backup on a schedule',
          'none — EBS is durable enough',
        ],
        correct: 1,
        explain:
          'Automate snapshots and actually test a restore; AZ-local redundancy is not a backup.',
      },
      {
        prompt: 'DeleteOnTermination for this data volume',
        options: ['true', 'false', 'leave it unset'],
        correct: 1,
        explain:
          "You don't want the database disk destroyed just because the instance was replaced.",
      },
      {
        prompt: 'multi-AZ resilience',
        options: [
          'assume one volume is enough',
          'snapshot + rebuild in another AZ; design HA at the app tier',
          'attach it to instances in several AZs',
        ],
        correct: 1,
        explain:
          'A standard volume lives in one AZ and single-attaches; resilience is an application concern.',
      },
      {
        prompt: 'sizing',
        options: [
          'provision the max size now',
          'size for the workload and grow later with elastic volumes',
          'smallest possible, resize under fire',
        ],
        correct: 1,
        explain: 'You pay for provisioned GB, and you can grow (and change type) online later.',
      },
    ],
  },

  storageclasses: {
    label: 'WRITE A LIFECYCLE POLICY',
    blurb:
      'Age a bucket of logs and backups down the storage tiers. Match each stage to the access it still needs.',
    resource: 'S3 LIFECYCLE POLICY',
    success:
      'Hot in Standard, warm in IA, cold in Glacier, ancient in Deep Archive, old versions expired — the cheapest path that still meets each retrieval need.',
    steps: [
      {
        prompt: 'brand-new, frequently read objects',
        options: ['Glacier Deep Archive', 'S3 Standard', 'Standard-IA'],
        correct: 1,
        explain: 'Hot data with millisecond reads and no retrieval fee belongs in Standard.',
      },
      {
        prompt: 'after ~30 days untouched',
        options: ['delete them', 'transition to Standard-IA', 'keep them in Standard'],
        correct: 1,
        explain: 'Infrequent access: cheaper storage, small per-GB retrieval fee, 30-day minimum.',
      },
      {
        prompt: 'after ~90 days',
        options: [
          'stay in Standard',
          'Glacier (Instant or Flexible, per retrieval need)',
          'Deep Archive right away',
        ],
        correct: 1,
        explain:
          'Archive pricing; Instant keeps ms reads, Flexible is minutes-to-hours and cheaper.',
      },
      {
        prompt: 'after ~1 year, rarely needed',
        options: ['Standard-IA', 'Glacier Deep Archive', 'keep in Standard'],
        correct: 1,
        explain: 'Cheapest tier; retrieval takes hours, which is fine for compliance archives.',
      },
      {
        prompt: 'noncurrent (old) versions',
        options: ['keep them all forever', 'expire after N days', 'never enable versioning'],
        correct: 1,
        explain: 'Recoverable for a window, not a bill that grows without bound.',
      },
      {
        prompt: 'a bucket with an unpredictable access pattern',
        options: ['guess a fixed class', 'S3 Intelligent-Tiering', 'One Zone-IA'],
        correct: 1,
        explain: 'Intelligent-Tiering moves objects by observed access with no retrieval fees.',
      },
    ],
  },

  efs: {
    label: 'CREATE AN EFS FILE SYSTEM',
    blurb:
      'Provide a shared folder for a web fleet. Choose the option that fits a multi-AZ network file system.',
    resource: 'EFS FILE SYSTEM',
    success:
      'Mount targets in every AZ, elastic throughput, lifecycle to IA for cold files, encryption in transit and at rest, and Access Points for per-app isolation.',
    steps: [
      {
        prompt: 'workload it will hold',
        options: [
          'a write-heavy relational database',
          'shared assets / CMS uploads / CI caches across a fleet',
          'single-instance scratch space',
        ],
        correct: 1,
        explain:
          'EFS shines for genuinely shared, active files; its latency is wrong for a busy transactional DB.',
      },
      {
        prompt: 'mount targets',
        options: [
          'one, in a single AZ',
          'one per AZ in the VPC',
          'none — mount it over the internet',
        ],
        correct: 1,
        explain: 'A mount target per AZ gives clients a local ENI and keeps traffic in-AZ.',
      },
      {
        prompt: 'throughput mode',
        options: [
          'Provisioned, always',
          'Elastic (default, scales with load)',
          'Bursting, undersized',
        ],
        correct: 1,
        explain:
          'Elastic scales with demand; only pin Provisioned when you have a known steady high rate.',
      },
      {
        prompt: 'lifecycle management',
        options: ['off', 'on — move untouched files to IA', 'delete cold files'],
        correct: 1,
        explain: "IA is much cheaper per GB; lifecycle demotes files that haven't been read.",
      },
      {
        prompt: 'encryption / transport',
        options: [
          'plain NFS',
          'EFS mount helper with TLS + encryption at rest (KMS)',
          'transit only',
        ],
        correct: 1,
        explain: 'Encrypt both in flight and at rest; the mount helper handles TLS.',
      },
      {
        prompt: 'per-application isolation',
        options: [
          'a shared root with hand-managed permissions',
          'EFS Access Points (enforced POSIX user + root dir)',
          'a separate file system per file',
        ],
        correct: 1,
        explain:
          'Access Points give each app a locked-down entry point without bespoke permission juggling.',
      },
    ],
  },

  /* ================= NETWORK NEXUS ================= */

  vpc: {
    label: 'LAY OUT A VPC',
    blurb:
      'Carve a network for a three-tier app. Pick the option that keeps app and data tiers private.',
    resource: 'VPC',
    success:
      'A roomy CIDR, public + private subnets per AZ, NAT per AZ for outbound, gateway endpoints for S3/DynamoDB, and tight security groups.',
    steps: [
      {
        prompt: 'CIDR block',
        options: ['10.0.0.0/28 — 16 addresses', '10.0.0.0/16 — plan for growth', '0.0.0.0/0'],
        correct: 1,
        explain: "You can't renumber a VPC later; a /16 leaves room for many subnets.",
      },
      {
        prompt: 'subnet layout',
        options: [
          'one big public subnet',
          'public + private subnets, one pair per AZ',
          'private only, no public subnets',
        ],
        correct: 1,
        explain:
          'Public subnets carry only the load balancer and NAT; app and DB tiers stay private.',
      },
      {
        prompt: 'outbound internet for private subnets',
        options: ['a route to the Internet Gateway', 'a NAT Gateway per AZ', 'no outbound at all'],
        correct: 1,
        explain:
          "NAT gives outbound-only access; one per AZ so an AZ failure doesn't cut the others off.",
      },
      {
        prompt: 'reaching S3 and DynamoDB',
        options: ['through the NAT Gateway', 'gateway VPC endpoints', 'over the public internet'],
        correct: 1,
        explain: 'Gateway endpoints keep that traffic on the AWS network and off your NAT bill.',
      },
      {
        prompt: 'instance firewall rules',
        options: [
          'one wide-open security group',
          'least-privilege SGs that reference other SGs',
          'rely on NACLs only',
        ],
        correct: 1,
        explain: 'Referencing SGs (not IP ranges) lets rules scale with the fleet automatically.',
      },
      {
        prompt: 'public exposure',
        options: [
          'every subnet routes to the IGW',
          'only the LB / NAT subnets route to the IGW',
          'no Internet Gateway at all',
        ],
        correct: 1,
        explain:
          '"Public" is purely about the 0.0.0.0/0 → IGW route; grant it to as few subnets as possible.',
      },
    ],
  },

  elb: {
    label: 'STAND UP A LOAD BALANCER',
    blurb:
      'Put a front door on an HTTP microservice fleet. Choose the Layer-7 option and secure the listener.',
    resource: 'APPLICATION LOAD BALANCER',
    success:
      'An ALB across multiple AZs, HTTPS with an ACM cert and an HTTP→HTTPS redirect, health-checked target groups with slow start, and WAF in front.',
    steps: [
      {
        prompt: 'balancer type',
        options: ['Classic Load Balancer', 'Application Load Balancer', 'Network Load Balancer'],
        correct: 1,
        explain: 'HTTP routing by host / path / header is a Layer-7 job — the ALB.',
      },
      {
        prompt: 'listeners',
        options: [
          ':80 only',
          ':443 with an ACM cert, and :80 redirecting to :443',
          ':80 and :443 both serving plain HTTP',
        ],
        correct: 1,
        explain: 'Terminate TLS at the balancer and push every plain request up to HTTPS.',
      },
      {
        prompt: 'AZ coverage',
        options: ['a single AZ', 'two or more AZs', 'all AZs with cross-zone disabled'],
        correct: 1,
        explain: 'The balancer must span the AZs its targets live in to survive one failing.',
      },
      {
        prompt: 'targets',
        options: [
          'a hard-coded list of instance IPs',
          'a target group with health checks',
          'targets with no health check',
        ],
        correct: 1,
        explain: 'Health checks pull sick targets out of rotation until they recover.',
      },
      {
        prompt: 'a slow-starting app',
        options: [
          'send full traffic immediately',
          'health check + slow start to ramp traffic once healthy',
          'disable health checks so it is never marked down',
        ],
        correct: 1,
        explain:
          'Slow start eases load onto a freshly registered target instead of hitting it at full rate.',
      },
      {
        prompt: 'Layer-7 protection',
        options: ['none', 'AWS WAF in front + access logs to S3', 'a security group only'],
        correct: 1,
        explain: 'WAF adds L7 rules and rate limiting; access logs give you the request history.',
      },
    ],
  },

  route53: {
    label: 'CONFIGURE A HOSTED ZONE',
    blurb:
      'Point a domain at a multi-region app with failover. Choose the DNS option that actually works at the apex.',
    resource: 'ROUTE 53 HOSTED ZONE',
    success:
      'ALIAS records at the apex, latency-based routing with health checks, failover for DR, and short TTLs on anything you might need to swing.',
    steps: [
      {
        prompt: 'apex record (example.com) → CloudFront',
        options: ['a CNAME', 'an ALIAS A/AAAA record', 'an MX record'],
        correct: 1,
        explain:
          'CNAME is illegal at the zone apex; ALIAS resolves apex names to AWS targets and is free.',
      },
      {
        prompt: 'multi-region routing',
        options: [
          'simple (round-robin)',
          'latency-based or geoproximity',
          'weighted 50/50 forever',
        ],
        correct: 1,
        explain:
          'Latency-based sends each user to the region that measures fastest for their resolver.',
      },
      {
        prompt: 'active-passive DR',
        options: [
          'plain round-robin',
          'failover routing with a health check',
          'flip records by hand during an incident',
        ],
        correct: 1,
        explain:
          "Failover swaps to the secondary automatically when the primary's health check fails.",
      },
      {
        prompt: 'TTL on records you may fail over',
        options: ['86400 (a day)', '~60 seconds', '0'],
        correct: 1,
        explain:
          'A short TTL bounds how long resolvers keep serving the stale answer during a cutover.',
      },
      {
        prompt: 'health checks feed into',
        options: [
          'nothing — they only email you',
          'endpoint checks + CloudWatch alarms',
          'a monthly report',
        ],
        correct: 1,
        explain: 'Wire checks to alarms so DNS and your paging reflect reality automatically.',
      },
      {
        prompt: 'the domain registration / NS',
        options: [
          'registered elsewhere with NS left wrong',
          'NS records pointed at this zone (register at cost via Route 53 or delegate correctly)',
          'skip DNS delegation',
        ],
        correct: 1,
        explain: "If the parent NS records don't point here, none of your records resolve.",
      },
    ],
  },

  cloudfront: {
    label: 'CREATE A CLOUDFRONT DISTRIBUTION',
    blurb:
      'Put a CDN in front of a private S3 site. Choose the option that keeps the origin locked and the cache hot.',
    resource: 'CLOUDFRONT DISTRIBUTION',
    success:
      'A private S3 origin via OAC, HTTPS-only viewers, a minimal cache key, an ACM cert in us-east-1, content-hashed filenames, and WAF attached.',
    steps: [
      {
        prompt: 'origin',
        options: [
          'the public S3 website endpoint',
          'a private S3 bucket via Origin Access Control',
          'an EC2 public IP',
        ],
        correct: 1,
        explain: 'OAC lets only CloudFront read the bucket; Block Public Access stays on.',
      },
      {
        prompt: 'viewer protocol policy',
        options: ['allow HTTP', 'redirect HTTP to HTTPS', 'HTTP only'],
        correct: 1,
        explain: 'Send every viewer to HTTPS; TLS is terminated at the edge.',
      },
      {
        prompt: 'cache key',
        options: [
          'forward all headers, cookies and query strings',
          'a minimal key — only what actually varies the response',
          'disable caching',
        ],
        correct: 1,
        explain: 'A smaller cache key means more requests hit the same cached object.',
      },
      {
        prompt: 'TLS certificate',
        options: ["ACM in the origin's region", 'ACM in us-east-1', 'any region'],
        correct: 1,
        explain: 'CloudFront only reads certificates from us-east-1, whatever the origin region.',
      },
      {
        prompt: 'cache-busting on deploy',
        options: [
          'invalidate paths every release',
          'content-hashed filenames + long TTLs',
          'never cache HTML or assets',
        ],
        correct: 1,
        explain: 'Versioned filenames make new deploys a new URL — no invalidations to pay for.',
      },
      {
        prompt: 'security',
        options: ['nothing', 'AWS WAF + Shield Standard', 'an IP allow-list only'],
        correct: 1,
        explain:
          'WAF gives L7 rules and rate limiting; Shield Standard is automatic DDoS protection.',
      },
    ],
  },

  apigateway: {
    label: 'BUILD AN HTTP API',
    blurb:
      'Front a set of Lambda functions with an API. Choose the lean, secured option for each slot.',
    resource: 'API GATEWAY (HTTP API)',
    success:
      'An HTTP API with a JWT/Cognito authorizer on every route, per-key throttling, async handling for long jobs, separate stages, and logging + tracing on.',
    steps: [
      {
        prompt: 'API type',
        options: ['REST API', 'HTTP API', 'WebSocket API'],
        correct: 1,
        explain:
          "HTTP API is cheaper and faster with native JWT auth; you don't need REST's request models here.",
      },
      {
        prompt: 'authentication',
        options: [
          'open for now, add auth later',
          'a Cognito / JWT / Lambda authorizer on every route',
          'an API key with no authorizer',
        ],
        correct: 1,
        explain:
          'Every route gets real auth from day one; API keys are for metering, not identity.',
      },
      {
        prompt: 'throttling',
        options: [
          'unlimited',
          'stage + per-API-key rate and burst limits',
          'disabled so clients never see 429',
        ],
        correct: 1,
        explain: 'Usage plans stop one caller from starving the backend for everyone else.',
      },
      {
        prompt: 'a request that needs 90 seconds of work',
        options: [
          'raise the integration timeout',
          'return 202 and process async via a queue / Step Functions',
          'retry from the client until it fits',
        ],
        correct: 1,
        explain:
          'HTTP API integration timeout is a fixed 30 seconds; acknowledge the request and process long work asynchronously.',
      },
      {
        prompt: 'environments',
        options: ['one stage shared by dev and prod', 'separate dev and prod stages', 'no stages'],
        correct: 1,
        explain:
          'Stages are independent deployable snapshots with their own variables and throttles.',
      },
      {
        prompt: 'observability',
        options: [
          'off',
          'access + execution logs to CloudWatch, X-Ray tracing on',
          'logs in prod only',
        ],
        correct: 1,
        explain: 'You want the request log and a latency breakdown before something breaks.',
      },
    ],
  },

  /* ================= DATA DUNGEON ================= */

  rds: {
    label: 'PROVISION AN RDS DATABASE',
    blurb:
      'Run a managed SQL database for a production app. Choose the highly-available, secure option each time.',
    resource: 'RDS INSTANCE',
    success:
      'A managed engine, Multi-AZ for failover, read replicas for read load, credentials in Secrets Manager with rotation, automated backups, and RDS Proxy for pooling.',
    steps: [
      {
        prompt: 'how to run it',
        options: [
          'install the engine on EC2 yourself',
          'a managed RDS engine (Postgres / MySQL / ...)',
          'a spreadsheet',
        ],
        correct: 1,
        explain: 'RDS handles patching, backups and failover; you get an endpoint, not a shell.',
      },
      {
        prompt: 'availability',
        options: ['Single-AZ', 'Multi-AZ with a synchronous standby', 'two unrelated instances'],
        correct: 1,
        explain:
          'Multi-AZ fails over automatically in ~60–120s; it is about uptime, not read scaling.',
      },
      {
        prompt: 'scaling reads',
        options: [
          'just make the primary bigger',
          'add read replicas and send read traffic there',
          'point everything at the primary',
        ],
        correct: 1,
        explain: 'Replicas are async copies for read-heavy and reporting workloads.',
      },
      {
        prompt: 'credentials',
        options: [
          'in the app config file',
          'Secrets Manager with automatic rotation',
          'hard-coded in the image',
        ],
        correct: 1,
        explain: 'RDS has AWS-provided rotation Lambdas; the app fetches the secret at runtime.',
      },
      {
        prompt: 'backups',
        options: [
          'turned off',
          'automated backups with point-in-time recovery',
          'occasional manual dumps',
        ],
        correct: 1,
        explain:
          'Automated backups + transaction logs let you restore to any second in the window.',
      },
      {
        prompt: 'connection storms from Lambda / a big fleet',
        options: [
          'let every client open its own connection',
          'RDS Proxy to pool connections',
          'just raise max_connections',
        ],
        correct: 1,
        explain:
          'RDS Proxy multiplexes many short-lived clients onto a small pool of DB connections.',
      },
    ],
  },

  dynamodb: {
    label: 'DESIGN A DYNAMODB TABLE',
    blurb:
      'Model a table for a known access pattern. Choose the option that spreads load and scales.',
    resource: 'DYNAMODB TABLE',
    success:
      'A high-cardinality partition key, on-demand capacity to start, a GSI per extra query pattern, big blobs in S3, and Streams driving derived data.',
    steps: [
      {
        prompt: 'primary key',
        options: [
          'a low-cardinality value like status',
          'a high-cardinality partition key (+ a sort key)',
          'an auto-increment id only',
        ],
        correct: 1,
        explain:
          'The partition key is hashed to pick a partition; it must have many, evenly-used values.',
      },
      {
        prompt: 'capacity mode for a new, spiky workload',
        options: ['provisioned, fixed RCU/WCU', 'on-demand', 'provisioned with no auto scaling'],
        correct: 1,
        explain:
          'On-demand handles unknown, bursty traffic; switch to provisioned once the pattern is steady.',
      },
      {
        prompt: 'a second query pattern (by a non-key attribute)',
        options: ['Scan with a filter expression', 'a Global Secondary Index', 'larger reads'],
        correct: 1,
        explain:
          'A GSI gives an alternative key schema; Scans read (and bill for) the whole table.',
      },
      {
        prompt: 'a 2 MB attachment',
        options: [
          'store it in the item',
          'put it in S3, keep a pointer in the item',
          'split it across several items',
        ],
        correct: 1,
        explain: 'Items cap at 400 KB; large blobs live in S3 with a reference stored in DynamoDB.',
      },
      {
        prompt: 'change-driven side effects',
        options: ['poll the table on a timer', 'DynamoDB Streams → Lambda', 'a nightly Scan'],
        correct: 1,
        explain:
          'Streams are an ordered change feed for indexing, aggregates and event-driven work.',
      },
      {
        prompt: 'multi-region',
        options: ['copy data with a script', 'Global Tables', 'backups only'],
        correct: 1,
        explain: 'Global Tables replicate multi-region with active-active writes.',
      },
    ],
  },

  aurora: {
    label: 'BUILD AN AURORA CLUSTER',
    blurb:
      'Set up Aurora for an app with variable load and a DR requirement. Use the cluster the way it is designed.',
    resource: 'AURORA CLUSTER',
    success:
      'Writes on the cluster endpoint, reads on the reader endpoint, Serverless v2 for the spiky load, a Global Database for DR, and fast clones for test envs.',
    steps: [
      {
        prompt: 'how the app connects',
        options: [
          'one endpoint for everything',
          'the cluster endpoint for writes, the reader endpoint for reads',
          'hard-coded instance IPs',
        ],
        correct: 1,
        explain:
          'The reader endpoint load-balances across replicas; the cluster endpoint always points at the writer.',
      },
      {
        prompt: 'compute for spiky, unpredictable load',
        options: [
          'a large provisioned instance, always on',
          'Aurora Serverless v2',
          'one small fixed instance',
        ],
        correct: 1,
        explain:
          'Serverless v2 scales capacity in fine steps in-place, so it idles cheap and bursts without failover.',
      },
      {
        prompt: 'cross-region disaster recovery',
        options: ['a nightly logical dump', 'Aurora Global Database', 'nothing'],
        correct: 1,
        explain: 'Global Database replicates to another region with typically sub-second lag.',
      },
      {
        prompt: 'scaling read throughput',
        options: [
          'make the writer bigger',
          'add read replicas (they share the storage volume)',
          'restore snapshots to read from',
        ],
        correct: 1,
        explain: "Adding a replica doesn't copy data, so lag stays in the low milliseconds.",
      },
      {
        prompt: 'quick "oops" recovery and test environments',
        options: [
          'full restore from snapshot every time',
          'Backtrack (MySQL) / fast clones',
          'rebuild the data by hand',
        ],
        correct: 1,
        explain:
          'Fast clones branch the storage instantly; Backtrack rewinds the cluster in place.',
      },
      {
        prompt: 'credentials',
        options: [
          'plaintext in config',
          'Secrets Manager with managed rotation',
          'the same password everywhere',
        ],
        correct: 1,
        explain: 'Aurora is managed like RDS — no shell, secrets fetched at runtime and rotated.',
      },
    ],
  },

  elasticache: {
    label: 'STAND UP AN ELASTICACHE CLUSTER',
    blurb:
      'Add a cache in front of a database. Choose the engine and settings that survive a node failure.',
    resource: 'ELASTICACHE (REDIS)',
    success:
      'Redis with Multi-AZ automatic failover, cache-aside with TTLs and write invalidation, encryption on, and headroom above the working set.',
    steps: [
      {
        prompt: 'engine',
        options: [
          'Memcached (no replication or failover)',
          'Redis / Valkey (replication, failover, data types)',
          'neither',
        ],
        correct: 1,
        explain:
          'Redis gives you failover, persistence and structures like sorted sets; Memcached is a plain object cache.',
      },
      {
        prompt: 'caching pattern',
        options: [
          'treat the cache as the source of truth',
          'cache-aside with TTLs',
          'write-through with no expiry',
        ],
        correct: 1,
        explain:
          'On a miss, read the DB and populate the cache with a TTL; the DB stays authoritative.',
      },
      {
        prompt: 'production topology',
        options: [
          'a single node',
          'Multi-AZ with automatic failover',
          'two independent standalone nodes',
        ],
        correct: 1,
        explain: 'A primary + replica per shard with automatic promotion survives a node loss.',
      },
      {
        prompt: 'every cached key',
        options: [
          'no expiry',
          'a TTL, plus explicit invalidation on write',
          'infinite TTL with a manual purge job',
        ],
        correct: 1,
        explain:
          'TTLs bound staleness; invalidate on write for data that must be fresh immediately.',
      },
      {
        prompt: 'encryption',
        options: ['none', 'in-transit and at-rest', 'in-transit only'],
        correct: 1,
        explain: "Encrypt both for production; it's a checkbox on cluster creation.",
      },
      {
        prompt: 'sizing',
        options: [
          'exactly the working set',
          'working set + headroom, and watch eviction metrics',
          'the smallest node that boots',
        ],
        correct: 1,
        explain: 'No headroom means evictions and a thundering-herd of misses onto the database.',
      },
    ],
  },

  /* ================= SENTINEL KEEP ================= */

  iam: {
    label: 'CREATE AN IAM ROLE',
    blurb:
      'Give a workload permission to do its job and nothing else. Choose the least-privilege option each time.',
    resource: 'IAM ROLE',
    success:
      'A role (not a user) with a least-privilege policy tightened from an AWS-managed one, a narrow trust policy, humans federated via Identity Center, and an SCP guardrail.',
    steps: [
      {
        prompt: 'identity for the workload',
        options: [
          'a new IAM user with long-lived keys',
          'a role it assumes for temporary credentials',
          'the root account',
        ],
        correct: 1,
        explain:
          'Roles hand out short-lived STS credentials — nothing durable sits on the instance.',
      },
      {
        prompt: 'policy scope',
        options: [
          'Action "*" on Resource "*"',
          'least privilege — only the actions and resources it needs',
          'AdministratorAccess',
        ],
        correct: 1,
        explain:
          'Least privilege limits the blast radius if the workload or its creds are compromised.',
      },
      {
        prompt: 'where to start the policy',
        options: [
          'a blank policy you guess at',
          'an AWS managed policy, then tighten it',
          "copy a teammate's policy",
        ],
        correct: 1,
        explain:
          'Managed policies are a sane baseline; narrow them as the real access pattern emerges.',
      },
      {
        prompt: 'trust policy',
        options: [
          'anyone can assume the role',
          'only the intended service or account',
          'no trust policy',
        ],
        correct: 1,
        explain: 'The trust policy is who may assume the role; keep it as narrow as the use case.',
      },
      {
        prompt: 'human access to the account',
        options: [
          'an IAM user per person',
          'federate logins through IAM Identity Center',
          'one shared login',
        ],
        correct: 1,
        explain:
          'In a mature setup humans have no IAM users — they get role sessions from the IdP.',
      },
      {
        prompt: 'an org-wide "never" rule',
        options: [
          'hope nobody does it',
          'a Service Control Policy that denies it (e.g. disabling CloudTrail)',
          'a manual monthly review',
        ],
        correct: 1,
        explain: 'SCPs are a hard ceiling across every account in the organization.',
      },
    ],
  },

  kms: {
    label: 'CREATE A KMS KEY',
    blurb:
      'Set up a key to encrypt application data. Choose the option that keeps you in control without becoming a bottleneck.',
    resource: 'KMS KEY',
    success:
      'A customer-managed key with automatic annual rotation, a policy that separates admin from use, envelope encryption for bulk data, and a guarded deletion window.',
    steps: [
      {
        prompt: 'key type',
        options: [
          "an AWS-owned key you can't see or control",
          'a customer-managed key',
          'no key — store data in plaintext',
        ],
        correct: 1,
        explain:
          'A customer-managed key gives you the policy, rotation setting and audit boundary.',
      },
      {
        prompt: 'rotation',
        options: ['never rotate', 'automatic annual rotation', 'rotate manually every few years'],
        correct: 1,
        explain: 'Automatic yearly rotation is a one-click property of customer-managed keys.',
      },
      {
        prompt: 'key policy',
        options: [
          'one policy where admins are also users',
          'separate "can administer the key" from "can use the key"',
          'Allow "*"',
        ],
        correct: 1,
        explain: 'Splitting the two roles limits who can actually decrypt with the key.',
      },
      {
        prompt: 'encrypting large objects',
        options: [
          'call KMS Encrypt once per object',
          'envelope encryption via GenerateDataKey',
          'skip encryption for big files',
        ],
        correct: 1,
        explain:
          'KMS wraps a small data key; your app encrypts the bulk bytes locally, so KMS never bottlenecks.',
      },
      {
        prompt: 'encrypted data that must cross regions',
        options: [
          'copy it and hope',
          'multi-Region keys, or re-encrypt with a key in the target region',
          'keep everything single-region',
        ],
        correct: 1,
        explain:
          'A key is regional; a cross-region encrypted snapshot needs a key on the other side.',
      },
      {
        prompt: 'deleting a key',
        options: [
          'delete it immediately',
          'schedule deletion (7–30 day window) after confirming nothing uses it',
          'never check what it protects',
        ],
        correct: 1,
        explain: 'Deletion is irreversible — everything the key protected becomes unrecoverable.',
      },
    ],
  },

  secretsmanager: {
    label: 'STORE A SECRET',
    blurb:
      'Get a database password out of the codebase. Choose the option that keeps it encrypted, scoped and rotating.',
    resource: 'SECRETS MANAGER SECRET',
    success:
      'A KMS-encrypted secret fetched at runtime and cached briefly, automatic rotation on the DB credential, per-secret least-privilege access, and no hard-coded fallback.',
    steps: [
      {
        prompt: 'where the value lives',
        options: [
          'a committed .env file',
          'Secrets Manager, encrypted with KMS',
          'an env var in the Dockerfile',
        ],
        correct: 1,
        explain: 'The secret is encrypted at rest and only returned to allowed principals.',
      },
      {
        prompt: 'how the app gets it',
        options: [
          'baked into the container image',
          'GetSecretValue at runtime, cached in memory with a short TTL',
          'copied to disk during deploy',
        ],
        correct: 1,
        explain: 'Fetching at runtime keeps the value out of code, images and version control.',
      },
      {
        prompt: 'the database credential',
        options: [
          'static forever',
          'automatic rotation with the AWS-provided rotation function',
          'rotate it by hand once a year',
        ],
        correct: 1,
        explain:
          'Rotation stages a new value (AWSPENDING), tests it, then promotes it — no downtime.',
      },
      {
        prompt: 'access grants',
        options: [
          'one policy that reads all secrets',
          'per-secret least privilege, tags + ABAC at scale',
          'everyone can read everything',
        ],
        correct: 1,
        explain: 'Grant read on the specific secret ARN a workload needs, nothing more.',
      },
      {
        prompt: 'a multi-region app',
        options: [
          'a single-region secret everyone reaches across regions',
          'replica secrets in each region',
          'duplicate the value by hand',
        ],
        correct: 1,
        explain: 'Replica secrets give read-local copies and survive a regional outage.',
      },
      {
        prompt: 'a fallback value',
        options: [
          'a hard-coded one "just in case"',
          'none — fail closed if the secret is unavailable',
          'a second copy in an S3 object',
        ],
        correct: 1,
        explain: 'A hard-coded fallback defeats the entire point of storing the secret.',
      },
    ],
  },

  cognito: {
    label: 'BUILD A COGNITO USER POOL',
    blurb:
      'Add sign-up and sign-in to an app. Choose the component and settings that handle auth correctly.',
    resource: 'COGNITO USER POOL',
    success:
      'A User Pool issuing JWTs that the API verifies fully, Managed Login + federation for social/corporate login, short access tokens, MFA on, and an Identity Pool only where the client calls AWS directly.',
    steps: [
      {
        prompt: 'component for registration, login and tokens',
        options: ['an Identity Pool', 'a User Pool', 'an IAM role'],
        correct: 1,
        explain: 'User Pools are the user directory and issue ID / access / refresh tokens.',
      },
      {
        prompt: 'validating the token on each request',
        options: [
          'trust whatever the client sends',
          'verify the JWT signature, issuer, audience and expiry',
          "check only that it hasn't expired",
        ],
        correct: 1,
        explain: 'An unverified JWT is just a string; check every claim on every request.',
      },
      {
        prompt: 'social and corporate login',
        options: [
          'build password and OAuth flows yourself',
          'Managed Login + federation (Google, Apple, SAML/OIDC)',
          'passwords only',
        ],
        correct: 1,
        explain:
          'Federation and Managed Login (the successor to the classic hosted UI) save you from re-implementing auth screens.',
      },
      {
        prompt: 'access-token lifetime',
        options: ['30 days', 'short, renewed with the refresh token', 'never expires'],
        correct: 1,
        explain:
          'Short access tokens limit the damage from a leaked one; refresh tokens do the renewals.',
      },
      {
        prompt: 'the app needs to upload to S3 as the signed-in user',
        options: [
          'embed an IAM access key in the app',
          'exchange the User Pool token via an Identity Pool for temporary STS credentials',
          'make the bucket public',
        ],
        correct: 1,
        explain: 'Identity Pools vend scoped, temporary AWS credentials from a verified token.',
      },
      {
        prompt: 'MFA',
        options: ['off', 'on (at least optional TOTP / SMS)', 'an email magic link only'],
        correct: 1,
        explain: 'A second factor is table stakes for account security.',
      },
    ],
  },

  /* ================= ORACLE TOWER ================= */

  cloudwatch: {
    label: 'SET UP MONITORING',
    blurb:
      'Instrument a production service. Choose what to alarm on and how to keep the signal clean.',
    resource: 'CLOUDWATCH MONITORING',
    success:
      'Alarms on user-facing symptoms, deliberate log retention, composite alarms to kill flapping, structured logs, and alarm actions wired to a pager and a runbook.',
    steps: [
      {
        prompt: 'primary alarms',
        options: [
          'instance CPU only',
          'user-facing symptoms — latency, error rate, queue age',
          'disk inode counts',
        ],
        correct: 1,
        explain: 'Alarm on what users feel; resource metrics are secondary diagnostics.',
      },
      {
        prompt: 'log-group retention',
        options: [
          'never expire',
          'a deliberate retention period per group',
          'one day for everything',
        ],
        correct: 1,
        explain: '"Never expire" quietly becomes a large bill; pick a period on purpose.',
      },
      {
        prompt: 'controlling alarm noise',
        options: [
          'fire on every single datapoint',
          '"datapoints to alarm" + composite alarms',
          'no alarms so nothing is noisy',
        ],
        correct: 1,
        explain: 'Requiring N breaching datapoints and combining conditions suppresses flapping.',
      },
      {
        prompt: 'application telemetry',
        options: [
          'unstructured print statements',
          'structured logs / Embedded Metric Format',
          'no logs',
        ],
        correct: 1,
        explain: 'Structured logs let metrics and logs correlate and be queried in Logs Insights.',
      },
      {
        prompt: 'what an alarm does',
        options: [
          'emails one person',
          'publishes to SNS → pager / Auto Scaling / runbook',
          'nothing',
        ],
        correct: 1,
        explain: 'An alarm should trigger an action and point at the runbook, not just notify.',
      },
      {
        prompt: 'custom metric dimensions',
        options: [
          'a dimension per user',
          'bounded, low-cardinality dimensions',
          'turn every field into a dimension',
        ],
        correct: 1,
        explain: 'High-cardinality dimensions multiply into a huge per-metric bill.',
      },
    ],
  },

  cloudtrail: {
    label: 'CONFIGURE AN AUDIT TRAIL',
    blurb:
      'Make sure you can answer "who did that?" months later. Choose the tamper-evident, org-wide option.',
    resource: 'CLOUDTRAIL TRAIL',
    success:
      'One org-wide multi-region trail to a locked-down bucket in a separate security account, integrity validation on, data events only where they matter, and key events alarmed.',
    steps: [
      {
        prompt: 'trail scope',
        options: [
          'a single region',
          'org-wide and multi-region',
          'rely on the 90-day Event history',
        ],
        correct: 1,
        explain:
          'Event history is management-only and 90 days; a trail gives long-term, queryable storage.',
      },
      {
        prompt: 'log destination',
        options: [
          'the same account, in an open bucket',
          'a locked-down bucket in a separate security account',
          'no delivery configured',
        ],
        correct: 1,
        explain:
          'Isolating the logs from the accounts they audit protects them from a compromised admin.',
      },
      {
        prompt: 'log file integrity validation',
        options: ['off', 'on', 'just trust the bucket'],
        correct: 1,
        explain: "Signed digest files let you prove logs weren't altered or deleted.",
      },
      {
        prompt: 'data events',
        options: [
          'on for every bucket and function account-wide',
          'only for sensitive buckets and functions',
          'never',
        ],
        correct: 1,
        explain: 'Account-wide data events are high-volume and costly; scope them to what matters.',
      },
      {
        prompt: 'real-time response to key events',
        options: [
          'read the logs weekly',
          'CloudWatch metric filters / EventBridge → alarms',
          'nothing',
        ],
        correct: 1,
        explain:
          'Alarm on root login, IAM changes, "CloudTrail stopped" — CloudTrail itself is not prevention.',
      },
      {
        prompt: 'access to the log bucket',
        options: ['anyone in the org', 'restricted and monitored', 'public read'],
        correct: 1,
        explain: 'The audit log is a target; lock it down and watch who touches it.',
      },
    ],
  },

  sqs: {
    label: 'CREATE AN SQS QUEUE',
    blurb:
      'Put a queue between a producer and a fragile consumer. Choose the option that absorbs spikes and isolates failures.',
    resource: 'SQS QUEUE',
    success:
      'A Standard queue with idempotent consumers, a visibility timeout ~6× the handler, a dead-letter queue with a depth alarm, long polling, and S3 for big payloads.',
    steps: [
      {
        prompt: 'queue type (high throughput, strict order not required)',
        options: ['FIFO', 'Standard', 'neither'],
        correct: 1,
        explain:
          "Standard gives near-unlimited throughput; only pay FIFO's throughput cost when order truly matters.",
      },
      {
        prompt: 'consumer processing',
        options: [
          'assume exactly-once delivery',
          'be idempotent — assume at-least-once',
          'no deduplication',
        ],
        correct: 1,
        explain: 'Standard queues can deliver a message more than once; dedupe on a business key.',
      },
      {
        prompt: 'visibility timeout',
        options: ['leave the 30s default', "about 6× the handler's processing time", '0'],
        correct: 1,
        explain: 'Too short and a slow message gets picked up twice while still being worked.',
      },
      {
        prompt: 'messages that keep failing',
        options: [
          'let them loop through the queue forever',
          'a dead-letter queue + an alarm on its depth',
          'delete them on the first failure',
        ],
        correct: 1,
        explain:
          'The DLQ isolates poison messages after maxReceiveCount so they stop blocking real work.',
      },
      {
        prompt: 'receiving messages',
        options: ['short polling', 'long polling (WaitTimeSeconds up to 20)', 'a tight busy loop'],
        correct: 1,
        explain: 'Long polling cuts empty receives, lowering cost and latency.',
      },
      {
        prompt: 'a 5 MB payload',
        options: [
          'send it as the message body',
          'put it in S3 and send a pointer (Extended Client)',
          'split it into arbitrary chunks',
        ],
        correct: 1,
        explain:
          'The native SQS payload cap is 1 MiB; larger payloads need S3 plus the SQS Extended Client.',
      },
    ],
  },

  sns: {
    label: 'CREATE AN SNS TOPIC',
    blurb:
      'Fan one event out to several independent consumers. Choose the option that buffers and filters cleanly.',
    resource: 'SNS TOPIC',
    success:
      'A topic fanning out to per-consumer SQS queues with filter policies and subscription DLQs — add a consumer by adding a subscription, never by touching the publisher.',
    steps: [
      {
        prompt: 'delivery model',
        options: [
          'one consumer wins each message',
          'publish once, every subscriber gets a copy',
          'a nightly batch export',
        ],
        correct: 1,
        explain: 'SNS is pub/sub fan-out; SQS is the pull-based, one-consumer model.',
      },
      {
        prompt: 'durable per-consumer processing',
        options: [
          'SNS → Lambda directly',
          'SNS → SQS fan-out, one queue per consumer',
          'SNS → email',
        ],
        correct: 1,
        explain: 'A queue per consumer adds buffering, retries and replay that SNS→Lambda lacks.',
      },
      {
        prompt: 'undeliverable messages',
        options: [
          'let them drop',
          'a subscription dead-letter queue (redrive policy)',
          'retry forever',
        ],
        correct: 1,
        explain: "Every subscription should have a DLQ for messages it can't deliver.",
      },
      {
        prompt: 'consumers that only want a subset',
        options: [
          'many near-duplicate topics',
          'one topic with per-subscription filter policies',
          'send everything to everyone',
        ],
        correct: 1,
        explain: 'Filter policies match message attributes so each consumer opts into its slice.',
      },
      {
        prompt: 'strict ordering across the fan-out',
        options: [
          'a Standard topic',
          'a FIFO topic + FIFO queues with matching group IDs',
          'not possible',
        ],
        correct: 1,
        explain: 'FIFO end to end preserves order per message group.',
      },
      {
        prompt: 'message size',
        options: ['up to 1 MB', '≤ 256 KB (S3 pointer for anything larger)', 'unlimited'],
        correct: 1,
        explain: 'SNS remains capped at 256 KB; SQS now has a separate 1 MiB native limit.',
      },
    ],
  },

  cloudformation: {
    label: 'WRITE A CLOUDFORMATION STACK',
    blurb:
      'Define infrastructure as code for a review-able, reproducible deploy. Choose the disciplined option each time.',
    resource: 'CLOUDFORMATION STACK',
    success:
      'Templates in git deployed through CI, change sets reviewed before prod, stacks split by blast radius, parameters for reuse, and DeletionPolicy protecting stateful resources.',
    steps: [
      {
        prompt: 'source of truth',
        options: [
          'clicking through the console',
          'a template in version control, deployed via CI',
          'a screenshot of the config',
        ],
        correct: 1,
        explain: 'A committed template is reviewable, diffable and reproducible.',
      },
      {
        prompt: 'before a production update',
        options: [
          'apply it directly',
          'review a change set (watch for "Replacement: True")',
          'disable rollback and hope',
        ],
        correct: 1,
        explain:
          'A change set is a dry run that shows exactly what will be added, changed or replaced.',
      },
      {
        prompt: 'structure',
        options: [
          'one 3,000-line template',
          'split by lifecycle / blast radius (network, data, app) with exported outputs',
          'one stack per single resource',
        ],
        correct: 1,
        explain: 'Separate stacks limit the blast radius of a bad change.',
      },
      {
        prompt: 'reuse across environments',
        options: [
          'copy the template and edit values',
          'parameters, mappings and conditions',
          'hard-code prod values',
        ],
        correct: 1,
        explain: 'Parameterised templates deploy to dev / staging / prod unchanged.',
      },
      {
        prompt: 'stateful resources when the stack is deleted',
        options: [
          'default behaviour (they get deleted)',
          'DeletionPolicy: Retain or Snapshot',
          'turn deletion protection off',
        ],
        correct: 1,
        explain: 'Otherwise "delete stack" can take your database with it.',
      },
      {
        prompt: 'drift from manual console edits',
        options: [
          'ignore it',
          'run drift detection and reconcile via the template',
          'keep editing in the console to fix it',
        ],
        correct: 1,
        explain:
          'Out-of-band changes make the stack lie; detect and pull reality back to the template.',
      },
    ],
  },

  eventbridge: {
    label: 'WIRE AN EVENT BUS + RULE',
    blurb:
      'Route domain events to their consumers without coupling the producer. Choose the scoped, resilient option.',
    resource: 'EVENTBRIDGE BUS + RULE',
    success:
      'A custom bus per domain, patterns as specific as the use case, target DLQs, SQS in front of brittle consumers, EventBridge Scheduler for cron, and idempotent targets.',
    steps: [
      {
        prompt: 'which bus',
        options: [
          'the default bus for everything',
          'a custom bus per domain / bounded context',
          'no bus',
        ],
        correct: 1,
        explain: 'A custom bus keeps rules and permissions scoped to one area.',
      },
      {
        prompt: "the rule's event pattern",
        options: [
          'match {} (everything)',
          'as specific as the use case needs',
          'match on source only even when you filter on detail',
        ],
        correct: 1,
        explain: "An over-broad pattern invokes targets — and costs — you didn't intend.",
      },
      {
        prompt: 'target delivery failures',
        options: [
          'let them drop',
          'a target dead-letter queue + a depth alarm',
          'retry inside the producer',
        ],
        correct: 1,
        explain: 'Attach a DLQ to every target so nothing is lost silently.',
      },
      {
        prompt: 'a brittle downstream consumer',
        options: [
          'EventBridge → the consumer directly',
          'EventBridge → SQS → the consumer',
          'no queue in between',
        ],
        correct: 1,
        explain: 'A queue adds buffering and replay while the consumer is down.',
      },
      {
        prompt: 'scheduled jobs',
        options: [
          'a Lambda that loops on a timer',
          'EventBridge Scheduler',
          'crontab on an EC2 box',
        ],
        correct: 1,
        explain:
          'Scheduler runs cron / rate schedules at scale — the successor to scheduled CloudWatch rules.',
      },
      {
        prompt: 'target processing semantics',
        options: [
          'assume exactly-once and in-order',
          'idempotent — at-least-once and unordered',
          'synchronous acknowledgement',
        ],
        correct: 1,
        explain: 'EventBridge can deliver an event more than once and out of order.',
      },
    ],
  },

  stepfunctions: {
    label: 'DEFINE A STATE MACHINE',
    blurb:
      'Orchestrate a multi-step job as a managed workflow. Choose the option that pushes glue code into configuration.',
    resource: 'STEP FUNCTIONS STATE MACHINE',
    success:
      'A Standard workflow with declarative Retry/Catch, explicit compensation on failure, direct service integrations, S3 pointers for big payloads, and a Map state for fan-out.',
    steps: [
      {
        prompt: 'workflow type for an auditable, long-running process',
        options: ['Express', 'Standard', 'neither'],
        correct: 1,
        explain:
          'Standard is durable and exactly-once and can run for up to a year; execution history remains queryable for 90 days after completion. Express is for high-volume short jobs.',
      },
      {
        prompt: 'retries and timeouts',
        options: [
          'hand-written in each Lambda',
          'declarative Retry / Catch on each state',
          'an SQS redrive policy',
        ],
        correct: 1,
        explain: 'The state machine owns failure handling so the functions stay small.',
      },
      {
        prompt: 'the failure paths',
        options: [
          'model only the happy path',
          'explicit Catch → compensation states',
          'let the whole execution fail',
        ],
        correct: 1,
        explain: 'The unhappy path is half the design — route failures to states that undo work.',
      },
      {
        prompt: 'a step that just calls DynamoDB',
        options: [
          'a Lambda that forwards the call',
          'a direct DynamoDB service integration',
          'skip it',
        ],
        correct: 1,
        explain:
          'Step Functions can call 220+ AWS services and thousands of API actions directly; a passthrough Lambda is pure overhead.',
      },
      {
        prompt: 'a large payload passed between states',
        options: [
          'inline the data (it might fit in 256 KB)',
          'pass an S3 pointer',
          'base64-encode it into the state',
        ],
        correct: 1,
        explain: 'State input/output caps at 256 KB — pass a reference, not the bytes.',
      },
      {
        prompt: 'processing every item in a collection',
        options: ['loop inside one Lambda', 'a Map state', 'hand-written parallel branches'],
        correct: 1,
        explain: 'Map fans out over the collection (distributed Map for massive scale).',
      },
    ],
  },
};
