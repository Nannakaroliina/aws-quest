import type { MinigameFactory } from './types';
import { autoscale } from './autoscale';
import { visibilityQueue } from './visibility-queue';
import { storageTiers } from './storage-tiers';
import { subnetRouter } from './subnet-router';
import { loadBalancer } from './load-balancer';
import { iamEval } from './iam-eval';
import { hotPartition } from './hot-partition';
import { envelopeCrypto } from './envelope-crypto';
import { stateOrder } from './state-order';
import { eventPattern } from './event-pattern';

/** Every "inside the topic" sim, keyed by the id a concept's `sim.game` names. */
export const MINIGAMES: Record<string, MinigameFactory> = {
  autoscale,
  visibilityQueue,
  storageTiers,
  subnetRouter,
  loadBalancer,
  iamEval,
  hotPartition,
  envelopeCrypto,
  stateOrder,
  eventPattern,
};
