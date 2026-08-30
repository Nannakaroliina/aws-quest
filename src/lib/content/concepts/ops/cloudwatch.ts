import type { Concept } from '../../types';

export const cloudwatch: Concept = {
  id: 'cloudwatch',
  world: 'ops',
  name: 'AMAZON CLOUDWATCH',
  sub: 'Metrics, logs, alarms',
  icon: '📊',
  briefing: [
    "You can't operate what you can't see.",
    'CloudWatch collects metrics, logs and events from across AWS and your apps.',
    'Alarms watch a metric and fire actions when it crosses a line.',
    'Dashboards and Logs Insights turn the raw stream into answers.',
  ],
  metaphor: 'The instrument panel and black box recorder for your whole cloud.',
  points: [
    'METRICS are time series in namespaces with dimensions (e.g. AWS/EC2 CPUUtilization by InstanceId).',
    'ALARMS evaluate a metric over N periods and go OK / ALARM / INSUFFICIENT_DATA, triggering SNS, Auto Scaling or EC2 actions.',
    'LOGS: agents/services push to log groups; query with Logs Insights; set retention per group.',
    'DASHBOARDS visualise metrics and logs; composite alarms combine conditions to cut noise.',
    'Custom metrics via PutMetricData or the Embedded Metric Format from your application.',
  ],
  deep: {
    works: [
      'Most AWS services publish basic metrics free at 5-minute (or 1-minute) granularity. You add custom/high-resolution metrics from code. Metrics are retained with decreasing granularity for 15 months.',
      "An alarm is: metric + statistic + period + threshold + 'datapoints to alarm'. It's a state machine -- transitions (not every evaluation) invoke actions, so an SNS topic gets one message per state change.",
      "Logs Insights runs a purpose-built query language over log groups ('fields @timestamp, @message | filter status>=500 | stats count() by bin(5m)') for ad-hoc investigation.",
    ],
    diagram:
      '  EC2 / Lambda / ALB / app  --push--> [ CloudWatch Metrics + Logs ]\n' +
      '                                         |\n' +
      '                 Alarm (CPU>70% for 3x5min) --> SNS --> pager / Auto Scaling\n' +
      '                 Dashboard  <-- widgets --  Logs Insights queries',
    practice: [
      'Alarm on user-facing symptoms (latency, error rate, queue age), not just CPU.',
      "Set log-group retention deliberately -- 'never expire' quietly becomes a big bill.",
      "Use composite alarms and 'datapoints to alarm' to suppress flapping and alert fatigue.",
      'Emit structured logs / EMF so metrics and logs correlate; add CloudWatch alarms to a runbook.',
    ],
    gotchas: [
      'Custom metrics and high-resolution alarms cost per metric -- cardinality (per-user dimensions) explodes fast.',
      'INSUFFICIENT_DATA often means the metric stopped being published -- treat it as suspicious.',
      'Ingested log volume, not stored, is the main Logs cost driver; filter noisy debug logs at the source.',
    ],
    pricing:
      'Pay per custom metric per month, per 1,000 API requests, per alarm, per GB of logs ingested + stored, ' +
      'and per dashboard. Basic service metrics and a free tier are included.',
    cli: 'aws cloudwatch put-metric-alarm --alarm-name high-5xx --namespace AWS/ApplicationELB \\\n  --metric-name HTTPCode_Target_5XX_Count --statistic Sum --period 60 --threshold 10 \\\n  --comparison-operator GreaterThanThreshold --evaluation-periods 3 --alarm-actions arn:aws:sns:...',
  },
  quiz: [
    {
      q: 'When does a CloudWatch alarm invoke its actions?',
      choices: [
        'On every evaluation period',
        'Only when it changes state (e.g. OK -> ALARM)',
        'Once per day',
        'Only if you press a button',
      ],
      answer: 1,
      why: 'Alarms are a state machine; actions fire on transitions, not on every datapoint.',
    },
    {
      q: 'What most drives CloudWatch Logs cost?',
      choices: [
        'Number of log groups',
        'GB of log data ingested',
        'Number of dashboards',
        'Region count',
      ],
      answer: 1,
      why: 'Ingestion (plus storage/retention) is the primary charge; filter noisy logs at the source.',
    },
    {
      q: 'Which metric is the BEST alarm target for user experience?',
      choices: ['Instance CPU', 'p99 request latency / error rate', 'Disk inode count', 'AMI age'],
      answer: 1,
      why: 'Alarm on symptoms users feel; resource metrics are secondary diagnostics.',
    },
  ],
  badge: { name: 'ALL-SEEING EYE', emoji: '📊' },
};
