import type { Concept } from '../types';

import { ec2 } from './compute/ec2';
import { lambda } from './compute/lambda';
import { autoscaling } from './compute/autoscaling';
import { containers } from './compute/containers';
import { s3 } from './storage/s3';
import { ebs } from './storage/ebs';
import { storageclasses } from './storage/storageclasses';
import { efs } from './storage/efs';
import { vpc } from './network/vpc';
import { elb } from './network/elb';
import { route53 } from './network/route53';
import { cloudfront } from './network/cloudfront';
import { apigateway } from './network/apigateway';
import { rds } from './data/rds';
import { dynamodb } from './data/dynamodb';
import { aurora } from './data/aurora';
import { elasticache } from './data/elasticache';
import { iam } from './security/iam';
import { kms } from './security/kms';
import { secretsmanager } from './security/secretsmanager';
import { cognito } from './security/cognito';
import { cloudwatch } from './ops/cloudwatch';
import { cloudtrail } from './ops/cloudtrail';
import { sqs } from './ops/sqs';
import { sns } from './ops/sns';
import { cloudformation } from './ops/cloudformation';
import { eventbridge } from './ops/eventbridge';
import { stepfunctions } from './ops/stepfunctions';

export const CONCEPTS: Record<string, Concept> = {
  ec2,
  lambda,
  autoscaling,
  containers,
  s3,
  ebs,
  storageclasses,
  efs,
  vpc,
  elb,
  route53,
  cloudfront,
  apigateway,
  rds,
  dynamodb,
  aurora,
  elasticache,
  iam,
  kms,
  secretsmanager,
  cognito,
  cloudwatch,
  cloudtrail,
  sqs,
  sns,
  cloudformation,
  eventbridge,
  stepfunctions,
};
