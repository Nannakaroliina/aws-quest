import type { Concept } from '../../types';

export const s3: Concept = {
  id: 's3',
  world: 'storage',
  name: 'AMAZON S3',
  sub: 'Simple Storage Service',
  icon: '🪣',
  briefing: [
    'S3 stores objects -- files with metadata -- inside buckets.',
    'It is effectively infinite, designed for eleven nines of durability, and reachable over HTTPS.',
    'It underpins half of AWS: data lakes, backups, static sites, logs, ML datasets.',
    'No file system, no servers. Just PUT, GET, and a key.',
  ],
  metaphor:
    'An infinite coat-check: hand over any item, get a ticket (the key), retrieve it later from anywhere.',
  points: [
    "An OBJECT = data + key (its name) + metadata. Buckets hold objects in a flat namespace ('folders' are just key prefixes).",
    'Bucket names are globally unique. Data lives in one region unless you set up replication.',
    'Durability is 99.999999999% (11 nines); objects are spread across multiple devices and AZs.',
    'Max object size 5 TB (use multipart upload above 100 MB / required above 5 GB).',
    'Access is DENY by default: Block Public Access, bucket policies, IAM, and pre-signed URLs control it.',
  ],
  deep: {
    works: [
      'Every write is stored redundantly across at least 3 AZs before S3 acknowledges it. Reads are strongly consistent -- a successful PUT is immediately visible to a subsequent GET.',
      "Versioning keeps every overwrite/delete as a distinct version so you can roll back or recover from ransomware/accidents. A delete just adds a 'delete marker'.",
      'Lifecycle rules transition objects between storage classes or expire them on age. Event notifications (to Lambda/SQS/SNS/EventBridge) let you react to uploads.',
    ],
    diagram:
      '  Client --HTTPS PUT--> [ Bucket: my-app-data ]\n' +
      '                           key: uploads/2026/img.png\n' +
      '                           replicated across AZ-a / AZ-b / AZ-c\n' +
      '     on PUT --> event --> Lambda (make thumbnail) --> writes back to bucket',
    practice: [
      'Keep Block Public Access ON; serve public content via CloudFront with Origin Access Control.',
      'Turn on versioning + a lifecycle rule to expire old versions, so mistakes are recoverable but not costly forever.',
      'Use pre-signed URLs to give a browser temporary, scoped upload/download rights without credentials.',
      'Enable default encryption (SSE-S3 or SSE-KMS) and access logging / CloudTrail data events for audit.',
    ],
    gotchas: [
      "'Folders' aren't real -- listing millions of keys under a prefix can be slow and costs per request.",
      'Cross-region data transfer and lots of small GETs add up; front with a CDN and batch where you can.',
      'A public bucket policy overrides object ACLs -- always check Block Public Access at the account level too.',
    ],
    pricing:
      'Pay for GB stored per month (by storage class), per-1000 request charges, and data transfer OUT to the internet. ' +
      'Transfer IN is free; transfer to CloudFront is free.',
    cli: 'aws s3 cp ./build s3://my-site/ --recursive\naws s3 presign s3://my-bucket/report.pdf --expires-in 3600',
  },
  quiz: [
    {
      q: 'S3 stores data as...',
      choices: [
        'Blocks attached to an instance',
        'Objects (data + key + metadata) in buckets',
        'Rows in tables',
        'Files on a mounted NFS share',
      ],
      answer: 1,
      why: 'S3 is object storage; EBS is block storage; EFS is file storage.',
    },
    {
      q: 'By default, a brand-new S3 bucket is...',
      choices: [
        'Public to the world',
        'Private -- access must be explicitly granted',
        'Readable by any AWS account',
        'Deleted after 30 days',
      ],
      answer: 1,
      why: 'Everything is denied unless a policy/IAM/pre-signed URL allows it, and Block Public Access is on.',
    },
    {
      q: 'Which feature lets you recover an object after an accidental overwrite?',
      choices: ['Transfer Acceleration', 'Versioning', 'Requester Pays', 'Multipart upload'],
      answer: 1,
      why: 'Versioning retains prior versions and turns deletes into recoverable delete markers.',
    },
  ],
  badge: { name: 'BUCKET BEARER', emoji: '🪣' },
};
