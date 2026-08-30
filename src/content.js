/* =========================================================================
   AWS QUEST  --  learning content
   -------------------------------------------------------------------------
   All game knowledge lives here so new concepts are easy to add.

   WORLDS[]      ordered regions on the overworld map
   CONCEPTS{}    keyed concept records, referenced by WORLDS[i].concepts[]

   Concept schema
   --------------
   id         short slug (matches key)
   world      parent world id
   name       display name
   sub        expansion / tagline
   icon       emoji used as the map sprite
   briefing[] mentor dialogue lines shown in the RPG text box
   metaphor   one-line "think of it like..." hook
   points[]   the core facts (the "concept card")
   deep       { works[], diagram, practice[], gotchas[], pricing, cli }
   sim        { game, label, blurb }  -- optional; game = key in
              window.AWSQUEST_MINIGAMES (see src/minigames.js). Adds a
              playable "do the mechanic" stage to the concept card.
   build      -- a "provision it yourself" task. Kept out of this file in
              src/builds.js (window.AWSQUEST_BUILDS, keyed by concept id) so
              every concept has one; an inline `build` here would override it.
   quiz[]     { q, choices[], answer (index), why }
   badge      { name, emoji } awarded on completion
   ========================================================================= */

const WORLDS = [
  { id: 'compute',  name: 'COMPUTE COVE',   tint: '#ff9f43', blurb: 'Raw processing power washes ashore.' },
  { id: 'storage',  name: 'STORAGE SHORES', tint: '#4db8ff', blurb: 'Endless vaults for your bytes.' },
  { id: 'network',  name: 'NETWORK NEXUS',  tint: '#37e660', blurb: 'Wire the world together.' },
  { id: 'data',     name: 'DATA DUNGEON',   tint: '#b06fff', blurb: 'Tables, keys and queries lurk below.' },
  { id: 'security', name: 'SENTINEL KEEP',  tint: '#ffd93d', blurb: 'Guard the gates. Trust no one.' },
  { id: 'ops',      name: 'ORACLE TOWER',   tint: '#ff6b9d', blurb: 'See all. Automate all.' },
];

const CONCEPTS = {

  /* ================= COMPUTE COVE ================= */

  ec2: {
    id: 'ec2', world: 'compute', name: 'AMAZON EC2', sub: 'Elastic Compute Cloud', icon: '🖥️',
    briefing: [
      "Welcome, recruit. I am CIRRUS, your cloud guide.",
      "EC2 rents you virtual servers by the second.",
      "Pick a size, pick an image, press start -- a machine boots in the cloud.",
      "It is the oldest building block. Master it and the rest makes sense.",
    ],
    metaphor: "Like renting a PC in a giant warehouse instead of buying one for your closet.",
    points: [
      "An EC2 instance is a virtual machine running on AWS hardware in one Availability Zone.",
      "You choose an INSTANCE TYPE (family + size, e.g. m7i.large) for CPU / RAM / network balance.",
      "An AMI (Amazon Machine Image) is the disk template it boots from.",
      "SECURITY GROUPS act as a stateful virtual firewall around the instance.",
      "USER DATA is a script that runs once on first boot to configure the box.",
    ],
    deep: {
      works: [
        "AWS runs a hypervisor (Nitro) on physical hosts. Your instance is a slice of that host with dedicated vCPUs, memory and Nitro-backed networking and storage.",
        "Root disk is usually an EBS volume (network block storage) so the instance can stop/start and keep its data. Instance-store disks are physically attached but vanish on stop.",
        "Instances live in a subnet of your VPC and get a private IP; a public IP or Elastic IP is optional for inbound internet access.",
      ],
      diagram:
        "  Region (us-east-1)\n" +
        "  +-------------------------------------+\n" +
        "  |  AZ us-east-1a      AZ us-east-1b   |\n" +
        "  |  [ EC2 m7i.large ]  [ EC2 ...    ]  |\n" +
        "  |     | EBS gp3          | EBS gp3    |\n" +
        "  |     +--- Security Group (firewall) |\n" +
        "  +-------------------------------------+",
      practice: [
        "Bake golden AMIs (or use user-data + config mgmt) so instances are disposable, not pets.",
        "Put instances behind a load balancer in 2+ AZs and let an Auto Scaling group replace failures.",
        "Use IAM roles on the instance (instance profile) instead of copying access keys onto disk.",
        "Reach shells with SSM Session Manager -- no open port 22, full audit log.",
      ],
      gotchas: [
        "Stopping an instance releases its auto-assigned public IP; use an Elastic IP if it must be stable.",
        "Right-sizing matters -- most bills are wasted on idle oversized instances.",
        "An instance is tied to one AZ; AZ outage = design for it, don't hope against it.",
      ],
      pricing:
        "On-Demand = per-second, no commitment. Savings Plans / Reserved = up to ~72% off for a 1-3 yr commit. " +
        "Spot = spare capacity up to ~90% off but can be reclaimed with a 2-minute warning.",
      cli: "aws ec2 run-instances --image-id ami-0abcd1234 --instance-type t3.micro \\\n  --key-name my-key --security-group-ids sg-0123 --subnet-id subnet-0123",
    },
    quiz: [
      { q: "What does a Security Group do for an EC2 instance?",
        choices: ["Encrypts the root volume", "Acts as a stateful virtual firewall", "Backs up the instance nightly", "Assigns the instance type"],
        answer: 1, why: "Security Groups filter inbound/outbound traffic and are stateful -- return traffic is auto-allowed." },
      { q: "You stop and later start an instance. What is most likely to change?",
        choices: ["Its private IP", "Its auto-assigned public IP", "Its AMI", "Its attached EBS data"],
        answer: 1, why: "Auto-assigned public IPs are released on stop. Private IP and EBS data persist." },
      { q: "Which purchase option can be reclaimed by AWS with a 2-minute notice?",
        choices: ["On-Demand", "Reserved Instance", "Spot Instance", "Dedicated Host"],
        answer: 2, why: "Spot uses spare capacity cheaply but AWS can interrupt it when it needs the hardware back." },
    ],
    badge: { name: 'COMPUTE CADET', emoji: '⚙️' },
  },

  lambda: {
    id: 'lambda', world: 'compute', name: 'AWS LAMBDA', sub: 'Serverless functions', icon: '⚡',
    briefing: [
      "Sometimes you don't want a server at all -- just your code, on demand.",
      "Lambda runs a function when an event fires, then bills you for the milliseconds it ran.",
      "No patching, no capacity planning. It scales from zero to thousands automatically.",
      "The trade: short-lived, stateless, and you live inside its limits.",
    ],
    metaphor: "A vending machine for code: insert an event, get a result, walk away.",
    points: [
      "You upload a function (zip or container image); AWS runs it in a managed micro-VM (Firecracker).",
      "Triggered by events: API Gateway, S3, SQS, EventBridge, DynamoDB Streams, and many more.",
      "Max run time is 15 minutes; memory 128 MB - 10 GB, and CPU scales with the memory you pick.",
      "Each concurrent event gets its own isolated execution environment -- that is how it scales.",
      "Stateless: persist anything you need in S3, DynamoDB, etc. Local /tmp is scratch only.",
    ],
    deep: {
      works: [
        "On the first call in an environment, Lambda downloads your code, starts a runtime and runs your init code -- that latency is the 'cold start'. The warm environment is then reused for later calls.",
        "Concurrency = number of environments running at once. Default soft limit is 1,000 per account per region; you can reserve or provision concurrency for hot paths.",
        "Async sources (S3, SNS, EventBridge) queue internally and retry on failure; poll sources (SQS, Kafka) are read by the Lambda service in batches.",
      ],
      diagram:
        "  S3 upload ---\\\n" +
        "  API Gateway --+--> [ Lambda fn ] --> DynamoDB\n" +
        "  EventBridge --/        |\n" +
        "                     CloudWatch Logs\n" +
        "  scale: 1 event = 1 env, N events = N envs (auto)",
      practice: [
        "Keep the deployment package small and move heavy init above the handler so warm calls skip it.",
        "Set a sensible timeout and a Dead-Letter Queue / on-failure destination for async work.",
        "Give each function its own least-privilege IAM execution role.",
        "For steady high volume, do the math -- containers/EC2 can be cheaper than always-on Lambda.",
      ],
      gotchas: [
        "Buffered synchronous requests/responses have a 6 MB payload cap; supported REST API integrations can opt into response streaming for larger incremental responses.",
        "VPC-attached Lambdas need a NAT path or VPC endpoints to reach AWS APIs / the internet.",
        "Retries can double-invoke your function -- make handlers idempotent.",
      ],
      pricing:
        "Pay per request (~$0.20 per million) plus GB-seconds of compute. Large perpetual free tier " +
        "(1M requests + 400,000 GB-s per month). Idle costs nothing.",
      cli: "aws lambda invoke --function-name my-fn --payload '{\"key\":\"value\"}' out.json",
    },
    quiz: [
      { q: "What is a Lambda 'cold start'?",
        choices: ["Running in a cold AWS region", "First-call latency to set up a new execution environment", "A function that timed out", "A scheduled nightly run"],
        answer: 1, why: "A new environment must download code and run init before your handler; reused warm environments skip that." },
      { q: "Maximum time a single Lambda invocation can run?",
        choices: ["30 seconds", "5 minutes", "15 minutes", "1 hour"],
        answer: 2, why: "Hard limit is 900 seconds (15 minutes). Longer work belongs in Step Functions / ECS / Batch." },
      { q: "Where should a Lambda keep data it needs on the next invocation?",
        choices: ["In /tmp", "In a global variable", "In an external store like DynamoDB or S3", "In the deployment zip"],
        answer: 2, why: "Environments are ephemeral and not shared, so durable state must live outside the function." },
    ],
    badge: { name: 'SERVERLESS SPARK', emoji: '⚡' },
  },

  autoscaling: {
    id: 'autoscaling', world: 'compute', name: 'EC2 AUTO SCALING', sub: 'Capacity that follows demand', icon: '📈',
    briefing: [
      "Traffic is never flat. Mornings spike, nights fall quiet.",
      "An Auto Scaling group keeps a fleet of EC2 instances at the right size for right now.",
      "It also replaces instances that fail their health check -- self-healing capacity.",
      "You set the rules; it does the launching and terminating.",
    ],
    metaphor: "A thermostat for servers: set the target, it adds or removes heat.",
    points: [
      "An Auto Scaling Group (ASG) has MIN, DESIRED and MAX instance counts.",
      "A LAUNCH TEMPLATE defines what each new instance looks like (AMI, type, security groups, user data).",
      "SCALING POLICIES adjust desired capacity: target tracking, step, scheduled, or predictive.",
      "The ASG spreads instances across multiple AZs and integrates with load balancer target groups.",
      "Failed health checks (EC2 or ELB) cause the ASG to terminate and replace the instance.",
    ],
    deep: {
      works: [
        "Target tracking is the common choice: pick a metric (e.g. average CPU 50%, or ALB requests-per-target) and the ASG adds/removes instances to hold that number, like cruise control.",
        "Scheduled actions handle known patterns (scale up at 08:00 weekdays). Predictive scaling uses ML on history to pre-provision before a forecast spike.",
        "Lifecycle hooks pause an instance in 'pending' or 'terminating' so you can warm caches or drain connections before it serves or dies.",
      ],
      diagram:
        "        CloudWatch metric (CPU / RPS)\n" +
        "                 |  crosses target\n" +
        "                 v\n" +
        "  [ Auto Scaling Group ]  min1 / desired3 / max10\n" +
        "     |        |        |\n" +
        "   AZ-a     AZ-b     AZ-c   <-- spread, behind an ALB",
      practice: [
        "Scale on a load metric that tracks user demand (requests per target) rather than CPU alone.",
        "Keep min >= 2 across 2 AZs so a single failure never drops you to zero.",
        "Use instance refresh to roll out a new launch template version safely.",
        "Enable termination protection for scale-in on stateful nodes, or move state off the instance.",
      ],
      gotchas: [
        "Scaling out is not instant -- boot + app warmup can be minutes; pre-scale for sharp spikes.",
        "Aggressive policies cause 'flapping'; tune cooldowns / step sizes.",
        "The ASG can only replace an instance, not fix bad app code that fails health checks in a loop.",
      ],
      pricing: "The ASG feature is free. You pay only for the EC2 instances (and EBS/ELB) it runs.",
      cli: "aws autoscaling put-scaling-policy --auto-scaling-group-name web-asg \\\n  --policy-name cpu50 --policy-type TargetTrackingScaling \\\n  --target-tracking-configuration '{\"PredefinedMetricSpecification\":{\"PredefinedMetricType\":\"ASGAverageCPUUtilization\"},\"TargetValue\":50.0}'",
    },
    quiz: [
      { q: "Which three numbers define an Auto Scaling group's size?",
        choices: ["Small, medium, large", "Min, desired, max", "CPU, memory, disk", "Dev, staging, prod"],
        answer: 1, why: "The ASG keeps 'desired' running, never below min or above max." },
      { q: "What does target tracking scaling do?",
        choices: ["Runs instances only on a schedule", "Holds a chosen metric near a set value by adding/removing instances", "Tracks the cost target", "Pins instances to one AZ"],
        answer: 1, why: "Like a thermostat -- e.g. keep average CPU at 50% by changing capacity." },
      { q: "An instance fails its ELB health check. The ASG will...",
        choices: ["Email you and wait", "Terminate it and launch a replacement", "Reboot the load balancer", "Reduce the max size"],
        answer: 1, why: "Auto Scaling self-heals by replacing unhealthy instances." },
    ],
    badge: { name: 'ELASTIC ENGINEER', emoji: '📈' },
    sim: {
      game: 'autoscale',
      label: 'RUN THE SCALER',
      blurb: 'A live demand curve is coming. Keep capacity just above it -- not on the floor, not a giant idle fleet -- by hand, then let target tracking do it.',
    },
  },

  containers: {
    id: 'containers', world: 'compute', name: 'ECS + FARGATE', sub: 'Run containers, not servers', icon: '📦',
    briefing: [
      "Containers package your app with its dependencies so it runs the same everywhere.",
      "ECS is AWS's orchestrator -- it schedules containers, keeps them running, wires up networking.",
      "FARGATE is the serverless engine underneath: no EC2 hosts for you to patch or scale.",
      "Prefer Kubernetes? EKS is the managed-K8s door down the hall.",
    ],
    metaphor: "A shipping yard: standard boxes (containers), a crane operator (ECS) placing them on ships (compute).",
    points: [
      "A TASK DEFINITION is the blueprint: image, CPU/memory, ports, env vars, IAM role, log config.",
      "A TASK is a running instance of that blueprint; a SERVICE keeps N tasks running and replaces failures.",
      "Launch type EC2 = you manage a cluster of instances. FARGATE = AWS runs the compute per task.",
      "ECR (Elastic Container Registry) stores your private Docker images.",
      "Tasks get their own elastic network interface and can sit behind an ALB target group.",
    ],
    deep: {
      works: [
        "You push an image to ECR, register a task definition referencing it, then create a Service with a desired count and (optionally) an ALB. ECS places tasks, registers them with the load balancer and restarts any that exit.",
        "With Fargate you only declare CPU/memory sizes (e.g. 0.5 vCPU / 1 GB); AWS finds capacity, runs the task in an isolated micro-VM and bills per second.",
        "Service Auto Scaling adjusts the task count on CloudWatch metrics, the same idea as EC2 Auto Scaling but for containers.",
      ],
      diagram:
        "  ECR image  -->  Task Definition  -->  ECS Service (desired=4)\n" +
        "                                          |    |    |    |\n" +
        "                                        task task task task   (Fargate micro-VMs)\n" +
        "                                          \\___ ALB target group ___/",
      practice: [
        "Start with Fargate; move to EC2 launch type only when you need GPUs, huge scale economics, or special kernels.",
        "One container concern per task definition; use sidecars for logging/proxy.",
        "Pull secrets from Secrets Manager / SSM at task start, don't bake them into the image.",
        "Ship logs to CloudWatch with the awslogs driver, or FireLens for routing elsewhere.",
      ],
      gotchas: [
        "Fargate task storage is ephemeral (20 GB default, up to 200 GB); mount EFS for shared/persistent files.",
        "Cold task launch is seconds, not milliseconds -- not a fit for spiky sub-second bursts.",
        "Fargate per-vCPU pricing beats EC2 only at low/variable utilisation; do the math at scale.",
      ],
      pricing:
        "Fargate: pay per vCPU-second and GB-second while a task runs. EC2 launch type: pay for the EC2 " +
        "instances regardless of how packed they are. ECS control plane itself is free.",
      cli: "aws ecs update-service --cluster prod --service web --desired-count 6",
    },
    quiz: [
      { q: "What is an ECS task definition?",
        choices: ["A billing report", "The blueprint for a container: image, CPU/mem, ports, role", "A running EC2 instance", "A VPC subnet"],
        answer: 1, why: "Tasks are launched from a task definition; a service keeps a desired number of them alive." },
      { q: "The main benefit of the Fargate launch type over EC2 launch type is...",
        choices: ["It is always cheaper", "No EC2 hosts to provision, patch or scale", "It supports more regions", "It runs Windows only"],
        answer: 1, why: "Fargate removes host management; you declare task size and AWS supplies the compute." },
      { q: "Where do your private container images live?",
        choices: ["S3 bucket", "ECR", "DynamoDB", "AMI catalog"],
        answer: 1, why: "Elastic Container Registry (ECR) is AWS's managed private image registry." },
    ],
    badge: { name: 'CONTAINER CAPTAIN', emoji: '📦' },
  },

  /* ================= STORAGE SHORES ================= */

  s3: {
    id: 's3', world: 'storage', name: 'AMAZON S3', sub: 'Simple Storage Service', icon: '🪣',
    briefing: [
      "S3 stores objects -- files with metadata -- inside buckets.",
      "It is effectively infinite, designed for eleven nines of durability, and reachable over HTTPS.",
      "It underpins half of AWS: data lakes, backups, static sites, logs, ML datasets.",
      "No file system, no servers. Just PUT, GET, and a key.",
    ],
    metaphor: "An infinite coat-check: hand over any item, get a ticket (the key), retrieve it later from anywhere.",
    points: [
      "An OBJECT = data + key (its name) + metadata. Buckets hold objects in a flat namespace ('folders' are just key prefixes).",
      "Bucket names are globally unique. Data lives in one region unless you set up replication.",
      "Durability is 99.999999999% (11 nines); objects are spread across multiple devices and AZs.",
      "Max object size 5 TB (use multipart upload above 100 MB / required above 5 GB).",
      "Access is DENY by default: Block Public Access, bucket policies, IAM, and pre-signed URLs control it.",
    ],
    deep: {
      works: [
        "Every write is stored redundantly across at least 3 AZs before S3 acknowledges it. Reads are strongly consistent -- a successful PUT is immediately visible to a subsequent GET.",
        "Versioning keeps every overwrite/delete as a distinct version so you can roll back or recover from ransomware/accidents. A delete just adds a 'delete marker'.",
        "Lifecycle rules transition objects between storage classes or expire them on age. Event notifications (to Lambda/SQS/SNS/EventBridge) let you react to uploads.",
      ],
      diagram:
        "  Client --HTTPS PUT--> [ Bucket: my-app-data ]\n" +
        "                           key: uploads/2026/img.png\n" +
        "                           replicated across AZ-a / AZ-b / AZ-c\n" +
        "     on PUT --> event --> Lambda (make thumbnail) --> writes back to bucket",
      practice: [
        "Keep Block Public Access ON; serve public content via CloudFront with Origin Access Control.",
        "Turn on versioning + a lifecycle rule to expire old versions, so mistakes are recoverable but not costly forever.",
        "Use pre-signed URLs to give a browser temporary, scoped upload/download rights without credentials.",
        "Enable default encryption (SSE-S3 or SSE-KMS) and access logging / CloudTrail data events for audit.",
      ],
      gotchas: [
        "'Folders' aren't real -- listing millions of keys under a prefix can be slow and costs per request.",
        "Cross-region data transfer and lots of small GETs add up; front with a CDN and batch where you can.",
        "A public bucket policy overrides object ACLs -- always check Block Public Access at the account level too.",
      ],
      pricing:
        "Pay for GB stored per month (by storage class), per-1000 request charges, and data transfer OUT to the internet. " +
        "Transfer IN is free; transfer to CloudFront is free.",
      cli: "aws s3 cp ./build s3://my-site/ --recursive\naws s3 presign s3://my-bucket/report.pdf --expires-in 3600",
    },
    quiz: [
      { q: "S3 stores data as...",
        choices: ["Blocks attached to an instance", "Objects (data + key + metadata) in buckets", "Rows in tables", "Files on a mounted NFS share"],
        answer: 1, why: "S3 is object storage; EBS is block storage; EFS is file storage." },
      { q: "By default, a brand-new S3 bucket is...",
        choices: ["Public to the world", "Private -- access must be explicitly granted", "Readable by any AWS account", "Deleted after 30 days"],
        answer: 1, why: "Everything is denied unless a policy/IAM/pre-signed URL allows it, and Block Public Access is on." },
      { q: "Which feature lets you recover an object after an accidental overwrite?",
        choices: ["Transfer Acceleration", "Versioning", "Requester Pays", "Multipart upload"],
        answer: 1, why: "Versioning retains prior versions and turns deletes into recoverable delete markers." },
    ],
    badge: { name: 'BUCKET BEARER', emoji: '🪣' },
  },

  ebs: {
    id: 'ebs', world: 'storage', name: 'AMAZON EBS', sub: 'Elastic Block Store', icon: '💽',
    briefing: [
      "EC2 needs a disk. EBS is that disk -- but delivered over the network.",
      "It behaves like a raw drive you format and mount, yet it outlives the instance.",
      "Snapshots back it up to S3 automatically and incrementally.",
      "One volume, one instance, one AZ (with a couple of exceptions).",
    ],
    metaphor: "An external SSD on a very fast cable -- unplug from one PC, plug into another in the same room.",
    points: [
      "EBS volumes provide block storage to a single EC2 instance in the same AZ.",
      "Volume types: gp3/gp2 (general SSD), io2/io1 (high provisioned IOPS), st1 (throughput HDD), sc1 (cold HDD).",
      "gp3 lets you set IOPS and throughput independently of size (baseline 3,000 IOPS / 125 MB/s).",
      "SNAPSHOTS are incremental point-in-time copies stored in S3; create a new volume (any AZ) from one.",
      "Encryption is via KMS and is transparent once enabled.",
    ],
    deep: {
      works: [
        "The volume data actually lives on redundant storage within one AZ; the Nitro card presents it to the instance as a local NVMe device. That network hop is invisible but real -- it's why IOPS/throughput are provisioned quantities.",
        "First snapshot copies all used blocks; later snapshots copy only changed blocks, but each snapshot is still a complete restore point. Deleting an old snapshot never breaks newer ones.",
        "You can grow a volume and change its type live (elastic volumes); the filesystem then needs an online resize.",
      ],
      diagram:
        "  EC2 instance (AZ-a)\n" +
        "     |  NVMe (presented by Nitro)\n" +
        "  [ EBS gp3 100GB / 3000 IOPS ]  --- replicated within AZ-a\n" +
        "         |  snapshot (incremental)\n" +
        "         v\n" +
        "       S3-backed snapshot  --> restore as new volume in AZ-b",
      practice: [
        "Default to gp3 -- cheaper than gp2 and you tune IOPS/throughput to the workload.",
        "Automate snapshots with Data Lifecycle Manager or AWS Backup; test restores.",
        "Enable 'encryption by default' at the account level so every new volume is encrypted.",
        "For databases needing sustained low latency, use io2 Block Express and spread across AZs at the app layer.",
      ],
      gotchas: [
        "A volume can't move AZs -- you snapshot and recreate. Plan HA at the application tier.",
        "Deleting an instance can delete its root volume (DeleteOnTermination) -- check the flag.",
        "Burst-based gp2 can silently throttle under sustained load; gp3 removes that surprise.",
      ],
      pricing:
        "Pay per provisioned GB-month (not used) by type, plus extra provisioned IOPS/throughput on gp3/io2. " +
        "Snapshots bill for changed-block storage in S3.",
      cli: "aws ec2 create-snapshot --volume-id vol-0abcd --description \"nightly\"\naws ec2 modify-volume --volume-id vol-0abcd --volume-type gp3 --iops 6000",
    },
    quiz: [
      { q: "How many EC2 instances can a standard EBS volume attach to at once?",
        choices: ["Unlimited", "One (per AZ)", "Up to 10", "One per region"],
        answer: 1, why: "Standard EBS is single-attach within one AZ; only io2 Multi-Attach is an exception." },
      { q: "An EBS snapshot is stored...",
        choices: ["On the instance's local disk", "In S3, incrementally", "In DynamoDB", "In the AMI catalog only"],
        answer: 1, why: "Snapshots are incremental, S3-backed point-in-time copies you can restore in any AZ." },
      { q: "Which volume type lets you set IOPS and throughput independently of capacity?",
        choices: ["gp2", "gp3", "st1", "sc1"],
        answer: 1, why: "gp3 decouples performance from size; gp2's performance scaled with GB." },
    ],
    badge: { name: 'BLOCK WARDEN', emoji: '💽' },
  },

  storageclasses: {
    id: 'storageclasses', world: 'storage', name: 'S3 STORAGE CLASSES', sub: 'Pay for the access you need', icon: '🧊',
    briefing: [
      "Not all data is equal. Some is read every second; some hasn't been touched in a year.",
      "S3 storage classes trade retrieval speed and cost for cheaper storage.",
      "Lifecycle rules move objects down the tiers automatically as they age.",
      "Choose wrong and you either overpay or wait hours for a file.",
    ],
    metaphor: "Desk drawer vs. filing cabinet vs. offsite warehouse -- same papers, very different retrieval time.",
    points: [
      "STANDARD: hot data, millisecond access, highest storage price, no retrieval fee.",
      "STANDARD-IA / ONE ZONE-IA: infrequent access, cheaper storage, per-GB retrieval fee, 30-day minimum.",
      "INTELLIGENT-TIERING: S3 moves objects between tiers by observed access; small monitoring fee, no retrieval fee.",
      "GLACIER INSTANT RETRIEVAL: archive price, still millisecond reads, 90-day minimum.",
      "GLACIER FLEXIBLE / DEEP ARCHIVE: cheapest; retrieval takes minutes to hours (Deep Archive is ~12h for Standard retrieval and up to 48h for Bulk).",
    ],
    deep: {
      works: [
        "All classes except One Zone-IA store across >=3 AZs with the same 11-nines durability; they differ in availability SLA, minimum storage duration, and whether/what you pay to read.",
        "A lifecycle configuration is rules like 'after 30 days -> Standard-IA, after 90 -> Glacier Flexible, after 365 -> Deep Archive, expire non-current versions after 60 days'.",
        "Glacier Flexible retrieval has Expedited (1-5 min), Standard (3-5 h) and Bulk (5-12 h) options; you 'restore' a temporary copy for N days.",
      ],
      diagram:
        "  age 0d        30d           90d              365d\n" +
        "  STANDARD ---> STANDARD-IA ---> GLACIER FLEX ---> DEEP ARCHIVE\n" +
        "  ms access     ms + fee        minutes-hours     12-48h restore\n" +
        "  (or: INTELLIGENT-TIERING does this automatically)",
      practice: [
        "Unknown or changing access pattern? Use Intelligent-Tiering and stop guessing.",
        "Logs/backups you rarely read: lifecycle to Glacier Flexible or Deep Archive after a short window.",
        "Don't put tiny, short-lived objects in IA/Glacier -- minimum-duration and per-object overhead eat the savings.",
        "Model retrieval cost + time before archiving data you might need in an incident.",
      ],
      gotchas: [
        "Early deletion before the class minimum (30/90/180 days) still bills for the full minimum.",
        "One Zone-IA lives in a single AZ -- fine for reproducible data, risky for the only copy.",
        "Deep Archive restores are slow; not suitable for anything time-critical.",
      ],
      pricing:
        "Storage $/GB drops sharply Standard -> IA -> Glacier -> Deep Archive, but retrieval $/GB and latency rise. " +
        "Intelligent-Tiering adds a small per-object monitoring charge.",
      cli: "aws s3api put-bucket-lifecycle-configuration --bucket my-logs \\\n  --lifecycle-configuration file://lifecycle.json",
    },
    quiz: [
      { q: "You have data with an unpredictable, changing access pattern. Best class?",
        choices: ["Standard-IA", "Glacier Deep Archive", "S3 Intelligent-Tiering", "One Zone-IA"],
        answer: 2, why: "Intelligent-Tiering auto-moves objects by real access, with no retrieval fees." },
      { q: "Which class can require 12-48 hours to retrieve an object, depending on retrieval tier?",
        choices: ["S3 Standard", "Glacier Instant Retrieval", "Standard-IA", "Glacier Deep Archive"],
        answer: 3, why: "Deep Archive restores take about 12 hours with Standard retrieval and up to 48 hours with Bulk retrieval." },
      { q: "What moves objects between classes automatically over time?",
        choices: ["A lifecycle configuration", "A bucket policy", "A security group", "Transfer Acceleration"],
        answer: 0, why: "Lifecycle rules transition or expire objects based on age or version state." },
    ],
    badge: { name: 'TIER TACTICIAN', emoji: '🧊' },
    sim: {
      game: 'storageTiers',
      label: 'TIER THE BUCKET',
      blurb: 'Assign each object a storage class. Chase the lowest monthly bill without ever missing a retrieval-time requirement.',
    },
  },

  efs: {
    id: 'efs', world: 'storage', name: 'AMAZON EFS', sub: 'Elastic File System', icon: '🗂️',
    briefing: [
      "EBS gives one instance a disk. EFS gives many instances the same folder.",
      "It is a fully managed NFS share that grows and shrinks automatically.",
      "Mount it from EC2, from containers, even from Lambda -- all at once.",
      "Linux and POSIX only. It is a file system, not object storage.",
    ],
    metaphor: "A shared network drive for your whole fleet -- everyone sees the same files instantly.",
    points: [
      "EFS presents an NFSv4 file system reachable from mount targets in each AZ of your VPC.",
      "Thousands of clients can read/write concurrently with standard file locking and permissions.",
      "Capacity is elastic -- you pay for what you store, no pre-provisioning.",
      "Regional storage classes: Standard, Standard-IA, and Archive; One Zone file systems offer One Zone and One Zone-IA. Lifecycle policies move cold files to lower-cost classes.",
      "Throughput modes: Elastic (default, scales with load), Bursting, or Provisioned.",
    ],
    deep: {
      works: [
        "You create one mount target per AZ (an ENI with an IP). Clients in that AZ mount nfs://<ip>:/ or use the EFS mount helper with TLS. Data is stored redundantly across all AZs in the region (Standard).",
        "Because it's multi-AZ and network file storage, per-operation latency is higher than a local EBS volume -- great for shared config, content, and home directories; poor for a busy transactional database.",
        "Access Points give an application a locked-down entry: enforced POSIX user/group and a root directory, so multi-tenant apps stay isolated.",
      ],
      diagram:
        "        VPC\n" +
        "  AZ-a           AZ-b           AZ-c\n" +
        "  [EC2]-mt-\\      [EC2]-mt-\\     [Lambda]-mt-\\\n" +
        "           \\----- EFS file system (data across all AZs) -----/",
      practice: [
        "Use it for shared assets across an Auto Scaling web fleet, CMS uploads, CI caches, ML datasets.",
        "Turn on lifecycle management to drop untouched files to IA and cut cost.",
        "Mount with the EFS mount helper and encryption in transit; enable encryption at rest (KMS).",
        "Prefer Access Points over hand-managed permissions for per-app isolation.",
      ],
      gotchas: [
        "Latency is higher than EBS -- don't run a write-heavy relational DB on it.",
        "Per-GB cost is higher than EBS or S3; keep only genuinely shared, active data here.",
        "Linux/NFS only; Windows workloads need FSx for Windows File Server instead.",
      ],
      pricing:
        "Pay per GB-month stored (Standard vs IA priced very differently), optional Provisioned Throughput, " +
        "and small per-GB charges when reading/writing IA data. No charge for capacity you don't use.",
      cli: "sudo mount -t efs -o tls fs-0123abcd:/ /mnt/shared",
    },
    quiz: [
      { q: "The key difference between EFS and EBS is that EFS...",
        choices: ["Is cheaper per GB", "Can be mounted by many instances at once", "Only works on Windows", "Stores objects, not files"],
        answer: 1, why: "EFS is a shared multi-AZ NFS file system; EBS attaches to a single instance." },
      { q: "Which workload is a POOR fit for EFS?",
        choices: ["Shared web assets across an ASG", "A write-heavy transactional database", "A CI build cache", "Home directories for a dev fleet"],
        answer: 1, why: "Higher network-file latency makes EFS unsuitable for busy transactional DBs." },
      { q: "How is EFS capacity managed?",
        choices: ["You pre-provision GBs like EBS", "It is elastic -- grows and shrinks automatically", "Fixed 1 TB per file system", "You buy it in Reserved blocks"],
        answer: 1, why: "EFS scales storage automatically and you pay only for what you store." },
    ],
    badge: { name: 'SHARE KEEPER', emoji: '🗂️' },
  },

  /* ================= NETWORK NEXUS ================= */

  vpc: {
    id: 'vpc', world: 'network', name: 'AMAZON VPC', sub: 'Virtual Private Cloud', icon: '🌐',
    briefing: [
      "Every resource needs somewhere to live on the network. That place is a VPC.",
      "It is your own private slice of the AWS network, isolated from everyone else.",
      "You carve it into subnets, decide what is public, and control every route.",
      "Get the VPC right and security, scaling and connectivity all get easier.",
    ],
    metaphor: "Your own gated neighbourhood inside a huge city -- you lay the streets and man the gates.",
    points: [
      "A VPC is defined by a CIDR block (e.g. 10.0.0.0/16) within one region.",
      "SUBNETS are CIDR slices, each pinned to one AZ. 'Public' = route to an Internet Gateway.",
      "PRIVATE subnets reach the internet outbound via a NAT Gateway; nothing gets in unsolicited.",
      "SECURITY GROUPS (stateful, per-ENI, allow-only) vs NACLs (stateless, per-subnet, allow+deny).",
      "VPC ENDPOINTS let you reach S3, DynamoDB and other services without traversing the internet.",
    ],
    deep: {
      works: [
        "Route tables are the brain: a subnet is 'public' only because its route table sends 0.0.0.0/0 to an Internet Gateway. Private subnets send 0.0.0.0/0 to a NAT Gateway that lives in a public subnet.",
        "Security Groups are evaluated as a whole and are stateful -- allow inbound 443 and the response is automatically allowed out. NACLs are checked in numbered order and you must allow return traffic explicitly.",
        "To connect VPCs or on-prem: VPC Peering (1:1, no transitive), Transit Gateway (hub-and-spoke at scale), or Site-to-Site VPN / Direct Connect for the data centre.",
      ],
      diagram:
        "  VPC 10.0.0.0/16\n" +
        "  +--------------------------------------------------+\n" +
        "  | Public subnet 10.0.1.0/24 (AZ-a)                 |\n" +
        "  |   [ALB]   [NAT GW] --- Internet Gateway --- WWW  |\n" +
        "  | Private subnet 10.0.11.0/24 (AZ-a)              |\n" +
        "  |   [App EC2] --0.0.0.0/0--> NAT GW               |\n" +
        "  |   [--> S3 via Gateway Endpoint, no internet]    |\n" +
        "  +--------------------------------------------------+",
      practice: [
        "Standard layout: public subnets for load balancers/NAT only; app and DB tiers in private subnets, per AZ.",
        "Use one NAT Gateway per AZ for HA (they are AZ-bound).",
        "Add Gateway Endpoints for S3/DynamoDB and Interface Endpoints for other AWS APIs to cut NAT cost and stay private.",
        "Keep Security Groups tight and reference other SGs (not IP ranges) so rules scale with the fleet.",
      ],
      gotchas: [
        "VPC Peering is not transitive -- A-B and B-C does not give you A-C.",
        "NAT Gateways cost per hour and per GB processed; endpoint-able traffic shouldn't go through them.",
        "You can't shrink or renumber a VPC CIDR later (you can add secondary CIDRs). Plan address space up front.",
      ],
      pricing:
        "The VPC, subnets, route tables, IGW and Security Groups are free. You pay for NAT Gateways (hourly + per GB), " +
        "Interface Endpoints (hourly + per GB), and inter-AZ / internet data transfer.",
      cli: "aws ec2 create-vpc --cidr-block 10.0.0.0/16\naws ec2 create-subnet --vpc-id vpc-0123 --cidr-block 10.0.1.0/24 --availability-zone us-east-1a",
    },
    quiz: [
      { q: "What makes a subnet 'public'?",
        choices: ["It has a public IP range", "Its route table sends 0.0.0.0/0 to an Internet Gateway", "It is in AZ 'a'", "It has no NACL"],
        answer: 1, why: "Public vs private is purely about the route to an Internet Gateway." },
      { q: "Which is stateful and evaluated as a whole set of allow rules?",
        choices: ["Network ACL", "Security Group", "Route table", "DHCP option set"],
        answer: 1, why: "Security Groups are stateful allow-only rules per ENI; NACLs are stateless per subnet." },
      { q: "How do instances in a private subnet get software updates from the internet?",
        choices: ["Directly via the Internet Gateway", "Outbound through a NAT Gateway", "They cannot, ever", "Through a Security Group"],
        answer: 1, why: "A NAT Gateway in a public subnet provides outbound-only internet for private subnets." },
    ],
    badge: { name: 'NETWORK ARCHITECT', emoji: '🌐' },
    sim: {
      game: 'subnetRouter',
      label: 'ROUTE THE PACKETS',
      blurb: 'Eight packets leave a subnet. Send each one out the right door: Internet Gateway, NAT Gateway, a VPC endpoint, or the local route.',
    },
  },

  elb: {
    id: 'elb', world: 'network', name: 'ELASTIC LOAD BALANCING', sub: 'One door, many servers', icon: '⚖️',
    briefing: [
      "You have a fleet. Clients need one address, not a list of instances.",
      "A load balancer is that front door -- it spreads traffic and hides failures.",
      "Pick the right type: ALB for HTTP smarts, NLB for raw speed.",
      "It health-checks targets and quietly stops sending traffic to sick ones.",
    ],
    metaphor: "A restaurant host seating guests across many tables so no waiter is overwhelmed.",
    points: [
      "APPLICATION LOAD BALANCER (ALB): Layer 7, HTTP/HTTPS, routes by path/host/header, WebSocket, gRPC.",
      "NETWORK LOAD BALANCER (NLB): Layer 4, TCP/UDP, ultra-low latency, static IPs, millions of req/s.",
      "GATEWAY LOAD BALANCER (GWLB): inserts third-party network appliances (firewalls, IDS) transparently.",
      "Targets live in TARGET GROUPS; health checks decide which receive traffic.",
      "The LB spans multiple AZs and terminates TLS using certificates from ACM.",
    ],
    deep: {
      works: [
        "An ALB has listeners (e.g. :443) with rules: 'host api.example.com -> target group A', '/images/* -> group B', default -> group C'. It adds X-Forwarded-For / -Proto headers and can auth users via OIDC/Cognito before forwarding.",
        "An NLB preserves the client IP and does little processing, so it's the choice for non-HTTP protocols, extreme throughput, or when you need a fixed IP / PrivateLink endpoint.",
        "Both integrate with Auto Scaling: new instances register into the target group and start receiving traffic once healthy; terminating instances are drained (connection draining / deregistration delay).",
      ],
      diagram:
        "            Internet\n" +
        "               |\n" +
        "        [ ALB :443 ]   (AZ-a + AZ-b)\n" +
        "        /     |      \\\n" +
        "  /app -> TG1  /img -> TG2   api.* -> TG3\n" +
        "   [EC2 EC2]    [EC2]         [Fargate tasks]\n" +
        "   health checks remove unhealthy targets",
      practice: [
        "Use ALB for web/microservice HTTP routing; NLB when you need TCP/UDP, static IP, or raw performance.",
        "Terminate TLS at the LB with an ACM cert; enable HTTP->HTTPS redirect on the :80 listener.",
        "Tune health check path/threshold so a slow-starting app isn't killed before it's ready (slow start).",
        "Turn on access logs (to S3) and put AWS WAF in front of the ALB for L7 protection.",
      ],
      gotchas: [
        "ALB nodes use DNS with changing IPs -- clients must resolve the name, not cache an IP (use NLB for fixed IPs).",
        "Idle connection timeout (default 60s) can cut long-poll / streaming connections; raise it deliberately.",
        "Cross-zone load balancing is free on ALB but bills inter-AZ data on NLB unless enabled thoughtfully.",
      ],
      pricing:
        "Pay per hour the load balancer runs plus 'LCU' (or NLCU) units that meter new connections, active " +
        "connections, bandwidth and rule evaluations. No per-instance charge.",
      cli: "aws elbv2 create-target-group --name web-tg --protocol HTTP --port 80 --vpc-id vpc-0123 \\\n  --health-check-path /healthz",
    },
    quiz: [
      { q: "You need to route requests to different services by URL path and host header. Which LB?",
        choices: ["Network Load Balancer", "Application Load Balancer", "Gateway Load Balancer", "Classic Load Balancer only"],
        answer: 1, why: "Path/host/header routing is a Layer 7 feature of the ALB." },
      { q: "Which load balancer preserves the client source IP and offers a static IP address?",
        choices: ["ALB", "NLB", "Both equally", "Neither"],
        answer: 1, why: "The NLB operates at Layer 4, keeps the client IP, and provides static/Elastic IPs per AZ." },
      { q: "What does a failed health check cause?",
        choices: ["The LB shuts down", "That target stops receiving new traffic", "All targets restart", "TLS is disabled"],
        answer: 1, why: "Unhealthy targets are removed from rotation until they pass again." },
    ],
    badge: { name: 'TRAFFIC MARSHAL', emoji: '⚖️' },
    sim: {
      game: 'loadBalancer',
      label: 'MAN THE FRONT DOOR',
      blurb: 'Six situations. Pick the right load balancer (ALB / NLB / GWLB) and the right behaviour for TLS, health checks and slow-starting targets.',
    },
  },

  route53: {
    id: 'route53', world: 'network', name: 'AMAZON ROUTE 53', sub: 'DNS + traffic steering', icon: '🧭',
    briefing: [
      "Names are easier than numbers. DNS turns example.com into an address.",
      "Route 53 is AWS's DNS -- authoritative, global, and very fast.",
      "It does more than lookups: it can steer users by latency, geography or health.",
      "It can also register the domain for you.",
    ],
    metaphor: "A phone directory that also knows which branch office is nearest and open right now.",
    points: [
      "A HOSTED ZONE holds the records for a domain (A, AAAA, CNAME, MX, TXT, NS...).",
      "ALIAS records are an AWS extension: point the zone apex (example.com) straight at an ALB, CloudFront, S3 site -- free, and they follow AWS IP changes.",
      "ROUTING POLICIES: simple, weighted, latency-based, failover, geolocation, geoproximity, multivalue.",
      "HEALTH CHECKS monitor endpoints and can pull unhealthy targets out of DNS answers.",
      "Route 53 offers a 100% availability SLA for the DNS service.",
    ],
    deep: {
      works: [
        "When someone resolves your name, Route 53's edge answers from the record set that matches the query -- e.g. latency-based routing returns the region with the lowest measured latency to that resolver.",
        "Failover routing pairs a primary and secondary record with a health check; if the primary check fails, resolvers start getting the secondary answer within a TTL.",
        "CNAME can't sit at the zone apex (RFC), which is exactly why ALIAS exists -- it resolves apex names to AWS targets at query time.",
      ],
      diagram:
        "  user in EU        user in US\n" +
        "     |                 |\n" +
        "  Route 53 (latency-based + health checks)\n" +
        "     |                 |\n" +
        "  ALB eu-west-1     ALB us-east-1\n" +
        "  (if eu unhealthy -> answer us-east-1)",
      practice: [
        "Use ALIAS A/AAAA records for apex domains pointing at CloudFront or an ALB.",
        "Latency-based or geoproximity routing for multi-region apps; failover routing for active-passive DR.",
        "Keep TTLs moderate (60s) on records you may need to fail over; longer for static ones.",
        "Combine with health checks + CloudWatch alarms so DNS reflects reality automatically.",
      ],
      gotchas: [
        "DNS changes are gated by TTL and downstream resolver caching -- 'instant' cutover is a myth.",
        "A CNAME at the apex is invalid; forgetting this breaks 'https://example.com'.",
        "Health-check-driven failover still costs one TTL of errors; pair with app-level retries.",
      ],
      pricing:
        "~$0.50 per hosted zone per month for the first 25 zones (less beyond that), per-million-query charges (higher for latency/geo policies), " +
        "health checks per month, and domain registration at cost.",
      cli: "aws route53 change-resource-record-sets --hosted-zone-id Z123 \\\n  --change-batch file://alias-to-alb.json",
    },
    quiz: [
      { q: "Why use an ALIAS record instead of a CNAME for 'example.com'?",
        choices: ["ALIAS is encrypted", "CNAMEs are not allowed at the zone apex", "ALIAS is faster to type", "CNAMEs cost more per query"],
        answer: 1, why: "DNS rules forbid CNAME at the apex; ALIAS resolves apex names to AWS targets and is free." },
      { q: "Which routing policy sends users to the region with the lowest latency to them?",
        choices: ["Weighted", "Failover", "Latency-based", "Simple"],
        answer: 2, why: "Latency-based routing answers with the AWS region that measures lowest latency for that resolver." },
      { q: "What can a Route 53 health check do to DNS answers?",
        choices: ["Nothing, it only emails you", "Remove unhealthy endpoints from the responses", "Increase the TTL automatically", "Register a new domain"],
        answer: 1, why: "Failing health checks cause Route 53 to stop returning that endpoint." },
    ],
    badge: { name: 'PATHFINDER', emoji: '🧭' },
  },

  cloudfront: {
    id: 'cloudfront', world: 'network', name: 'AMAZON CLOUDFRONT', sub: 'Content Delivery Network', icon: '🛰️',
    briefing: [
      "Your server is in one place. Your users are everywhere.",
      "CloudFront caches your content at hundreds of edge locations near them.",
      "First request fills the cache; the rest are served locally in milliseconds.",
      "It also shields your origin and terminates TLS at the edge.",
    ],
    metaphor: "Neighbourhood corner shops stocking the popular items so nobody drives to the central warehouse.",
    points: [
      "A DISTRIBUTION has one or more ORIGINS (S3, ALB, EC2, or any HTTP server) and cache BEHAVIORS per path.",
      "Edge locations cache responses by cache key; TTLs and cache policies control freshness.",
      "ORIGIN ACCESS CONTROL (OAC) lets only CloudFront read a private S3 bucket.",
      "CloudFront Functions (lightweight, viewer) and Lambda@Edge (heavier) customise requests/responses at the edge.",
      "Integrates with ACM (certs must be in us-east-1), AWS WAF, and Shield for DDoS protection.",
    ],
    deep: {
      works: [
        "On a viewer request, CloudFront routes to the nearest edge. Cache hit -> served immediately. Miss -> the edge fetches from the origin (often via a regional edge cache), stores it per the cache policy, then responds.",
        "The cache key defaults to the URL; you choose which headers, cookies and query strings are included. Fewer keys = higher hit ratio.",
        "Invalidations force-expire cached paths (e.g. /index.html) after a deploy; versioned asset filenames avoid needing them.",
      ],
      diagram:
        "  user (Tokyo) --> [Edge TYO]  hit? --> serve (ms)\n" +
        "                       |\n" +
        "                     miss --> Regional Edge Cache --> Origin (S3 / ALB)\n" +
        "  OAC: S3 bucket only answers CloudFront, not the public internet",
      practice: [
        "Put CloudFront in front of S3 static sites and APIs; lock S3 with OAC and Block Public Access.",
        "Use long TTLs + content-hashed filenames for assets; short/again-validate for HTML.",
        "Attach WAF for L7 rules and rate limiting; Shield Standard is automatic.",
        "Do lightweight edge logic (redirects, header rewrites, auth checks) in CloudFront Functions.",
      ],
      gotchas: [
        "The ACM certificate for a CloudFront custom domain MUST be in us-east-1, regardless of origin region.",
        "Over-forwarding headers/cookies/query strings shreds your cache hit ratio.",
        "Invalidations beyond the free 1,000 paths/month cost money -- prefer versioned filenames.",
      ],
      pricing:
        "Pay for data transfer out to viewers (per region tier) and per 10,000 HTTP/S requests. " +
        "Origin fetches from AWS are free of inter-service transfer charges. Generous always-free tier.",
      cli: "aws cloudfront create-invalidation --distribution-id E123ABC --paths \"/index.html\" \"/\"",
    },
    quiz: [
      { q: "Where must an ACM certificate live to be used on a CloudFront custom domain?",
        choices: ["The same region as the origin", "us-east-1 (N. Virginia)", "Any region", "eu-west-1"],
        answer: 1, why: "CloudFront only reads certificates from us-east-1." },
      { q: "What is the purpose of Origin Access Control (OAC)?",
        choices: ["Speed up cache invalidations", "Allow only CloudFront to fetch from a private S3 bucket", "Encrypt data at rest in S3", "Route by latency"],
        answer: 1, why: "OAC keeps the S3 origin private while letting CloudFront serve it." },
      { q: "Which practice most improves cache hit ratio?",
        choices: ["Forwarding all headers and cookies", "Minimising the cache key (few headers/query strings)", "Disabling TLS", "Using a single edge location"],
        answer: 1, why: "A smaller cache key means more requests match the same cached object." },
    ],
    badge: { name: 'EDGE RUNNER', emoji: '🛰️' },
  },

  apigateway: {
    id: 'apigateway', world: 'network', name: 'API GATEWAY', sub: 'Managed API front door', icon: '🚪',
    briefing: [
      "Your functions and services need a public, secured HTTP front door.",
      "API Gateway is that door -- it terminates TLS, checks auth, throttles, and routes.",
      "You define routes; it invokes Lambda, an HTTP backend, or an AWS service.",
      "It absorbs the boilerplate every API needs so your code doesn't have to.",
    ],
    metaphor: "A hotel concierge desk: checks your ID, enforces the house rules, then sends you to the right room.",
    points: [
      "REST API (feature-rich: request validation, API keys, WAF, private endpoints) vs HTTP API (cheaper, faster, JWT auth, ~70% less cost).",
      "AUTHORIZERS gate requests: IAM, Amazon Cognito, or a Lambda authorizer returning an allow/deny policy.",
      "USAGE PLANS + API KEYS meter and throttle callers; account-level and per-route rate + burst limits protect the backend.",
      "STAGES (dev/prod) are deployable snapshots, each with its own variables, throttling and logging.",
      "Integrations: Lambda proxy, any HTTP endpoint, or direct AWS service calls; responses can be cached per stage.",
    ],
    deep: {
      works: [
        "A request hits the Gateway edge: it matches a route, runs the authorizer (result cached by token for a few minutes), validates the request, then calls the integration. With Lambda proxy integration the whole HTTP request is passed as an event and your function returns statusCode/headers/body.",
        "Throttling is a token bucket: a steady rate plus a burst allowance. Exceed it and callers get HTTP 429. Limits stack -- account, stage, method, and per-key via usage plans.",
        "HTTP APIs are the newer, leaner option (native JWT authorizers, lower latency, lower price). Reach for REST APIs when you need request/response validation models, API keys without Lambda, private APIs via VPC endpoints, or AWS WAF.",
      ],
      diagram:
        "  client --HTTPS--> [ API Gateway ]\n" +
        "                       |  1. match route  /orders/{id}\n" +
        "                       |  2. authorizer (Cognito / Lambda / IAM)\n" +
        "                       |  3. throttle + validate\n" +
        "                       v\n" +
        "        Lambda  |  HTTP backend  |  AWS service  (+ optional cache)",
      practice: [
        "Default to HTTP API; move to REST API only for a feature it uniquely offers.",
        "Put real auth on every route (Cognito or a Lambda authorizer) -- never ship an open API 'for now'.",
        "Set conservative throttle + burst limits and per-client usage plans so one caller can't starve the rest.",
        "Enable access logs + execution logs to CloudWatch and turn on X-Ray tracing for latency breakdowns.",
      ],
      gotchas: [
        "HTTP APIs have a fixed 30-second integration timeout. REST APIs default to 29 seconds; Regional/private REST APIs can request a higher quota, but long jobs are usually safer as async work.",
        "Lambda proxy integration makes Gateway a passthrough: all request shaping now lives in your function.",
        "Forgetting to redeploy the stage after a change -- the console edit isn't live until you deploy.",
      ],
      pricing:
        "Pay per million API calls (HTTP API roughly a third the price of REST API), plus data transfer out, " +
        "plus optional per-stage cache (per GB-hour). No idle/hourly charge.",
      cli: "aws apigatewayv2 create-api --name orders --protocol-type HTTP --target arn:aws:lambda:...:function:orders",
    },
    quiz: [
      { q: "Your API needs the lowest cost and latency with built-in JWT auth, and no need for request-model validation. Which type?",
        choices: ["REST API", "HTTP API", "WebSocket API", "Classic API"],
        answer: 1, why: "HTTP APIs are cheaper and faster with native JWT authorizers; REST APIs add validation models, API keys without Lambda, private endpoints and WAF." },
      { q: "A client is hammering one route and degrading everyone else. What in API Gateway fixes this?",
        choices: ["A longer integration timeout", "Usage plans with per-API-key rate and burst limits", "A bigger Lambda", "Disabling the authorizer"],
        answer: 1, why: "Usage plans + API keys meter and throttle each caller independently; per-method and stage limits back-stop it." },
      { q: "An HTTP API request needs 90 seconds of backend work. What should you do?",
        choices: ["Keep the synchronous request open", "Return 202 immediately and process async via a queue or Step Functions", "Retry until it fits in 30s", "Disable throttling"],
        answer: 1, why: "HTTP API integrations have a fixed 30-second timeout; acknowledge the request and process long work asynchronously." },
    ],
    badge: { name: 'GATEKEEPER', emoji: '🚪' },
  },

  /* ================= DATA DUNGEON ================= */

  rds: {
    id: 'rds', world: 'data', name: 'AMAZON RDS', sub: 'Managed relational databases', icon: '🛢️',
    briefing: [
      "You need a SQL database, but not the pager duty that comes with running one.",
      "RDS runs MySQL, PostgreSQL, MariaDB, Oracle or SQL Server for you.",
      "Backups, patching, failover, replicas -- handled by the service.",
      "You get an endpoint and a connection string. No shell on the box.",
    ],
    metaphor: "Renting a fully serviced apartment instead of owning a house with a leaky roof.",
    points: [
      "RDS manages provisioning, OS/engine patching, automated backups and point-in-time recovery (1-35 days).",
      "MULTI-AZ keeps a synchronous standby in another AZ and fails over automatically on trouble.",
      "READ REPLICAS are asynchronous copies that scale read traffic (and can be promoted / cross-region).",
      "You never get OS access; you tune via parameter groups and option groups.",
      "Storage can autoscale; RDS Proxy pools connections for spiky / serverless clients.",
    ],
    deep: {
      works: [
        "Multi-AZ replicates every write to a hidden standby synchronously. On failure, the DNS endpoint is repointed to the standby in ~60-120s -- your app just reconnects. It is for availability, not read scaling.",
        "Read replicas ship the binlog / WAL asynchronously; they lag slightly and are eventually consistent. Point reporting and read-heavy endpoints at them.",
        "Automated backups are daily snapshots + continuous transaction logs, enabling restore to any second in the retention window (as a new instance).",
      ],
      diagram:
        "  app --writes--> [ RDS primary (AZ-a) ] ==sync==> [ standby (AZ-b) ]\n" +
        "                       |  async\n" +
        "                       +--> [ read replica ] <-- reporting / read traffic\n" +
        "  failover: endpoint swings to standby automatically",
      practice: [
        "Turn on Multi-AZ for anything production; test a failover so the app's reconnect logic is proven.",
        "Send read-only workloads to replicas; keep the primary for writes and low-latency reads.",
        "Use RDS Proxy in front of Lambda / large fleets to avoid exhausting DB connections.",
        "Store credentials in Secrets Manager with rotation; restrict access with Security Groups + IAM auth.",
      ],
      gotchas: [
        "Read replicas can lag -- never rely on one for read-after-write correctness.",
        "Multi-AZ failover causes a brief outage; connection pools must retry.",
        "Scaling instance size or storage type can need a maintenance window; plan it.",
      ],
      pricing:
        "Pay per instance-hour (by class + engine), provisioned storage and IOPS, backup storage beyond the DB " +
        "size, and cross-AZ / cross-region data transfer. Reserved Instances cut the compute cost.",
      cli: "aws rds create-db-instance --db-instance-identifier app-db --engine postgres \\\n  --db-instance-class db.m6g.large --allocated-storage 100 --multi-az",
    },
    quiz: [
      { q: "What is the PRIMARY purpose of RDS Multi-AZ?",
        choices: ["Scaling read traffic", "High availability via automatic failover to a standby", "Cheaper storage", "Global low-latency reads"],
        answer: 1, why: "Multi-AZ is about availability. Read scaling is what read replicas are for." },
      { q: "Read replicas are kept in sync...",
        choices: ["Synchronously (zero lag)", "Asynchronously (may lag)", "Only once per day", "By manual export"],
        answer: 1, why: "Replication is async, so replicas can be slightly behind the primary." },
      { q: "How do you tune an RDS engine if you have no OS access?",
        choices: ["SSH in and edit configs", "Parameter groups and option groups", "You cannot tune it", "Edit the AMI"],
        answer: 1, why: "RDS exposes engine settings through parameter/option groups instead of shell access." },
    ],
    badge: { name: 'QUERY KNIGHT', emoji: '🛢️' },
  },

  dynamodb: {
    id: 'dynamodb', world: 'data', name: 'AMAZON DYNAMODB', sub: 'Serverless NoSQL at any scale', icon: '🔑',
    briefing: [
      "Some apps need predictable millisecond reads whether you have 10 users or 10 million.",
      "DynamoDB is a fully managed key-value and document database with no servers to size.",
      "It scales horizontally by partitioning your data across many nodes automatically.",
      "The catch: you must design around your access patterns, not a clean relational schema.",
    ],
    metaphor: "A vast wall of numbered lockers -- instant if you know the number, painful if you have to open them all.",
    points: [
      "Every item lives in a table and is found by its PRIMARY KEY: partition key, or partition key + sort key.",
      "The partition key's hash decides which physical partition stores the item -- pick a high-cardinality key.",
      "CAPACITY MODES: on-demand (pay per request, auto) or provisioned (set RCUs/WCUs, optional auto scaling).",
      "GLOBAL SECONDARY INDEXES (GSI) enable queries on other attributes; LSIs share the partition key.",
      "Extras: Streams (change feed), DAX (microsecond cache), TTL, transactions, global tables (multi-region).",
    ],
    deep: {
      works: [
        "DynamoDB spreads a table over partitions (~10 GB / 3,000 RCU / 1,000 WCU each). Requests hit the partition for your key, so throughput scales with the number of distinct partition-key values you use.",
        "A Query reads a single partition key (optionally a sort-key range) efficiently. A Scan reads the whole table -- avoid it in hot paths.",
        "Design is 'single-table': model relationships as item collections sharing a partition key, and add GSIs for secondary access patterns. Know your queries before you create the table.",
      ],
      diagram:
        "  Table: AppData   PK = USER#42\n" +
        "  +-------------------------------------------+\n" +
        "  | PK        | SK          | attributes      |\n" +
        "  | USER#42   | PROFILE     | name, email     |\n" +
        "  | USER#42   | ORDER#1001  | total, status   |\n" +
        "  | USER#42   | ORDER#1002  | total, status   |\n" +
        "  +-------------------------------------------+\n" +
        "  Query(PK=USER#42, SK begins_with 'ORDER#') -> that user's orders",
      practice: [
        "Choose a partition key that spreads load evenly (userId, tenantId) -- never a low-cardinality value or 'status'.",
        "Use on-demand for new/spiky workloads; switch to provisioned + auto scaling once the pattern is known and steady.",
        "Add GSIs for each additional query pattern; project only the attributes you need.",
        "Use DynamoDB Streams -> Lambda for derived data, search indexing, and event-driven side effects.",
      ],
      gotchas: [
        "A 'hot' partition key throttles even if total capacity looks fine -- watch for skew.",
        "Scans and filter expressions still consume capacity for every item read, not just returned.",
        "Item size is capped at 400 KB; large blobs belong in S3 with a pointer stored in the item.",
      ],
      pricing:
        "On-demand: pay per read/write request unit + storage. Provisioned: pay for RCU/WCU per hour + storage. " +
        "Extra for GSIs, Streams, global tables, DAX and backups.",
      cli: "aws dynamodb query --table-name AppData \\\n  --key-condition-expression \"PK = :p AND begins_with(SK, :s)\" \\\n  --expression-attribute-values '{\":p\":{\"S\":\"USER#42\"},\":s\":{\"S\":\"ORDER#\"}}'",
    },
    quiz: [
      { q: "What decides which physical partition stores a DynamoDB item?",
        choices: ["The sort key", "A hash of the partition key", "Item size", "Creation time"],
        answer: 1, why: "The partition key is hashed to select a partition, so it must be high-cardinality and evenly used." },
      { q: "Which operation should you avoid on a hot request path?",
        choices: ["Query", "GetItem", "Scan", "BatchGetItem"],
        answer: 2, why: "Scan reads the entire table and consumes capacity for every item examined." },
      { q: "You need to query items by an attribute that is not the primary key. Use a...",
        choices: ["Global Secondary Index", "Bigger instance", "Read replica", "Lifecycle rule"],
        answer: 0, why: "GSIs provide alternative key schemas for additional access patterns." },
    ],
    badge: { name: 'KEYMASTER', emoji: '🔑' },
    sim: {
      game: 'hotPartition',
      label: 'PICK THE PARTITION KEY',
      blurb: 'Three tables, three access patterns. Choose a partition key and watch the write load land across 8 partitions -- a bad key melts one of them.',
    },
  },

  aurora: {
    id: 'aurora', world: 'data', name: 'AMAZON AURORA', sub: 'Cloud-native MySQL / PostgreSQL', icon: '🌌',
    briefing: [
      "Aurora is AWS's own database engine, wire-compatible with MySQL and PostgreSQL.",
      "It splits compute from a distributed storage layer that spans three AZs.",
      "Storage grows on its own, replicas are cheap, and failover is fast.",
      "Same SQL you know, rebuilt for the cloud underneath.",
    ],
    metaphor: "A familiar car body bolted onto a completely re-engineered chassis.",
    points: [
      "One shared, log-structured storage volume auto-grows to 128 TiB (up to 256 TiB for supported Aurora PostgreSQL versions) and keeps 6 copies across 3 AZs.",
      "Up to 15 read replicas share that same storage, so replica lag is typically milliseconds.",
      "Failover to a replica is usually under ~30 seconds because there is no data to copy.",
      "AURORA SERVERLESS v2 scales compute in fine-grained ACU steps for variable workloads.",
      "GLOBAL DATABASE replicates to other regions with typical sub-second lag for DR and local reads.",
    ],
    deep: {
      works: [
        "Aurora compute nodes don't write data pages -- they send redo log records to the storage layer, which materialises pages. Six-way replication with quorum writes (4/6) and reads (3/6) means an AZ or disk failure is invisible.",
        "Because replicas read the same storage volume, adding one doesn't copy the dataset and lag stays tiny; the writer and readers share a cluster endpoint (writes) and reader endpoint (load-balanced reads).",
        "Serverless v2 adjusts capacity in ~0.5 ACU increments in-place, so a workload can idle cheaply and burst without a failover.",
      ],
      diagram:
        "  [ Writer ]      [ Reader ] [ Reader ] ... (up to 15)\n" +
        "      \\             |          /\n" +
        "       \\----- shared distributed storage -----/\n" +
        "        6 copies across AZ-a / AZ-b / AZ-c, auto-grow to 128/256 TiB*",
      practice: [
        "Use the cluster endpoint for writes and the reader endpoint to spread read load automatically.",
        "Pick Aurora Serverless v2 for spiky or unpredictable load; provisioned for steady high throughput.",
        "Use Global Database for cross-region disaster recovery and low-latency local reads.",
        "Enable Backtrack (MySQL) or fast clones for quick 'oops' recovery and test environments.",
      ],
      gotchas: [
        "Aurora costs more per hour than the equivalent open-source RDS engine -- justify it with the HA/scale features.",
        "You still can't get OS access; it is managed like RDS.",
        "Many Serverless v2 clusters keep a small paid capacity floor. Supported engine versions can use a 0-ACU minimum and auto-pause, trading idle compute cost for resume latency.",
      ],
      pricing:
        "Pay per instance-hour (or per-ACU-hour for Serverless v2), plus storage per GB-month and I/O " +
        "(or a flat I/O-Optimized rate), plus backups and cross-region replication.",
      cli: "aws rds create-db-cluster --db-cluster-identifier app --engine aurora-postgresql \\\n  --engine-mode provisioned --master-username admin --manage-master-user-password",
    },
    quiz: [
      { q: "Why is Aurora replica lag usually only milliseconds?",
        choices: ["Replicas use faster CPUs", "Replicas read the same shared storage volume as the writer", "Replication is synchronous SQL replay", "Lag is actually always zero"],
        answer: 1, why: "All nodes attach to one distributed storage layer, so there's little to replicate node-to-node." },
      { q: "How many copies of the data does Aurora keep, and across how many AZs?",
        choices: ["2 copies, 1 AZ", "3 copies, 2 AZs", "6 copies, 3 AZs", "1 copy, replicated nightly"],
        answer: 2, why: "Six-way replication across three Availability Zones with quorum reads/writes." },
      { q: "Best Aurora option for a workload with unpredictable, spiky traffic?",
        choices: ["Provisioned single instance", "Aurora Serverless v2", "A read replica only", "Multi-AZ RDS MySQL"],
        answer: 1, why: "Serverless v2 scales compute up and down in fine steps without failover." },
    ],
    badge: { name: 'VOID SCRIBE', emoji: '🌌' },
  },

  elasticache: {
    id: 'elasticache', world: 'data', name: 'AMAZON ELASTICACHE', sub: 'In-memory data store', icon: '⚡',
    briefing: [
      "Databases are fast. Memory is faster -- by a hundredfold.",
      "ElastiCache runs managed Redis (Valkey) or Memcached clusters for you.",
      "Put a cache in front of your database and reads get sub-millisecond.",
      "Also great for sessions, leaderboards, rate limits and queues.",
    ],
    metaphor: "A sticky note on your monitor instead of walking to the filing cabinet every time.",
    points: [
      "Managed in-memory clusters: Redis / Valkey (rich data types, persistence, replication) or Memcached (simple, multi-threaded).",
      "CACHE-ASIDE is the common pattern: app checks cache, on miss reads DB and populates the cache with a TTL.",
      "Redis supports replicas, automatic failover (Multi-AZ), cluster-mode sharding, pub/sub and sorted sets.",
      "Memcached just shards key/value data across nodes -- no persistence, no replication.",
      "Serverless option: pay per GB-hour and requests, no node sizing.",
    ],
    deep: {
      works: [
        "In cache-aside, a miss costs one DB read plus a cache write; subsequent reads are served from RAM until the TTL expires or the key is invalidated on update. Choosing TTLs and invalidation rules is the real work.",
        "Redis cluster mode splits the keyspace into 16,384 hash slots across shards; each shard has a primary + replicas. A primary failure promotes a replica automatically.",
        "Sorted sets make leaderboards O(log n); atomic INCR + EXPIRE make rate limiting trivial; Redis Streams / lists back lightweight job queues.",
      ],
      diagram:
        "  app --GET user:42--> [ ElastiCache Redis ]\n" +
        "        hit  -> return from RAM (<1 ms)\n" +
        "        miss -> read RDS --> SET user:42 EX 300 --> return\n" +
        "  cluster mode: shard1(pri+rep) shard2(pri+rep) ...",
      practice: [
        "Use Redis when you need failover, persistence or data structures; Memcached only for a plain, poolable object cache.",
        "Always set TTLs; design explicit invalidation on writes for data that must be fresh.",
        "Enable Multi-AZ with automatic failover and encryption in transit/at rest for production Redis.",
        "Watch eviction metrics and memory pressure; size for working set + headroom.",
      ],
      gotchas: [
        "A cache is not a database -- treat its contents as disposable and handle cold-cache load (thundering herd).",
        "Big keys / hot keys concentrate load on one shard.",
        "Memcached has no persistence or replication; a node loss drops that shard's data.",
      ],
      pricing:
        "Node-based: pay per node-hour by type + data transfer. Serverless: pay per GB-hour stored and per " +
        "million ElastiCache Processing Units (requests). Reserved nodes cut node cost.",
      cli: "aws elasticache create-replication-group --replication-group-id sess \\\n  --engine redis --cache-node-type cache.r7g.large --num-node-groups 2 --replicas-per-node-group 1",
    },
    quiz: [
      { q: "In the cache-aside pattern, what happens on a cache miss?",
        choices: ["The request fails", "App reads the database, then writes the value into the cache with a TTL", "The cache reboots", "The DB is bypassed permanently"],
        answer: 1, why: "Miss -> load from source of truth -> populate cache -> serve; later reads hit RAM." },
      { q: "You need automatic failover and pub/sub. Which engine?",
        choices: ["Memcached", "Redis / Valkey", "Neither supports failover", "Both are identical"],
        answer: 1, why: "Redis offers replication, Multi-AZ failover, persistence and data structures; Memcached does not." },
      { q: "Which is a safe assumption about cached data?",
        choices: ["It is durable like a database", "It can disappear and must be rebuildable from the source", "It never expires", "It is automatically consistent with the DB"],
        answer: 1, why: "Caches are volatile; design for misses, eviction and cold starts." },
    ],
    badge: { name: 'MEMORY MAGE', emoji: '⚡' },
  },

  /* ================= SENTINEL KEEP ================= */

  iam: {
    id: 'iam', world: 'security', name: 'AWS IAM', sub: 'Identity & Access Management', icon: '🗝️',
    briefing: [
      "Before anything else in AWS, there is the question: who is allowed to do what?",
      "IAM answers it. Every API call is checked against IAM policies.",
      "Users and roles carry permissions; policies are JSON grants.",
      "The golden rule: least privilege. Grant only what is needed, nothing more.",
    ],
    metaphor: "A keycard system: each badge opens exactly the doors its holder needs, and every swipe is logged.",
    points: [
      "PRINCIPALS: IAM users (long-lived), IAM roles (assumed for temporary credentials), and federated identities.",
      "POLICIES are JSON: Effect (Allow/Deny), Action, Resource, and optional Condition.",
      "ROLES are the preferred pattern -- EC2/Lambda/ECS assume a role and get short-lived STS credentials.",
      "Evaluation: an explicit Deny always wins; otherwise you need an explicit Allow; default is deny.",
      "Guardrails: permission boundaries, and Service Control Policies (SCPs) across an AWS Organization.",
    ],
    deep: {
      works: [
        "When a request arrives, AWS gathers all applicable policies (identity, resource, permission boundary, SCP, session) and evaluates: any explicit Deny -> denied; else an Allow in every relevant scope -> allowed; else implicit deny.",
        "A role has a trust policy (who may assume it) and permission policies (what it can then do). sts:AssumeRole returns temporary keys that expire, so nothing long-lived sits on a server.",
        "IAM Identity Center (successor to SSO) federates human logins from your IdP and hands out role sessions per account -- humans shouldn't have IAM users at all in a mature setup.",
      ],
      diagram:
        "  request --> [ evaluate policies ]\n" +
        "                explicit Deny?  --yes--> DENY\n" +
        "                Allow in identity + boundary + SCP? --yes--> ALLOW\n" +
        "                otherwise --> DENY (implicit)\n" +
        "  EC2 --assumes--> Role --STS--> temp keys (expire in hours)",
      practice: [
        "No access keys on servers -- attach a role. Rotate/duplicate-check any remaining keys.",
        "Start from AWS managed policies, then tighten to custom least-privilege as patterns emerge.",
        "Lock the root user away: hardware MFA, no access keys, break-glass only.",
        "Use SCPs for org-wide 'never' rules (e.g. deny leaving regions, deny disabling CloudTrail).",
      ],
      gotchas: [
        "An explicit Deny anywhere (SCP, boundary, resource policy) overrides every Allow.",
        "Wildcards in Action/Resource ('*') are how over-permissioned roles happen -- scope them.",
        "Cross-account access needs BOTH a role trust policy and the caller's permission to assume it.",
      ],
      pricing: "IAM itself is free. IAM Identity Center is free. You only pay for the services actions are performed against.",
      cli: "aws iam create-role --role-name app-role --assume-role-policy-document file://trust.json\naws iam attach-role-policy --role-name app-role --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess",
    },
    quiz: [
      { q: "In IAM policy evaluation, what always wins?",
        choices: ["An explicit Allow", "An explicit Deny", "The most recent policy", "The resource policy"],
        answer: 1, why: "Explicit Deny overrides any Allow; without a Deny you still need an explicit Allow." },
      { q: "How should an EC2 instance get permission to read an S3 bucket?",
        choices: ["Hard-code an access key in the app", "Attach an IAM role (instance profile)", "Make the bucket public", "Use the root account keys"],
        answer: 1, why: "Roles give short-lived, rotating credentials with no secret stored on disk." },
      { q: "What is the recommended default posture for permissions?",
        choices: ["Grant admin, restrict later", "Least privilege -- grant only what's needed", "Allow all read, deny all write", "Copy a teammate's policy"],
        answer: 1, why: "Least privilege limits blast radius when credentials or code are compromised." },
    ],
    badge: { name: 'GATE WARDEN', emoji: '🗝️' },
    sim: {
      game: 'iamEval',
      label: 'BE THE POLICY ENGINE',
      blurb: 'A request arrives. Read the identity policy, SCP, permission boundary and any explicit Deny, then return ALLOW or DENY exactly like IAM would.',
    },
  },

  kms: {
    id: 'kms', world: 'security', name: 'AWS KMS', sub: 'Key Management Service', icon: '🔐',
    briefing: [
      "Encryption is easy. Managing the keys is the hard part.",
      "KMS creates, stores and controls access to encryption keys for you.",
      "The key material never leaves KMS unencrypted -- you call the API to use it.",
      "Nearly every AWS service can encrypt with a KMS key by ticking a box.",
    ],
    metaphor: "A bank vault for master keys: you ask the teller to lock or unlock a box; the master key never leaves the vault.",
    points: [
      "A KMS KEY (formerly CMK) is a logical key: AWS-managed, customer-managed, or AWS-owned.",
      "ENVELOPE ENCRYPTION: KMS generates a data key, you encrypt data locally with it, and store the KMS-encrypted data key alongside.",
      "Access is controlled by a KEY POLICY plus IAM plus optional grants; every use is logged to CloudTrail.",
      "Customer-managed keys support automatic yearly rotation and fine-grained policies.",
      "KMS keys are regional; use multi-Region keys or re-encrypt to cross regions. CloudHSM is the dedicated-hardware option.",
    ],
    deep: {
      works: [
        "To encrypt a large object, a service calls GenerateDataKey: KMS returns a plaintext data key (used once, in memory) and an encrypted copy. The data is encrypted locally; only the encrypted data key is persisted. To decrypt, the service sends the encrypted data key back to KMS.",
        "This means KMS isn't in the data path for bulk bytes -- it only guards the small data keys, so it scales and stays cheap.",
        "S3/EBS/RDS/Secrets Manager integration is just this pattern with the plumbing hidden: you pick a key, they handle GenerateDataKey/Decrypt.",
      ],
      diagram:
        "  encrypt:  KMS GenerateDataKey --> {plaintext DK, encrypted DK}\n" +
        "            data XOR AES(plaintext DK)  --> ciphertext\n" +
        "            store: ciphertext + encrypted DK   (discard plaintext DK)\n" +
        "  decrypt:  send encrypted DK --> KMS Decrypt --> plaintext DK --> unwrap data",
      practice: [
        "Use customer-managed keys when you need your own rotation, policy, or audit boundary; AWS-managed keys for 'just encrypt it'.",
        "Enable automatic annual rotation on customer-managed keys.",
        "Scope key policies tightly -- separate who can administer a key from who can use it.",
        "Use multi-Region keys for cross-region DR of encrypted data.",
      ],
      gotchas: [
        "Delete a key and everything it protected is unrecoverable -- there's a mandatory 7-30 day waiting period for that reason.",
        "KMS has request rate limits; very high-volume encryption should reuse data keys (envelope) rather than call Encrypt per item.",
        "A key is regional; copying an encrypted snapshot to another region requires re-encryption with a key there.",
      ],
      pricing:
        "~$1 per customer-managed key per month, plus per-10,000 API requests. AWS-managed keys have no monthly " +
        "fee but still bill requests. CloudHSM is priced per HSM-hour.",
      cli: "aws kms generate-data-key --key-id alias/app --key-spec AES_256\naws kms decrypt --ciphertext-blob fileb://encrypted-dk.bin",
    },
    quiz: [
      { q: "What is envelope encryption?",
        choices: ["Encrypting email attachments", "Using a KMS key to encrypt a data key, which encrypts the actual data", "Double-encrypting with two passwords", "Encrypting only file metadata"],
        answer: 1, why: "A locally-used data key encrypts the bulk data; KMS only protects the small data key." },
      { q: "Why isn't KMS a bottleneck when encrypting terabytes in S3?",
        choices: ["It streams all the data through KMS", "It only handles the small data keys, not the bulk bytes", "S3 skips encryption for large files", "KMS caches the whole object"],
        answer: 1, why: "Bulk data is encrypted locally with a data key; KMS just wraps/unwraps that key." },
      { q: "A customer-managed KMS key can be configured to...",
        choices: ["Never be logged", "Rotate automatically once per year", "Leave KMS in plaintext", "Work in every region at once by default"],
        answer: 1, why: "Automatic annual rotation is a customer-managed key feature; keys are regional unless multi-Region." },
    ],
    badge: { name: 'CIPHER SENTINEL', emoji: '🔐' },
    sim: {
      game: 'envelopeCrypto',
      label: 'SEAL THE ENVELOPE',
      blurb: 'Put the six steps of envelope encryption -- and decryption -- in the exact order they happen. See why KMS never touches the bulk data.',
    },
  },

  secretsmanager: {
    id: 'secretsmanager', world: 'security', name: 'SECRETS MANAGER', sub: 'Store and rotate secrets', icon: '📜',
    briefing: [
      "Database passwords in a config file. API keys in an env var checked into git. We've all seen it.",
      "Secrets Manager keeps those values encrypted, access-controlled, and out of your code.",
      "Your app fetches the secret at runtime via the API.",
      "It can also rotate the secret on a schedule with zero downtime.",
    ],
    metaphor: "A safe-deposit box with a logbook and an assistant who quietly changes the lock every 30 days.",
    points: [
      "Secrets are encrypted at rest with KMS and returned only to principals your resource/IAM policy allows.",
      "AUTOMATIC ROTATION runs a Lambda that creates a new credential, updates the service, and promotes it.",
      "Secrets are versioned with staging labels (AWSCURRENT, AWSPENDING, AWSPREVIOUS).",
      "Cross-region replication keeps read-local copies for multi-region apps and DR.",
      "SSM Parameter Store (SecureString) is a cheaper alternative without built-in rotation.",
    ],
    deep: {
      works: [
        "On rotation, the Lambda: (1) creates a new secret value and labels it AWSPENDING, (2) sets it on the target service (e.g. ALTER USER in the DB), (3) tests it, (4) moves the AWSCURRENT label to the new version. Old sessions keep working; new fetches get the new value.",
        "Apps call GetSecretValue at startup (and refresh periodically / on auth failure). SDK caching libraries avoid hammering the API.",
        "RDS/Aurora/Redshift/DocumentDB have managed rotation Lambdas provided by AWS -- you mostly just enable it.",
      ],
      diagram:
        "  app --GetSecretValue--> [ Secrets Manager ] --KMS decrypt--> value\n" +
        "  schedule --> Rotation Lambda:\n" +
        "     create new pw (AWSPENDING) -> set on DB -> test -> label AWSCURRENT",
      practice: [
        "Never bake secrets into images, env vars in source, or task definitions -- reference the secret ARN.",
        "Enable rotation for database credentials; use the AWS-provided rotation function where one exists.",
        "Grant read on a per-secret basis; tag secrets and use ABAC for scale.",
        "Cache retrieved secrets in memory with a short TTL; handle rotation by retrying on auth errors.",
      ],
      gotchas: [
        "Rotation that doesn't update every consumer causes outages -- inventory who uses the secret.",
        "It costs per secret per month + per API call; very high-read low-sensitivity config may fit Parameter Store better.",
        "A hardcoded fallback 'just in case' defeats the whole purpose -- don't.",
      ],
      pricing: "~$0.40 per secret per month + ~$0.05 per 10,000 API calls. Replica secrets are billed per region.",
      cli: "aws secretsmanager get-secret-value --secret-id prod/app/db\naws secretsmanager rotate-secret --secret-id prod/app/db --rotation-lambda-arn arn:aws:lambda:...",
    },
    quiz: [
      { q: "What does automatic rotation change the secret to during the process?",
        choices: ["Deletes it then recreates it", "Creates an AWSPENDING version, applies and tests it, then promotes it to AWSCURRENT", "Emails you a new password to set manually", "Nothing -- rotation is only a reminder"],
        answer: 1, why: "Staging labels let the new value be created and verified before it becomes current, avoiding downtime." },
      { q: "A cheaper option for non-rotating config values is...",
        choices: ["Hard-coding them", "SSM Parameter Store SecureString", "An S3 bucket named 'secrets'", "Environment variables in the Dockerfile"],
        answer: 1, why: "Parameter Store SecureString is KMS-encrypted and cheaper, but lacks built-in rotation." },
      { q: "Where should a running app get its DB password?",
        choices: ["From a committed .env file", "By calling GetSecretValue at runtime", "From the AMI", "From a public S3 object"],
        answer: 1, why: "Fetching at runtime keeps the secret out of code, images and version control." },
    ],
    badge: { name: 'VAULT KEEPER', emoji: '📜' },
  },

  cognito: {
    id: 'cognito', world: 'security', name: 'AMAZON COGNITO', sub: 'User sign-up & sign-in', icon: '👤',
    briefing: [
      "IAM secures your team's access to AWS. Your app's end users need something else.",
      "Cognito handles sign-up, sign-in, MFA and social login for your application's users.",
      "User Pools give you a user directory and standard tokens.",
      "Identity Pools swap those tokens for temporary AWS credentials when the app needs them.",
    ],
    metaphor: "The front-desk registration book for your app's visitors -- separate from the staff keycards (IAM).",
    points: [
      "USER POOL: a managed user directory -- registration, login, password reset, MFA, hosted UI, verified email/phone.",
      "It issues standard OAuth 2.0 / OIDC tokens (ID, access, refresh) your backend validates.",
      "Federation: let users sign in with Google, Apple, Facebook, or corporate SAML/OIDC.",
      "IDENTITY POOL (federated identities): exchange a verified token for scoped, temporary IAM credentials.",
      "Use a User Pool for authentication; add an Identity Pool only if the client must call AWS directly.",
    ],
    deep: {
      works: [
        "Login flow: client authenticates against the User Pool (SRP or Managed Login / classic hosted UI) -> receives signed JWTs -> sends the access token in the Authorization header -> API Gateway or your code validates its signature and claims (issuer, token use, client ID, expiry, scopes/groups).",
        "If a browser/mobile client needs to put a file in S3 directly, it passes the User Pool token to an Identity Pool, which calls STS and returns temporary credentials mapped to an IAM role (optionally per group / per claim).",
        "Cognito groups can carry an IAM role and appear as a claim, enabling simple role-based access in your app and in Identity Pool credential mapping.",
      ],
      diagram:
        "  user --sign in--> [ User Pool ] --JWT (ID/access/refresh)--> app\n" +
        "  app --access token--> API Gateway (JWT authorizer) --> Lambda\n" +
        "  app --token--> [ Identity Pool ] --STS--> temp AWS creds --> S3/etc",
      practice: [
        "Validate every JWT's signature, issuer, expiry, token_use, and intended app client (aud on ID tokens; client_id on access tokens); don't trust unverified claims.",
        "Keep access-token lifetime short; use the refresh token to renew.",
        "Use the hosted UI + federation to avoid building password and social-login flows yourself.",
        "Only add an Identity Pool when a client genuinely needs direct AWS access; otherwise proxy through your API.",
      ],
      gotchas: [
        "User Pool vs Identity Pool confusion is the classic trap -- authentication vs AWS credential vending.",
        "Some advanced features (advanced security, large MAUs) raise the price meaningfully.",
        "Migrating an existing user base needs the migration Lambda trigger or a bulk import with reset.",
      ],
      pricing:
        "User Pools are billed per Monthly Active User under Lite, Essentials, or Plus tiers. Free allowances differ for direct/social sign-in and SAML/OIDC federation; check current regional pricing. Identity Pool credential vending has no additional charge, though services used with the credentials may charge.",
      cli: "aws cognito-idp admin-create-user --user-pool-id us-east-1_abc123 --username alice",
    },
    quiz: [
      { q: "Which Cognito component is a user directory that issues JWT tokens?",
        choices: ["Identity Pool", "User Pool", "IAM role", "STS"],
        answer: 1, why: "User Pools handle authentication and issue ID/access/refresh tokens." },
      { q: "You want a mobile app to upload directly to S3 as the signed-in user. You need...",
        choices: ["Only a User Pool", "A User Pool token exchanged via an Identity Pool for temporary AWS credentials", "The app to embed an IAM access key", "A public S3 bucket"],
        answer: 1, why: "Identity Pools trade a verified token for scoped, temporary STS credentials." },
      { q: "IAM vs Cognito -- which secures your APPLICATION'S END USERS?",
        choices: ["IAM", "Cognito", "Both do the same job", "Neither -- use API keys"],
        answer: 1, why: "IAM is for AWS account/workload access; Cognito is for your app's user identities." },
    ],
    badge: { name: 'IDENTITY WARDEN', emoji: '👤' },
  },

  /* ================= ORACLE TOWER ================= */

  cloudwatch: {
    id: 'cloudwatch', world: 'ops', name: 'AMAZON CLOUDWATCH', sub: 'Metrics, logs, alarms', icon: '📊',
    briefing: [
      "You can't operate what you can't see.",
      "CloudWatch collects metrics, logs and events from across AWS and your apps.",
      "Alarms watch a metric and fire actions when it crosses a line.",
      "Dashboards and Logs Insights turn the raw stream into answers.",
    ],
    metaphor: "The instrument panel and black box recorder for your whole cloud.",
    points: [
      "METRICS are time series in namespaces with dimensions (e.g. AWS/EC2 CPUUtilization by InstanceId).",
      "ALARMS evaluate a metric over N periods and go OK / ALARM / INSUFFICIENT_DATA, triggering SNS, Auto Scaling or EC2 actions.",
      "LOGS: agents/services push to log groups; query with Logs Insights; set retention per group.",
      "DASHBOARDS visualise metrics and logs; composite alarms combine conditions to cut noise.",
      "Custom metrics via PutMetricData or the Embedded Metric Format from your application.",
    ],
    deep: {
      works: [
        "Most AWS services publish basic metrics free at 5-minute (or 1-minute) granularity. You add custom/high-resolution metrics from code. Metrics are retained with decreasing granularity for 15 months.",
        "An alarm is: metric + statistic + period + threshold + 'datapoints to alarm'. It's a state machine -- transitions (not every evaluation) invoke actions, so an SNS topic gets one message per state change.",
        "Logs Insights runs a purpose-built query language over log groups ('fields @timestamp, @message | filter status>=500 | stats count() by bin(5m)') for ad-hoc investigation.",
      ],
      diagram:
        "  EC2 / Lambda / ALB / app  --push--> [ CloudWatch Metrics + Logs ]\n" +
        "                                         |\n" +
        "                 Alarm (CPU>70% for 3x5min) --> SNS --> pager / Auto Scaling\n" +
        "                 Dashboard  <-- widgets --  Logs Insights queries",
      practice: [
        "Alarm on user-facing symptoms (latency, error rate, queue age), not just CPU.",
        "Set log-group retention deliberately -- 'never expire' quietly becomes a big bill.",
        "Use composite alarms and 'datapoints to alarm' to suppress flapping and alert fatigue.",
        "Emit structured logs / EMF so metrics and logs correlate; add CloudWatch alarms to a runbook.",
      ],
      gotchas: [
        "Custom metrics and high-resolution alarms cost per metric -- cardinality (per-user dimensions) explodes fast.",
        "INSUFFICIENT_DATA often means the metric stopped being published -- treat it as suspicious.",
        "Ingested log volume, not stored, is the main Logs cost driver; filter noisy debug logs at the source.",
      ],
      pricing:
        "Pay per custom metric per month, per 1,000 API requests, per alarm, per GB of logs ingested + stored, " +
        "and per dashboard. Basic service metrics and a free tier are included.",
      cli: "aws cloudwatch put-metric-alarm --alarm-name high-5xx --namespace AWS/ApplicationELB \\\n  --metric-name HTTPCode_Target_5XX_Count --statistic Sum --period 60 --threshold 10 \\\n  --comparison-operator GreaterThanThreshold --evaluation-periods 3 --alarm-actions arn:aws:sns:...",
    },
    quiz: [
      { q: "When does a CloudWatch alarm invoke its actions?",
        choices: ["On every evaluation period", "Only when it changes state (e.g. OK -> ALARM)", "Once per day", "Only if you press a button"],
        answer: 1, why: "Alarms are a state machine; actions fire on transitions, not on every datapoint." },
      { q: "What most drives CloudWatch Logs cost?",
        choices: ["Number of log groups", "GB of log data ingested", "Number of dashboards", "Region count"],
        answer: 1, why: "Ingestion (plus storage/retention) is the primary charge; filter noisy logs at the source." },
      { q: "Which metric is the BEST alarm target for user experience?",
        choices: ["Instance CPU", "p99 request latency / error rate", "Disk inode count", "AMI age"],
        answer: 1, why: "Alarm on symptoms users feel; resource metrics are secondary diagnostics." },
    ],
    badge: { name: 'ALL-SEEING EYE', emoji: '📊' },
  },

  cloudtrail: {
    id: 'cloudtrail', world: 'ops', name: 'AWS CLOUDTRAIL', sub: 'API audit log', icon: '🧾',
    briefing: [
      "'Who deleted that bucket?' CloudTrail is how you answer.",
      "It records every API call in your account -- who, what, when, from where.",
      "Management events are on by default. Data events you opt into.",
      "It is the backbone of security investigations and compliance.",
    ],
    metaphor: "CCTV plus a signed visitor log for every action taken in your account.",
    points: [
      "Records API activity as JSON events: identity, action, parameters, source IP, response, timestamp.",
      "MANAGEMENT EVENTS (control-plane: create/modify/delete) are logged free; 90 days visible in Event history.",
      "DATA EVENTS (S3 object GET/PUT, Lambda Invoke, DynamoDB item ops) are high-volume and opt-in / paid.",
      "A TRAIL delivers events continuously to S3 (and optionally CloudWatch Logs / EventBridge).",
      "Multi-region and organization trails capture everything in one place; log file integrity validation detects tampering.",
    ],
    deep: {
      works: [
        "Every call to an AWS API (console, CLI, SDK, or service-on-your-behalf) generates a CloudTrail event. Event history shows management events for the last 90 days with no setup; a trail is what gives you long-term, queryable, tamper-evident storage.",
        "Trails write batched log files to an S3 prefix; enabling integrity validation adds signed digest files so you can prove logs weren't altered or deleted.",
        "Route the trail to CloudWatch Logs for metric filters + alarms ('alarm if a security group is opened to 0.0.0.0/0'), or to EventBridge for real-time automated response.",
      ],
      diagram:
        "  console / CLI / SDK / AWS services\n" +
        "        |  every API call\n" +
        "  [ CloudTrail ] --> S3 bucket (long-term, integrity-validated)\n" +
        "        \\--> CloudWatch Logs --> metric filter --> alarm --> SNS\n" +
        "        \\--> EventBridge --> Lambda (auto-remediate)",
      practice: [
        "Create one org-wide, multi-region trail delivering to a locked-down S3 bucket in a separate security account.",
        "Enable log file integrity validation; restrict and monitor access to the log bucket.",
        "Add data events only for sensitive buckets/functions -- account-wide data events can be costly and noisy.",
        "Wire key events (root login, IAM changes, CloudTrail stopped) to alarms via CloudWatch Logs metric filters.",
      ],
      gotchas: [
        "Management events != data events: by default you do NOT get per-object S3 access logs.",
        "Event history is only 90 days and management-only -- you need a trail for real retention/forensics.",
        "CloudTrail delivery has a few-minutes lag; it's audit, not real-time prevention.",
      ],
      pricing:
        "First copy of management events to a trail is free; extra trails, data events and CloudTrail Insights " +
        "are paid per event. You also pay S3 storage for the log files.",
      cli: "aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=DeleteBucket",
    },
    quiz: [
      { q: "By default (no trail configured), CloudTrail Event history shows...",
        choices: ["All events forever", "Management events for the last 90 days", "Only S3 data events", "Nothing"],
        answer: 1, why: "You get 90 days of management events free; a trail adds long-term and data events." },
      { q: "To see object-level S3 GET/PUT activity you must...",
        choices: ["Do nothing, it's automatic", "Enable data events (opt-in, paid)", "Enable CloudWatch", "Turn on VPC Flow Logs"],
        answer: 1, why: "Data events for S3 objects and Lambda invokes are opt-in and billed per event." },
      { q: "What does log file integrity validation give you?",
        choices: ["Faster delivery", "Proof that log files were not altered or deleted", "Cheaper storage", "Real-time blocking of bad API calls"],
        answer: 1, why: "Signed digest files let you detect tampering with the audit trail." },
    ],
    badge: { name: 'CHRONICLE KEEPER', emoji: '📜' },
  },

  sqs: {
    id: 'sqs', world: 'ops', name: 'AMAZON SQS', sub: 'Simple Queue Service', icon: '📨',
    briefing: [
      "Directly calling a downstream service means its outage is your outage.",
      "Put a queue between them. The producer drops a message and moves on.",
      "The consumer pulls work at its own pace, and retries are built in.",
      "This is how you decouple and absorb spikes.",
    ],
    metaphor: "A ticket spike at a diner: orders queue up so the kitchen works steadily no matter the rush.",
    points: [
      "Producers SendMessage; consumers ReceiveMessage, process, then DeleteMessage. Unfinished work reappears.",
      "STANDARD queues: near-unlimited throughput, at-least-once delivery, best-effort ordering.",
      "FIFO queues preserve order within each message group and deduplicate sends within a 5-minute window. Default throughput is 300 API calls/sec per partition (3,000 messages/sec with batching); high-throughput mode and regional quotas can be much higher.",
      "VISIBILITY TIMEOUT hides a message while one consumer works on it; DEAD-LETTER QUEUE catches poison messages.",
      "Retention is 1 minute to 14 days (default 4 days); native payloads are up to 1 MiB (larger via the S3 Extended Client).",
    ],
    deep: {
      works: [
        "On ReceiveMessage, SQS makes the message invisible for the visibility timeout. If the consumer deletes it in time, it's gone; if not (crash, slow), it becomes visible again for another attempt. After maxReceiveCount failures it's moved to the DLQ.",
        "Standard queues may deliver a message more than once and slightly out of order -- consumers must be idempotent. FIFO adds message group IDs (ordering scope) and deduplication IDs (5-minute dedup window).",
        "Long polling (WaitTimeSeconds up to 20) waits for messages instead of returning empty, cutting empty-receive cost and latency. Lambda has a native SQS event source that scales pollers for you.",
      ],
      diagram:
        "  producer --SendMessage--> [ SQS queue ] <--ReceiveMessage-- consumer(s)\n" +
        "                               |  (invisible for visibility timeout)\n" +
        "                               |  fail x maxReceiveCount\n" +
        "                               v\n" +
        "                          [ Dead-Letter Queue ] --> alarm / manual review",
      practice: [
        "Make consumers idempotent (dedupe on a business key) -- assume at-least-once.",
        "Set visibility timeout to ~6x your function/handler timeout; always attach a DLQ with an alarm on depth.",
        "Use long polling everywhere; batch send/receive/delete to cut cost and API calls.",
        "Reach for FIFO only when strict order / exactly-once truly matters -- it has lower throughput.",
      ],
      gotchas: [
        "Forgetting to DeleteMessage causes infinite reprocessing after the visibility timeout.",
        "Standard queue duplicates are normal, not a bug -- design for them.",
        "The native payload cap is 1 MiB -- put larger blobs in S3 and send a pointer.",
      ],
      pricing:
        "Pay per request (each API call; batching up to 10 messages counts as one). ~1M requests/month free. " +
        "FIFO requests cost slightly more. Data transfer out is billed normally.",
      cli: "aws sqs send-message --queue-url $Q --message-body '{\"job\":\"resize\",\"id\":42}'\naws sqs receive-message --queue-url $Q --wait-time-seconds 20 --max-number-of-messages 10",
    },
    quiz: [
      { q: "A Standard SQS queue guarantees...",
        choices: ["Exactly-once, strict order", "At-least-once delivery, best-effort ordering", "At-most-once delivery", "Order only, no delivery guarantee"],
        answer: 1, why: "Standard = at-least-once + best-effort order; use FIFO for exactly-once and strict ordering." },
      { q: "What happens if a consumer receives a message but never deletes it?",
        choices: ["It is lost", "After the visibility timeout it becomes visible again for reprocessing", "It goes straight to the DLQ", "The queue locks"],
        answer: 1, why: "Non-deletion is treated as failure; the message reappears until deleted or DLQ'd." },
      { q: "Where do messages go after failing more than maxReceiveCount times?",
        choices: ["Back to the producer", "The dead-letter queue", "CloudWatch Logs", "They are deleted silently"],
        answer: 1, why: "A DLQ isolates poison messages so they stop blocking the main queue." },
    ],
    badge: { name: 'QUEUE COURIER', emoji: '📨' },
    sim: {
      game: 'visibilityQueue',
      label: 'WORK THE QUEUE',
      blurb: 'Receive, process and delete six messages before the clock runs out. One job never succeeds -- get it to the dead-letter queue.',
    },
  },

  sns: {
    id: 'sns', world: 'ops', name: 'AMAZON SNS', sub: 'Pub/Sub notifications', icon: '📢',
    briefing: [
      "Sometimes one event needs to reach many places at once.",
      "SNS is publish/subscribe: publish to a topic, every subscriber gets a copy.",
      "Subscribers can be queues, functions, HTTP endpoints, email or SMS.",
      "Pair it with SQS for the classic fan-out pattern.",
    ],
    metaphor: "A radio broadcast: transmit once, every tuned-in receiver hears it.",
    points: [
      "Publishers send to a TOPIC; SNS pushes the message to every current SUBSCRIPTION.",
      "Subscriber types: SQS, Lambda, HTTP/S, email, SMS, mobile push, and Kinesis Data Firehose.",
      "FAN-OUT: SNS topic -> multiple SQS queues, so each downstream service processes independently.",
      "MESSAGE FILTERING: subscriptions set filter policies so they receive only relevant messages.",
      "Standard topics (high throughput, best-effort order) or FIFO topics (ordered, dedup, pair with FIFO SQS).",
    ],
    deep: {
      works: [
        "SNS is push-based: on Publish it immediately delivers to each subscriber, retrying failed HTTP/S deliveries on a schedule and sending permanent failures to a subscription DLQ.",
        "Fan-out beats calling each service directly: the publisher doesn't know or care who's listening, and adding a consumer is just a new SQS subscription -- no publisher change.",
        "Filter policies are evaluated on message attributes (or body), so one topic can serve many consumers that each opt into a slice (e.g. eventType in ['order_paid']).",
      ],
      diagram:
        "                       +--> SQS: fulfilment  --> worker\n" +
        "  service --Publish--> [ SNS topic ] --+--> SQS: analytics  --> worker\n" +
        "                       +--> Lambda: fraud-check\n" +
        "                       +--> HTTPS: partner webhook\n" +
        "  (each subscription can have a filter policy + DLQ)",
      practice: [
        "Use SNS->SQS fan-out (not SNS->Lambda directly) when you need buffering, retries and replay per consumer.",
        "Always attach a subscription DLQ (redrive policy) for undeliverable messages.",
        "Use message filtering to keep one topic instead of many near-duplicate topics.",
        "For strict ordering across the fan-out, use FIFO topic + FIFO queues with matching group IDs.",
      ],
      gotchas: [
        "SNS->Lambda has no built-in buffer; a Lambda outage relies on SNS retries then DLQ -- SQS in between is safer.",
        "SNS message size is capped at 256 KB; unlike SNS, SQS now accepts native messages up to 1 MiB.",
        "SMS delivery involves carrier rules, spend limits and per-country pricing -- test early.",
      ],
      pricing:
        "Pay per million publishes + per delivery by protocol (SQS/Lambda cheap, SMS/email/mobile push more). " +
        "Generous free tier for publishes and SQS/Lambda/HTTP deliveries.",
      cli: "aws sns publish --topic-arn arn:aws:sns:...:orders --message '{\"orderId\":42,\"status\":\"paid\"}' \\\n  --message-attributes '{\"eventType\":{\"DataType\":\"String\",\"StringValue\":\"order_paid\"}}'",
    },
    quiz: [
      { q: "SNS delivery is best described as...",
        choices: ["Pull-based, one consumer wins each message", "Push-based, every subscriber gets a copy", "Batch nightly export", "Point-to-point only"],
        answer: 1, why: "SNS is pub/sub -- publish once, fan out a copy to every subscription. SQS is the pull-based one." },
      { q: "The classic 'fan-out' pattern is...",
        choices: ["SQS -> SNS -> SQS", "SNS topic -> multiple SQS queues", "Lambda -> Lambda -> Lambda", "S3 -> S3 replication"],
        answer: 1, why: "One publish reaches many SQS queues, each buffering work for an independent consumer." },
      { q: "What lets a subscription receive only a subset of a topic's messages?",
        choices: ["Visibility timeout", "A filter policy on message attributes", "A dead-letter queue", "Long polling"],
        answer: 1, why: "Filter policies match message attributes so consumers opt into relevant messages only." },
    ],
    badge: { name: 'BROADCAST HERALD', emoji: '📢' },
  },

  cloudformation: {
    id: 'cloudformation', world: 'ops', name: 'CLOUDFORMATION', sub: 'Infrastructure as Code', icon: '📐',
    briefing: [
      "Clicking through the console doesn't scale and can't be reviewed.",
      "CloudFormation describes your infrastructure as a template you commit to git.",
      "Deploy the template and it creates a STACK; update it and it computes the diff.",
      "Delete the stack and everything it made goes with it. Reproducible by design.",
    ],
    metaphor: "A LEGO instruction booklet: the same steps rebuild the exact same model every time.",
    points: [
      "A TEMPLATE (YAML/JSON) declares resources and their properties; deploying it creates a STACK.",
      "It is declarative and dependency-aware -- you say what you want, it orders the create/update/delete.",
      "CHANGE SETS preview exactly what an update will add, modify or replace before you run it.",
      "Rollback on failure, drift detection, nested stacks, and StackSets for multi-account/region rollout.",
      "The AWS CDK lets you write infrastructure in real languages that synthesise to CloudFormation.",
    ],
    deep: {
      works: [
        "On create/update, CloudFormation builds a dependency graph from Ref / Fn::GetAtt references and provisions resources in order, in parallel where possible. If a step fails, it rolls the stack back to the last known-good state.",
        "Some property changes update in place; others force a replacement (new resource, then delete old) -- change sets tell you which, so you don't accidentally recreate a database.",
        "Templates use parameters, mappings, conditions and outputs to stay reusable across environments; outputs can be exported and imported by other stacks.",
      ],
      diagram:
        "  template.yaml (in git)\n" +
        "     |  aws cloudformation deploy\n" +
        "     v\n" +
        "  [ Stack: prod-network ]  --creates/updates in dependency order-->\n" +
        "     VPC -> Subnets -> Route Tables -> NAT GW -> SG\n" +
        "  change set = dry-run diff   |   delete stack = remove all of it",
      practice: [
        "Keep templates in version control and deploy them through CI, not the console.",
        "Always review a change set before updating production; watch for 'Replacement: True' on stateful resources.",
        "Split by lifecycle/blast radius: network, data, app as separate stacks with exported outputs.",
        "Use CDK (or at least modules/nested stacks) to avoid thousand-line copy-paste templates.",
      ],
      gotchas: [
        "Manual console changes cause 'drift' -- the stack no longer matches the template; detect and reconcile.",
        "Deleting a stack can delete your database unless the resource has DeletionPolicy: Retain / Snapshot.",
        "A failed create rolls back and deletes everything by default -- disable rollback to debug, then clean up.",
      ],
      pricing:
        "CloudFormation and CDK are free; you pay only for the AWS resources the stack provisions. (CloudFormation " +
        "registry third-party resource handlers have a small per-operation charge.)",
      cli: "aws cloudformation deploy --template-file template.yaml --stack-name prod-network \\\n  --parameter-overrides Env=prod --capabilities CAPABILITY_IAM",
    },
    quiz: [
      { q: "What does a CloudFormation change set give you?",
        choices: ["A cost estimate only", "A preview of what an update will add, modify or replace", "A backup of the stack", "Faster deployments"],
        answer: 1, why: "Change sets are a dry run so you can catch risky replacements before applying." },
      { q: "Console edits to a CloudFormation-managed resource cause...",
        choices: ["An automatic template update", "Stack drift -- template and reality diverge", "Immediate rollback", "Nothing detectable"],
        answer: 1, why: "Out-of-band changes create drift; use drift detection and re-align via the template." },
      { q: "How do you stop 'delete stack' from destroying your production database?",
        choices: ["Nothing can prevent it", "Set DeletionPolicy: Retain or Snapshot on that resource", "Rename the stack", "Use JSON instead of YAML"],
        answer: 1, why: "DeletionPolicy controls whether a resource is kept or snapshotted when removed." },
    ],
    badge: { name: 'BLUEPRINT SAGE', emoji: '📐' },
  },

  eventbridge: {
    id: 'eventbridge', world: 'ops', name: 'AMAZON EVENTBRIDGE', sub: 'Serverless event bus', icon: '🔀',
    briefing: [
      "Services shouldn't have to know who cares about what they do.",
      "EventBridge is a bus: producers put events on it, rules route them to targets.",
      "AWS services, your apps, and SaaS partners all emit onto the same bus.",
      "Add a consumer by writing a rule -- the producer never changes.",
    ],
    metaphor: "A newsroom wire service: reporters file stories; each desk subscribes to the beats it covers.",
    points: [
      "An EVENT is JSON with source, detail-type and a detail object; it lands on an EVENT BUS (default, custom, or partner).",
      "RULES match events with an EVENT PATTERN (exact values, prefix, numeric, exists, anything-but) and fan out to up to 5 TARGETS each.",
      "Targets: Lambda, SQS, SNS, Step Functions, Kinesis, API destinations (any HTTP API), another bus, and more.",
      "SCHEDULER runs cron/rate schedules at scale (the successor to CloudWatch Events scheduled rules).",
      "PIPES does point-to-point source->filter->enrich->target; SCHEMA REGISTRY gives you typed code bindings for events.",
    ],
    deep: {
      works: [
        "On PutEvents, EventBridge evaluates every rule on that bus against the event. A rule whose pattern matches delivers the event (with at-least-once semantics) to each of its targets, retrying with backoff and sending permanent failures to a target dead-letter queue.",
        "Event patterns match structurally: each field you name must be present and the value must be in your allowed list or satisfy a content filter. Fields you omit are not constrained -- so a broad pattern matches a lot.",
        "It is push-based and near-real-time (typically sub-second), versus polling a queue. Use SQS between EventBridge and a fragile consumer when you need buffering or replay.",
      ],
      diagram:
        "  aws.s3 / your app / Datadog / Stripe\n" +
        "            |  PutEvents\n" +
        "        [ Event Bus ] --evaluate every rule-->\n" +
        "   rule A (source=aws.s3) --> Lambda, SQS\n" +
        "   rule B (detail.amount > 100) --> Step Functions\n" +
        "   rule C (prefix 'order_') --> SNS + API destination",
      practice: [
        "Use a custom bus per domain/bounded-context, not the default bus, so rules and permissions stay scoped.",
        "Make patterns as specific as the use case needs; over-broad rules invoke targets (and cost) you didn't intend.",
        "Attach a DLQ to every target and alarm on its depth; add SQS in front of brittle consumers for replay.",
        "Use EventBridge Scheduler (not a Lambda cron loop) for scheduled jobs; use Pipes for simple source-to-target plumbing.",
      ],
      gotchas: [
        "Delivery is at-least-once and unordered -- targets must be idempotent.",
        "256 KB event size limit; put large payloads in S3 and pass a pointer.",
        "A too-broad event pattern silently matches far more than you expect -- test with the sandbox / sample events.",
      ],
      pricing:
        "Custom/partner events are billed per million published (AWS-service events on the default bus are free to publish). " +
        "Schema discovery, Scheduler and Pipes have their own small per-use charges. No hourly fee.",
      cli: "aws events put-events --entries '[{\"Source\":\"app.orders\",\"DetailType\":\"order_paid\",\"Detail\":\"{\\\"id\\\":42}\"}]'",
    },
    quiz: [
      { q: "How does a new consumer start receiving events from a producer on EventBridge?",
        choices: ["The producer adds a subscription in its code", "You create a rule with an event pattern and a target -- the producer is untouched", "You redeploy the producer with a new SDK", "You poll the bus for messages"],
        answer: 1, why: "Producers just PutEvents; routing lives entirely in rules, so adding a consumer never changes the producer." },
      { q: "An event pattern only lists {\"source\":[\"aws.s3\"]}. Which events match?",
        choices: ["Only S3 'Object Created' events", "Every event from aws.s3, regardless of detail-type or bucket", "No events until you add a detail filter", "Only events you explicitly tag"],
        answer: 1, why: "Fields the pattern doesn't mention aren't filtered, so this matches all S3 events -- narrow it with more fields." },
      { q: "What must be true of an EventBridge target's processing?",
        choices: ["It must finish in 29 seconds", "It must be idempotent -- delivery is at-least-once and unordered", "It must be a Lambda function", "It must acknowledge each event synchronously"],
        answer: 1, why: "EventBridge can deliver an event more than once and out of order; handlers must tolerate that." },
    ],
    badge: { name: 'SIGNAL WEAVER', emoji: '🔀' },
    sim: {
      game: 'eventPattern',
      label: 'MATCH THE PATTERN',
      blurb: 'For each incoming event, decide whether the rule\'s event pattern matches it -- exact values, nested fields, prefix and numeric filters.',
    },
  },

  stepfunctions: {
    id: 'stepfunctions', world: 'ops', name: 'STEP FUNCTIONS', sub: 'Serverless workflows', icon: '🧩',
    briefing: [
      "Chaining Lambdas by hand means writing retries, timeouts and state tracking yourself.",
      "Step Functions is a managed state machine: you describe the steps, it runs them.",
      "It remembers where every execution is, retries failures, and shows a visual trace.",
      "Orchestration becomes configuration instead of glue code.",
    ],
    metaphor: "A board game track: each square says what to do and where to go next; the box keeps score.",
    points: [
      "A STATE MACHINE is JSON (Amazon States Language): states of type Task, Choice, Parallel, Map, Wait, Pass, Succeed, Fail.",
      "TASK states can call Lambda, ECS, SNS, SQS, DynamoDB, another state machine, and 220+ AWS services through optimized or AWS SDK integrations.",
      "Built-in RETRY and CATCH per state handle transient errors and route failures without custom code.",
      "STANDARD workflows: durable, auditable, up to 1 year, exactly-once. EXPRESS: high-volume, up to 5 min, cheap, at-least-once.",
      "MAP state fans out over a collection (inline or distributed for massive parallelism over S3 data).",
    ],
    deep: {
      works: [
        "Each state does its work then follows its 'Next' pointer (or a Choice picks a branch) until a terminal Succeed/Fail. Step Functions persists the state, input and output at every transition, so an execution can run for months and you can inspect exactly where it is.",
        "Retry is declarative: list error names, an interval, backoff rate and max attempts. Catch routes a still-failing state to a fallback state instead of failing the whole execution.",
        "'.sync' integrations make a Task wait for a long-running job (an ECS task, a Glue job) to finish; the callback pattern (waitForTaskToken) pauses until an external system calls back with success/failure.",
      ],
      diagram:
        "  Start\n" +
        "   -> Task: ValidateOrder\n" +
        "   -> Choice: valid?  --no--> Fail\n" +
        "        | yes\n" +
        "   -> Task: ReserveInventory   (Retry x3, Catch -> Compensate)\n" +
        "   -> Parallel: [ ChargeCard ] [ SendEmail ]\n" +
        "   -> Task: MarkComplete  -> Succeed",
      practice: [
        "Use Standard for business-critical, long-running or auditable flows; Express for high-frequency short event processing.",
        "Push retries/timeouts/catches into the state machine and keep Lambdas small and single-purpose.",
        "Model the failure paths explicitly (Catch -> compensation states) -- the happy path is the easy half.",
        "Use direct service integrations (DynamoDB, SNS, SQS) instead of a Lambda that just forwards a call.",
      ],
      gotchas: [
        "Standard workflow state transitions are billed per transition -- a chatty loop over thousands of items gets expensive; consider Express or a Map state.",
        "The 256 KB limit on state input/output -- pass S3 pointers for big payloads, not the data itself.",
        "Express workflows are at-least-once and only give you full history via CloudWatch Logs -- design idempotent steps.",
      ],
      pricing:
        "Standard: pay per state transition (first 4,000/month free). Express: pay per request + duration/memory (GB-second), " +
        "much cheaper at volume. You also pay for whatever the tasks themselves invoke.",
      cli: "aws stepfunctions start-execution --state-machine-arn arn:aws:states:...:stateMachine:orders --input '{\"orderId\":42}'",
    },
    quiz: [
      { q: "Where do retries, timeouts and error handling live in a Step Functions workflow?",
        choices: ["In each Lambda's own code", "Declaratively in the state machine (Retry / Catch per state)", "In an SQS redrive policy", "You cannot retry a failed state"],
        answer: 1, why: "Retry and Catch are configured per state in the definition, so the orchestration handles failure, not your functions." },
      { q: "You need to process 20 million short events per day as cheaply as possible. Which workflow type?",
        choices: ["Standard", "Express", "Neither -- use raw Lambda", "Standard with a Map state"],
        answer: 1, why: "Express workflows are priced for high volume (per request + duration) and run up to 5 minutes; Standard bills per transition." },
      { q: "Why choose a direct DynamoDB service integration over a Lambda that just calls DynamoDB?",
        choices: ["Lambdas can't call DynamoDB", "Less code, no cold starts, and one fewer thing to run and pay for", "It bypasses IAM", "It makes the workflow synchronous"],
        answer: 1, why: "Step Functions can call 220+ AWS services and thousands of API actions directly; a passthrough Lambda is pure overhead." },
    ],
    badge: { name: 'FLOW ARCHITECT', emoji: '🧩' },
    sim: {
      game: 'stateOrder',
      label: 'BUILD THE STATE MACHINE',
      blurb: 'Put the states of an order-processing workflow in the order they run -- Task, Choice, Parallel, join, terminal.',
    },
  },
};

/* world -> ordered concept ids (also defines unlock order within a world) */
const WORLD_CONCEPTS = {
  compute:  ['ec2', 'lambda', 'autoscaling', 'containers'],
  storage:  ['s3', 'ebs', 'storageclasses', 'efs'],
  network:  ['vpc', 'elb', 'route53', 'cloudfront', 'apigateway'],
  data:     ['rds', 'dynamodb', 'aurora', 'elasticache'],
  security: ['iam', 'kms', 'secretsmanager', 'cognito'],
  ops:      ['cloudwatch', 'cloudtrail', 'sqs', 'sns', 'cloudformation', 'eventbridge', 'stepfunctions'],
};

/* flat progression order across the whole game */
const PROGRESSION = [
  ...WORLD_CONCEPTS.compute,
  ...WORLD_CONCEPTS.storage,
  ...WORLD_CONCEPTS.network,
  ...WORLD_CONCEPTS.data,
  ...WORLD_CONCEPTS.security,
  ...WORLD_CONCEPTS.ops,
];

window.AWSQUEST_CONTENT = { WORLDS, CONCEPTS, WORLD_CONCEPTS, PROGRESSION };
