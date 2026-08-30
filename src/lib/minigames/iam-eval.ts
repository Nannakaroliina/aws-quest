// @ts-nocheck -- transitional: imperative DOM code ported verbatim from the
// pre-SvelteKit src/minigames.js. Typed when rebuilt as Svelte components.
import { makeQuiz } from './make-quiz';

export const iamEval = makeQuiz({
  controls: '↑ ↓ verdict  ·  ENTER decide',
  winAt: 4,
  winLine:
    'Evaluation order: any explicit Deny (identity, resource, SCP, boundary) → DENY. Otherwise you need an Allow that survives every scope — identity ∩ permission boundary ∩ SCP. No Allow at all → implicit deny.',
  loseLine:
    'Walk it every time: explicit Deny anywhere? then is it Allowed in identity AND boundary AND SCP? no Allow = deny by default.',
  rounds: [
    {
      prompt:
        'Role has an identity policy allowing s3:GetObject on the bucket. No SCP or permission boundary restricts it. Request: GetObject.',
      choices: ['ALLOW', 'DENY'],
      answer: 0,
      why: 'Allowed in the identity policy, nothing denies it, no scope removes it → allow.',
    },
    {
      prompt:
        'Identity policy allows ec2:*. An SCP on the account explicitly denies ec2:TerminateInstances. Request: TerminateInstances.',
      choices: ['ALLOW', 'DENY'],
      answer: 1,
      why: 'An explicit Deny — here in an SCP — overrides any Allow, no matter how broad.',
    },
    {
      prompt:
        'No identity policy grants dynamodb:PutItem. There is no explicit Deny anywhere. Request: PutItem.',
      choices: ['ALLOW', 'DENY'],
      answer: 1,
      why: 'No explicit Allow means implicit deny. Access has to be granted; silence is “no”.',
    },
    {
      prompt:
        'Identity policy allows lambda:InvokeFunction. The role’s permission boundary only allows s3:* and dynamodb:*. Request: InvokeFunction.',
      choices: ['ALLOW', 'DENY'],
      answer: 1,
      why: 'Effective permissions are the INTERSECTION of the identity policy and the boundary. lambda:* is not in the boundary, so it is denied.',
    },
    {
      prompt:
        'Same account: the bucket’s resource policy allows this role to GetObject. The identity policy is silent. No Deny anywhere. Request: GetObject.',
      choices: ['ALLOW', 'DENY'],
      answer: 0,
      why: 'Within one account, an Allow in EITHER the identity policy or the resource policy is enough (cross-account needs both).',
    },
    {
      prompt:
        'Identity policy allows s3:*. The bucket policy has an explicit Deny for this principal. Request: GetObject.',
      choices: ['ALLOW', 'DENY'],
      answer: 1,
      why: 'Explicit Deny in the resource policy wins over the identity Allow — explicit Deny always wins.',
    },
  ],
});
