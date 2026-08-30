// @ts-nocheck -- transitional: imperative DOM code ported verbatim from the
// pre-SvelteKit src/minigames.js. Typed when rebuilt as Svelte components.
import { makeQuiz } from './make-quiz';

export const eventPattern = makeQuiz({
  controls: '↑ ↓ verdict  ·  ENTER decide',
  winAt: 4,
  winLine:
    'An event pattern matches only if EVERY field it names is present and the event’s value is in the allowed list (or satisfies the matcher: prefix, numeric, exists, anything-but). Fields the pattern omits are not filtered at all.',
  loseLine:
    'Read the pattern field by field: each key must be present in the event, and the value must be in the list or pass the matcher. Nested keys count too.',
  rounds: [
    {
      prompt:
        'Event: source "aws.s3", detail-type "Object Created", bucket "app-uploads". Does it match?',
      extra: '{ "source": ["aws.s3"], "detail-type": ["Object Created"] }',
      choices: ['MATCHES', 'does NOT match'],
      answer: 0,
      why: 'Every field named in the pattern is present and its value is in the allowed list. The extra "bucket" field is simply ignored.',
    },
    {
      prompt: 'Event: source "aws.s3", detail-type "Object Deleted". Does it match?',
      extra: '{ "source": ["aws.s3"], "detail-type": ["Object Created"] }',
      choices: ['MATCHES', 'does NOT match'],
      answer: 1,
      why: 'detail-type must be one of the listed values. "Object Deleted" is not "Object Created", so the rule does not fire.',
    },
    {
      prompt: 'Event: source "aws.ec2", detail.state = "running". Does it match?',
      extra: '{ "source": ["aws.ec2"], "detail": { "state": ["stopped", "terminated"] } }',
      choices: ['MATCHES', 'does NOT match'],
      answer: 1,
      why: 'Nested fields are matched too. "running" is not in [stopped, terminated].',
    },
    {
      prompt: 'Event: source "aws.autoscaling". Does it match?',
      extra: '{ "source": [ { "prefix": "aws." } ] }',
      choices: ['MATCHES', 'does NOT match'],
      answer: 0,
      why: 'The prefix content-filter matches any source string that starts with "aws.".',
    },
    {
      prompt: 'Event: detail.amount = 250. Does it match?',
      extra: '{ "detail": { "amount": [ { "numeric": [ ">", 100 ] } ] } }',
      choices: ['MATCHES', 'does NOT match'],
      answer: 0,
      why: 'The numeric matcher evaluates 250 > 100 → true.',
    },
    {
      prompt:
        'Event: source "aws.s3", bucket "some-other-teams-bucket". You only care about your bucket. Does the rule match?',
      extra: '{ "source": ["aws.s3"] }',
      choices: ['MATCHES', 'does NOT match'],
      answer: 0,
      why: 'The pattern only filters on source, so it matches EVERY S3 event. To narrow it you would add a detail filter on the bucket name.',
    },
  ],
});
