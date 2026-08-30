// @ts-nocheck -- transitional: imperative DOM code ported verbatim from the
// pre-SvelteKit src/minigames.js. Typed when rebuilt as Svelte components.
import { makeQuiz } from './make-quiz';
import { barChart } from './helpers';

export const hotPartition = makeQuiz({
  controls: '↑ ↓ pick a key  ·  ENTER commit',
  winAt: 2,
  winLine:
    'Throughput scales with the number of DISTINCT, evenly-used partition-key values. Low-cardinality keys (status, type), time-based keys, or a single whale value all pile onto one partition and throttle — even when total table capacity looks fine.',
  loseLine:
    'The partition key is hashed to choose a partition. You want lots of values, hit evenly. Add a second dimension when one value dominates.',
  afterPick(r, picked, fb) {
    const vals = r._bars[picked];
    const hot = vals.some((v) => v > 90);
    fb.insertAdjacentHTML(
      'afterbegin',
      `<div class="small">write load across 8 partitions with that key:</div>${barChart(vals)}` +
        (hot
          ? '<div class="explain bad">🔥 Hot partition — this key throttles under load.</div>'
          : '<div class="explain"><b class="c-green">Even spread</b> — no throttling.</div>'),
    );
  },
  rounds: [
    {
      prompt: 'Table: user clickstream events, ~50M writes/day. Choose the partition key.',
      choices: [
        'eventType  (click / view / scroll / hover)',
        'userId  (millions of distinct values)',
        'eventDate  (today’s date)',
      ],
      _bars: [
        [96, 90, 5, 3, 2, 0, 0, 0],
        [58, 62, 55, 60, 57, 59, 61, 54],
        [99, 0, 0, 0, 0, 0, 0, 0],
      ],
      answer: 1,
      why: 'userId is high-cardinality and accessed evenly, so writes spread across every partition. eventType has ~4 values; eventDate funnels an entire day onto one partition.',
    },
    {
      prompt: 'Table: telemetry from 100,000 IoT devices. Choose the partition key.',
      choices: [
        'sensorStatus  (OK / WARN / FAIL)',
        'deviceId  (one per device)',
        'readingHour  (0–23)',
      ],
      _bars: [
        [93, 68, 28, 0, 0, 0, 0, 0],
        [55, 60, 58, 52, 61, 57, 59, 56],
        [88, 10, 8, 6, 4, 3, 2, 2],
      ],
      answer: 1,
      why: 'deviceId scales with the fleet and spreads load. Status has 3 values; the current hour becomes a hotspot for every device at once.',
    },
    {
      prompt: 'Multi-tenant SaaS. One tenant drives 60% of all traffic. Choose the partition key.',
      choices: ['tenantId', 'tenantId#itemId  (composite)', 'region  (us / eu / ap)'],
      _bars: [
        [99, 40, 20, 10, 5, 3, 2, 1],
        [57, 59, 58, 60, 56, 61, 55, 58],
        [82, 60, 24, 0, 0, 0, 0, 0],
      ],
      answer: 1,
      why: 'When one value dominates, add a second dimension. tenantId#itemId splits even the whale tenant across many partitions; plain tenantId saturates one.',
    },
  ],
});
