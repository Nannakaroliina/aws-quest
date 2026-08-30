import type { Concept } from '../../types';

export const elasticache: Concept = {
  id: 'elasticache',
  world: 'data',
  name: 'AMAZON ELASTICACHE',
  sub: 'In-memory data store',
  icon: '⚡',
  briefing: [
    'Databases are fast. Memory is faster -- by a hundredfold.',
    'ElastiCache runs managed Redis (Valkey) or Memcached clusters for you.',
    'Put a cache in front of your database and reads get sub-millisecond.',
    'Also great for sessions, leaderboards, rate limits and queues.',
  ],
  metaphor: 'A sticky note on your monitor instead of walking to the filing cabinet every time.',
  points: [
    'Managed in-memory clusters: Redis / Valkey (rich data types, persistence, replication) or Memcached (simple, multi-threaded).',
    'CACHE-ASIDE is the common pattern: app checks cache, on miss reads DB and populates the cache with a TTL.',
    'Redis supports replicas, automatic failover (Multi-AZ), cluster-mode sharding, pub/sub and sorted sets.',
    'Memcached just shards key/value data across nodes -- no persistence, no replication.',
    'Serverless option: pay per GB-hour and requests, no node sizing.',
  ],
  deep: {
    works: [
      'In cache-aside, a miss costs one DB read plus a cache write; subsequent reads are served from RAM until the TTL expires or the key is invalidated on update. Choosing TTLs and invalidation rules is the real work.',
      'Redis cluster mode splits the keyspace into 16,384 hash slots across shards; each shard has a primary + replicas. A primary failure promotes a replica automatically.',
      'Sorted sets make leaderboards O(log n); atomic INCR + EXPIRE make rate limiting trivial; Redis Streams / lists back lightweight job queues.',
    ],
    diagram:
      '  app --GET user:42--> [ ElastiCache Redis ]\n' +
      '        hit  -> return from RAM (<1 ms)\n' +
      '        miss -> read RDS --> SET user:42 EX 300 --> return\n' +
      '  cluster mode: shard1(pri+rep) shard2(pri+rep) ...',
    practice: [
      'Use Redis when you need failover, persistence or data structures; Memcached only for a plain, poolable object cache.',
      'Always set TTLs; design explicit invalidation on writes for data that must be fresh.',
      'Enable Multi-AZ with automatic failover and encryption in transit/at rest for production Redis.',
      'Watch eviction metrics and memory pressure; size for working set + headroom.',
    ],
    gotchas: [
      'A cache is not a database -- treat its contents as disposable and handle cold-cache load (thundering herd).',
      'Big keys / hot keys concentrate load on one shard.',
      "Memcached has no persistence or replication; a node loss drops that shard's data.",
    ],
    pricing:
      'Node-based: pay per node-hour by type + data transfer. Serverless: pay per GB-hour stored and per ' +
      'million ElastiCache Processing Units (requests). Reserved nodes cut node cost.',
    cli: 'aws elasticache create-replication-group --replication-group-id sess \\\n  --engine redis --cache-node-type cache.r7g.large --num-node-groups 2 --replicas-per-node-group 1',
  },
  quiz: [
    {
      q: 'In the cache-aside pattern, what happens on a cache miss?',
      choices: [
        'The request fails',
        'App reads the database, then writes the value into the cache with a TTL',
        'The cache reboots',
        'The DB is bypassed permanently',
      ],
      answer: 1,
      why: 'Miss -> load from source of truth -> populate cache -> serve; later reads hit RAM.',
    },
    {
      q: 'You need automatic failover and pub/sub. Which engine?',
      choices: ['Memcached', 'Redis / Valkey', 'Neither supports failover', 'Both are identical'],
      answer: 1,
      why: 'Redis offers replication, Multi-AZ failover, persistence and data structures; Memcached does not.',
    },
    {
      q: 'Which is a safe assumption about cached data?',
      choices: [
        'It is durable like a database',
        'It can disappear and must be rebuildable from the source',
        'It never expires',
        'It is automatically consistent with the DB',
      ],
      answer: 1,
      why: 'Caches are volatile; design for misses, eviction and cold starts.',
    },
  ],
  badge: { name: 'MEMORY MAGE', emoji: '⚡' },
};
