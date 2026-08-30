import type { Concept } from '../../types';

export const cognito: Concept = {
  id: 'cognito',
  world: 'security',
  name: 'AMAZON COGNITO',
  sub: 'User sign-up & sign-in',
  icon: '👤',
  briefing: [
    "IAM secures your team's access to AWS. Your app's end users need something else.",
    "Cognito handles sign-up, sign-in, MFA and social login for your application's users.",
    'User Pools give you a user directory and standard tokens.',
    'Identity Pools swap those tokens for temporary AWS credentials when the app needs them.',
  ],
  metaphor:
    "The front-desk registration book for your app's visitors -- separate from the staff keycards (IAM).",
  points: [
    'USER POOL: a managed user directory -- registration, login, password reset, MFA, hosted UI, verified email/phone.',
    'It issues standard OAuth 2.0 / OIDC tokens (ID, access, refresh) your backend validates.',
    'Federation: let users sign in with Google, Apple, Facebook, or corporate SAML/OIDC.',
    'IDENTITY POOL (federated identities): exchange a verified token for scoped, temporary IAM credentials.',
    'Use a User Pool for authentication; add an Identity Pool only if the client must call AWS directly.',
  ],
  deep: {
    works: [
      'Login flow: client authenticates against the User Pool (SRP or Managed Login / classic hosted UI) -> receives signed JWTs -> sends the access token in the Authorization header -> API Gateway or your code validates its signature and claims (issuer, token use, client ID, expiry, scopes/groups).',
      'If a browser/mobile client needs to put a file in S3 directly, it passes the User Pool token to an Identity Pool, which calls STS and returns temporary credentials mapped to an IAM role (optionally per group / per claim).',
      'Cognito groups can carry an IAM role and appear as a claim, enabling simple role-based access in your app and in Identity Pool credential mapping.',
    ],
    diagram:
      '  user --sign in--> [ User Pool ] --JWT (ID/access/refresh)--> app\n' +
      '  app --access token--> API Gateway (JWT authorizer) --> Lambda\n' +
      '  app --token--> [ Identity Pool ] --STS--> temp AWS creds --> S3/etc',
    practice: [
      "Validate every JWT's signature, issuer, expiry, token_use, and intended app client (aud on ID tokens; client_id on access tokens); don't trust unverified claims.",
      'Keep access-token lifetime short; use the refresh token to renew.',
      'Use the hosted UI + federation to avoid building password and social-login flows yourself.',
      'Only add an Identity Pool when a client genuinely needs direct AWS access; otherwise proxy through your API.',
    ],
    gotchas: [
      'User Pool vs Identity Pool confusion is the classic trap -- authentication vs AWS credential vending.',
      'Some advanced features (advanced security, large MAUs) raise the price meaningfully.',
      'Migrating an existing user base needs the migration Lambda trigger or a bulk import with reset.',
    ],
    pricing:
      'User Pools are billed per Monthly Active User under Lite, Essentials, or Plus tiers. Free allowances differ for direct/social sign-in and SAML/OIDC federation; check current regional pricing. Identity Pool credential vending has no additional charge, though services used with the credentials may charge.',
    cli: 'aws cognito-idp admin-create-user --user-pool-id us-east-1_abc123 --username alice',
  },
  quiz: [
    {
      q: 'Which Cognito component is a user directory that issues JWT tokens?',
      choices: ['Identity Pool', 'User Pool', 'IAM role', 'STS'],
      answer: 1,
      why: 'User Pools handle authentication and issue ID/access/refresh tokens.',
    },
    {
      q: 'You want a mobile app to upload directly to S3 as the signed-in user. You need...',
      choices: [
        'Only a User Pool',
        'A User Pool token exchanged via an Identity Pool for temporary AWS credentials',
        'The app to embed an IAM access key',
        'A public S3 bucket',
      ],
      answer: 1,
      why: 'Identity Pools trade a verified token for scoped, temporary STS credentials.',
    },
    {
      q: "IAM vs Cognito -- which secures your APPLICATION'S END USERS?",
      choices: ['IAM', 'Cognito', 'Both do the same job', 'Neither -- use API keys'],
      answer: 1,
      why: "IAM is for AWS account/workload access; Cognito is for your app's user identities.",
    },
  ],
  badge: { name: 'IDENTITY WARDEN', emoji: '👤' },
};
