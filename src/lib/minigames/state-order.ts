// @ts-nocheck -- transitional: imperative DOM code ported verbatim from the
// pre-SvelteKit src/minigames.js. Typed when rebuilt as Svelte components.
import { makeOrder } from './make-order';

export const stateOrder = makeOrder({
  controls: '↑ ↓ pick state  ·  ENTER place',
  winLine:
    'A Step Functions workflow is an explicit state machine: each state’s Next defines the order, a Choice branches, a Parallel forks and joins, and Catch/Retry handle failure — all in the state machine, not your code.',
  steps: [
    {
      t: 'Task: ValidateOrder (Lambda)',
      tip: 'The first state runs against the input passed to StartExecution.',
    },
    {
      t: 'Choice: is the order valid?',
      tip: 'A Choice state branches on the previous result — valid vs invalid.',
    },
    { t: 'Task: ReserveInventory', tip: 'Only reached on the “valid” branch of the Choice.' },
    {
      t: 'Parallel: charge card + send confirmation email',
      tip: 'A Parallel state runs both branches concurrently and waits for all of them.',
    },
    { t: 'Task: MarkOrderComplete', tip: 'Runs after the Parallel state joins its branches.' },
    {
      t: 'Succeed',
      tip: 'A terminal state. The invalid branch would instead end at a Fail state.',
    },
  ],
});
