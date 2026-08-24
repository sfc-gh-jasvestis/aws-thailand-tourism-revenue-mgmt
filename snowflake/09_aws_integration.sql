-- ============================================================================
-- 09_AWS_INTEGRATION.SQL — AWS services for Revenue Management & Dynamic Pricing
-- Account: 018437500440 | Region: us-west-2 (Oregon)
-- Skip this script for Snowflake-only build
-- ============================================================================
USE DATABASE TOURISM_REVENUE;
USE SCHEMA APP;

-- ==================== AMAZON S3 ====================
-- Storage integration for S3 landing zone (OTA feeds, flight data, playbooks)
CREATE OR REPLACE STORAGE INTEGRATION aws_thailand_tourism_revenue_mgmt_S3_INT
  TYPE = EXTERNAL_STAGE
  STORAGE_PROVIDER = 'S3'
  STORAGE_AWS_ROLE_ARN = 'arn:aws:iam::018437500440:role/snowflake-sea-demos-s3'
  STORAGE_ALLOWED_LOCATIONS = ('s3://sea-aws-demos-018437500440/aws-thailand-tourism-revenue-mgmt/');

-- External stage for data landing
CREATE OR REPLACE STAGE RAW.LANDING_STAGE
  STORAGE_INTEGRATION = aws_thailand_tourism_revenue_mgmt_S3_INT
  URL = 's3://sea-aws-demos-018437500440/aws-thailand-tourism-revenue-mgmt/'
  FILE_FORMAT = (TYPE = 'JSON' STRIP_OUTER_ARRAY = TRUE);

-- ==================== AMAZON KINESIS (via S3 Firehose) ====================
-- Stream ARN: arn:aws:kinesis:us-west-2:018437500440:stream/aws-thailand-tourism-revenue-mgmt-stream
-- Firehose delivers to: s3://sea-aws-demos-018437500440/aws-thailand-tourism-revenue-mgmt/realtime/

CREATE OR REPLACE PIPE RAW.OTA_REALTIME_PIPE
  AUTO_INGEST = TRUE
  INTEGRATION = 'aws_thailand_tourism_revenue_mgmt_S3_INT'
  COMMENT = 'Auto-ingest real-time OTA rate feeds from Kinesis via S3 Firehose'
AS
COPY INTO RAW.OTA_RATE_FEEDS (FEED_ID, PROPERTY_ID, OTA_NAME, STAY_DATE, ROOM_TYPE, RATE_THB, RATE_USD, AVAILABILITY_STATUS, SCRAPED_AT)
FROM (
  SELECT
    $1:feed_id::VARCHAR,
    $1:property_id::VARCHAR,
    $1:ota_name::VARCHAR,
    $1:stay_date::DATE,
    $1:room_type::VARCHAR,
    $1:rate_thb::FLOAT,
    $1:rate_usd::FLOAT,
    $1:availability_status::VARCHAR,
    $1:scraped_at::TIMESTAMP
  FROM @RAW.LANDING_STAGE/realtime/
)
FILE_FORMAT = (TYPE = 'JSON');

-- ==================== AMAZON BEDROCK ====================
-- Network rule for Bedrock API access (us-west-2)
CREATE OR REPLACE NETWORK RULE APP.BEDROCK_NETWORK_RULE
  MODE = EGRESS
  TYPE = HOST_PORT
  VALUE_LIST = ('bedrock-runtime.us-west-2.amazonaws.com:443');

-- Secret for AWS credentials (service user: snowflake-bedrock-svc)
-- IMPORTANT: Replace YOUR_KEY and YOUR_SECRET with actual IAM credentials before running
CREATE OR REPLACE SECRET APP.AWS_BEDROCK_SECRET
  TYPE = GENERIC_STRING
  SECRET_STRING = '{"aws_key_id":"YOUR_AWS_ACCESS_KEY_ID","aws_secret_key":"YOUR_AWS_SECRET_ACCESS_KEY","region":"us-west-2"}';

-- External Access Integration
CREATE OR REPLACE EXTERNAL ACCESS INTEGRATION aws_thailand_tourism_revenue_mgmt_BEDROCK_EAI
  ALLOWED_NETWORK_RULES = (TOURISM_REVENUE.APP.BEDROCK_NETWORK_RULE)
  ALLOWED_AUTHENTICATION_SECRETS = (TOURISM_REVENUE.APP.AWS_BEDROCK_SECRET)
  ENABLED = TRUE
  COMMENT = 'Bedrock access for revenue strategy narrative generation (us-west-2)';

-- UDF to call Bedrock Claude for revenue strategy recommendations
-- Using us.anthropic.claude-sonnet-4-6 (cross-region inference profile)
-- Swap to us.anthropic.claude-opus-4-8 once model access is approved
CREATE OR REPLACE FUNCTION APP.BEDROCK_GENERATE(prompt VARCHAR)
  RETURNS VARCHAR
  LANGUAGE PYTHON
  RUNTIME_VERSION = '3.11'
  PACKAGES = ('requests', 'boto3')
  HANDLER = 'invoke_bedrock'
  EXTERNAL_ACCESS_INTEGRATIONS = (aws_thailand_tourism_revenue_mgmt_BEDROCK_EAI)
  SECRETS = ('aws_creds' = TOURISM_REVENUE.APP.AWS_BEDROCK_SECRET)
AS $$
import json, boto3, _snowflake

def invoke_bedrock(prompt):
    creds = json.loads(_snowflake.get_generic_secret_string('aws_creds'))
    client = boto3.client(
        'bedrock-runtime',
        region_name=creds['region'],
        aws_access_key_id=creds['aws_key_id'],
        aws_secret_access_key=creds['aws_secret_key']
    )
    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 2048,
        "messages": [{"role": "user", "content": prompt}]
    })
    response = client.invoke_model(
        modelId='us.anthropic.claude-sonnet-4-6',
        contentType='application/json',
        accept='application/json',
        body=body
    )
    result = json.loads(response['body'].read())
    return result['content'][0]['text']
$$;

-- ==================== AMAZON SNS ====================
-- Network rule for SNS notifications to revenue managers (us-west-2)
CREATE OR REPLACE NETWORK RULE APP.SNS_NETWORK_RULE
  MODE = EGRESS
  TYPE = HOST_PORT
  VALUE_LIST = ('sns.us-west-2.amazonaws.com:443');

CREATE OR REPLACE EXTERNAL ACCESS INTEGRATION aws_thailand_tourism_revenue_mgmt_SNS_EAI
  ALLOWED_NETWORK_RULES = (TOURISM_REVENUE.APP.SNS_NETWORK_RULE)
  ALLOWED_AUTHENTICATION_SECRETS = (TOURISM_REVENUE.APP.AWS_BEDROCK_SECRET)
  ENABLED = TRUE
  COMMENT = 'SNS access for revenue alert notifications (us-west-2)';

-- SNS Topic ARN: arn:aws:sns:us-west-2:018437500440:sea-demos-aws-thailand-tourism-revenue-mgmt

-- UDF to publish SNS alerts
CREATE OR REPLACE FUNCTION APP.SNS_PUBLISH(topic_arn VARCHAR, subject VARCHAR, message VARCHAR)
  RETURNS VARCHAR
  LANGUAGE PYTHON
  RUNTIME_VERSION = '3.11'
  PACKAGES = ('boto3')
  HANDLER = 'publish_sns'
  EXTERNAL_ACCESS_INTEGRATIONS = (aws_thailand_tourism_revenue_mgmt_SNS_EAI)
  SECRETS = ('aws_creds' = TOURISM_REVENUE.APP.AWS_BEDROCK_SECRET)
AS $$
import json, boto3, _snowflake

def publish_sns(topic_arn, subject, message):
    creds = json.loads(_snowflake.get_generic_secret_string('aws_creds'))
    client = boto3.client(
        'sns',
        region_name=creds['region'],
        aws_access_key_id=creds['aws_key_id'],
        aws_secret_access_key=creds['aws_secret_key']
    )
    response = client.publish(
        TopicArn=topic_arn,
        Subject=subject,
        Message=message
    )
    return json.dumps(response)
$$;

-- ==================== AMAZON QUICKSIGHT ====================
-- QuickSight connects via Snowflake JDBC connector (Direct Query mode)
-- Network policy: 54.70.204.128/27 added to ACCOUNT_VPN_POLICY_SE
-- Dashboard: RevPAR Performance by Destination
-- Amazon Q enabled for natural language: "What's our Phuket RevPAR this month?"
--
-- Data source: sfseapac-sg_demo43.snowflakecomputing.com
-- Database: TOURISM_REVENUE | Schema: CURATED | Warehouse: TOURISM_WH
-- Tables: PROPERTY_REVPAR, DEMAND_SIGNALS, RATE_POSITION, BOOKING_PACE
