import type { Concept } from '../../types';

export const apigateway: Concept = {
  id: 'apigateway',
  world: 'network',
  name: 'API GATEWAY',
  sub: 'Managed API front door',
  icon: '🚪',
  briefing: [
    'Your functions and services need a public, secured HTTP front door.',
    'API Gateway is that door -- it terminates TLS, checks auth, throttles, and routes.',
    'You define routes; it invokes Lambda, an HTTP backend, or an AWS service.',
    "It absorbs the boilerplate every API needs so your code doesn't have to.",
  ],
  metaphor:
    'A hotel concierge desk: checks your ID, enforces the house rules, then sends you to the right room.',
  points: [
    'REST API (feature-rich: request validation, API keys, WAF, private endpoints) vs HTTP API (cheaper, faster, JWT auth, ~70% less cost).',
    'AUTHORIZERS gate requests: IAM, Amazon Cognito, or a Lambda authorizer returning an allow/deny policy.',
    'USAGE PLANS + API KEYS meter and throttle callers; account-level and per-route rate + burst limits protect the backend.',
    'STAGES (dev/prod) are deployable snapshots, each with its own variables, throttling and logging.',
    'Integrations: Lambda proxy, any HTTP endpoint, or direct AWS service calls; responses can be cached per stage.',
  ],
  deep: {
    works: [
      'A request hits the Gateway edge: it matches a route, runs the authorizer (result cached by token for a few minutes), validates the request, then calls the integration. With Lambda proxy integration the whole HTTP request is passed as an event and your function returns statusCode/headers/body.',
      'Throttling is a token bucket: a steady rate plus a burst allowance. Exceed it and callers get HTTP 429. Limits stack -- account, stage, method, and per-key via usage plans.',
      'HTTP APIs are the newer, leaner option (native JWT authorizers, lower latency, lower price). Reach for REST APIs when you need request/response validation models, API keys without Lambda, private APIs via VPC endpoints, or AWS WAF.',
    ],
    diagram:
      '  client --HTTPS--> [ API Gateway ]\n' +
      '                       |  1. match route  /orders/{id}\n' +
      '                       |  2. authorizer (Cognito / Lambda / IAM)\n' +
      '                       |  3. throttle + validate\n' +
      '                       v\n' +
      '        Lambda  |  HTTP backend  |  AWS service  (+ optional cache)',
    practice: [
      'Default to HTTP API; move to REST API only for a feature it uniquely offers.',
      "Put real auth on every route (Cognito or a Lambda authorizer) -- never ship an open API 'for now'.",
      "Set conservative throttle + burst limits and per-client usage plans so one caller can't starve the rest.",
      'Enable access logs + execution logs to CloudWatch and turn on X-Ray tracing for latency breakdowns.',
    ],
    gotchas: [
      'HTTP APIs have a fixed 30-second integration timeout. REST APIs default to 29 seconds; Regional/private REST APIs can request a higher quota, but long jobs are usually safer as async work.',
      'Lambda proxy integration makes Gateway a passthrough: all request shaping now lives in your function.',
      "Forgetting to redeploy the stage after a change -- the console edit isn't live until you deploy.",
    ],
    pricing:
      'Pay per million API calls (HTTP API roughly a third the price of REST API), plus data transfer out, ' +
      'plus optional per-stage cache (per GB-hour). No idle/hourly charge.',
    cli: 'aws apigatewayv2 create-api --name orders --protocol-type HTTP --target arn:aws:lambda:...:function:orders',
  },
  quiz: [
    {
      q: 'Your API needs the lowest cost and latency with built-in JWT auth, and no need for request-model validation. Which type?',
      choices: ['REST API', 'HTTP API', 'WebSocket API', 'Classic API'],
      answer: 1,
      why: 'HTTP APIs are cheaper and faster with native JWT authorizers; REST APIs add validation models, API keys without Lambda, private endpoints and WAF.',
    },
    {
      q: 'A client is hammering one route and degrading everyone else. What in API Gateway fixes this?',
      choices: [
        'A longer integration timeout',
        'Usage plans with per-API-key rate and burst limits',
        'A bigger Lambda',
        'Disabling the authorizer',
      ],
      answer: 1,
      why: 'Usage plans + API keys meter and throttle each caller independently; per-method and stage limits back-stop it.',
    },
    {
      q: 'An HTTP API request needs 90 seconds of backend work. What should you do?',
      choices: [
        'Keep the synchronous request open',
        'Return 202 immediately and process async via a queue or Step Functions',
        'Retry until it fits in 30s',
        'Disable throttling',
      ],
      answer: 1,
      why: 'HTTP API integrations have a fixed 30-second timeout; acknowledge the request and process long work asynchronously.',
    },
  ],
  badge: { name: 'GATEKEEPER', emoji: '🚪' },
};
