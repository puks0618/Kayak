# Security Configuration Guide

This document explains the security improvements implemented for the Kayak microservices infrastructure.

## Overview of Security Changes

1. **AWS Secrets Manager Integration**: Database credentials are stored securely in AWS Secrets Manager
2. **IAM Database Authentication**: RDS supports IAM-based authentication (no passwords needed)
3. **Network Security**: Restricted CIDR blocks for database access
4. **No Hardcoded Credentials**: All credentials must be provided via environment variables

## AWS Secrets Manager

### What Was Created

The Terraform configuration creates the following secrets:
- `kayak/rds/credentials-{environment}` - RDS MySQL credentials
- `kayak/docdb/credentials-{environment}` - DocumentDB credentials

### IAM Roles and Policies

- **Service Role**: `kayak-service-role-{environment}`
  - Can read secrets from Secrets Manager
  - Can authenticate to RDS using IAM
  - Should be attached to EC2, ECS, or Lambda execution roles

### Retrieving Credentials

#### Method 1: Using AWS CLI
```bash
# Get RDS credentials
aws secretsmanager get-secret-value \
  --secret-id kayak/rds/credentials-dev \
  --query SecretString \
  --output text | jq .

# Get DocumentDB credentials
aws secretsmanager get-secret-value \
  --secret-id kayak/docdb/credentials-dev \
  --query SecretString \
  --output text | jq .
```

#### Method 2: Using Helper Script
```bash
# Get RDS credentials
./scripts/get-db-credentials.sh rds dev

# Get DocumentDB credentials
./scripts/get-db-credentials.sh docdb dev
```

#### Method 3: From Application Code (Node.js)
```javascript
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager({ region: 'us-east-1' });

async function getDbCredentials() {
  const secret = await secretsManager.getSecretValue({
    SecretId: 'kayak/rds/credentials-dev'
  }).promise();
  
  return JSON.parse(secret.SecretString);
}
```

## IAM Database Authentication

### Benefits
- No password management needed
- Automatic token rotation every 15 minutes
- Centralized access control through IAM
- Audit trail in CloudTrail

### Enabling IAM Authentication

The RDS instance is already configured with `iam_database_authentication_enabled = true`.

### Using IAM Authentication

#### 1. Grant IAM Permission
Your application's IAM role needs the `kayak-rds-iam-auth-policy` attached (already created in Terraform).

#### 2. Generate Auth Token (Node.js)
```javascript
const AWS = require('aws-sdk');
const mysql = require('mysql2/promise');

const signer = new AWS.RDS.Signer({
  region: 'us-east-1',
  hostname: process.env.MYSQL_HOST,
  port: 3306,
  username: process.env.MYSQL_USER
});

const token = signer.getAuthToken({});

const connection = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: 3306,
  user: process.env.MYSQL_USER,
  password: token,
  database: process.env.MYSQL_DATABASE,
  ssl: 'Amazon RDS',
  authPlugins: {
    mysql_clear_password: () => () => token
  }
});
```

#### 3. Create Database User for IAM Auth
```sql
-- Connect to RDS with master credentials first
CREATE USER 'iam_user' IDENTIFIED WITH AWSAuthenticationPlugin AS 'RDS';
GRANT ALL PRIVILEGES ON kayak_db.* TO 'iam_user'@'%';
FLUSH PRIVILEGES;
```

## Network Security

### CIDR Block Restrictions

**Before**: `allowed_cidr_blocks = ["0.0.0.0/0"]` (allows all IPs)
**After**: `allowed_cidr_blocks = ["10.0.0.0/16"]` (VPC only)

### Finding Your IP Address
```bash
# Your public IP
curl ifconfig.me

# Update terraform.tfvars
allowed_cidr_blocks = ["YOUR_IP/32", "10.0.0.0/16"]
```

### Production Recommendations
- Use VPC CIDR blocks only
- Never use `0.0.0.0/0` in production
- Set `publicly_accessible = false`
- Use VPN or AWS PrivateLink for external access

## Environment Variables

### Required Variables

All services must set these environment variables:

```bash
# MySQL
MYSQL_HOST=<from-terraform-output>
MYSQL_PORT=3306
MYSQL_USER=<from-secrets-manager>
MYSQL_PASSWORD=<from-secrets-manager>
MYSQL_DATABASE=kayak_db

# MongoDB
MONGODB_HOST=<from-terraform-output>
MONGODB_PORT=27017
MONGODB_USER=<from-secrets-manager>
MONGODB_PASSWORD=<from-secrets-manager>
```

### Using IAM Auth
```bash
# Set this to skip password requirement
USE_IAM_AUTH=true
```

## Deployment Checklist

### Initial Setup
- [ ] Review and update `allowed_cidr_blocks` in `terraform.tfvars`
- [ ] Set strong passwords in `terraform.tfvars` (these will be stored in Secrets Manager)
- [ ] Run `terraform apply` to create infrastructure and secrets
- [ ] Retrieve Terraform outputs: `terraform output`
- [ ] Get credentials from Secrets Manager using helper script

### For Each Service
- [ ] Attach `kayak-service-role` to EC2/ECS/Lambda
- [ ] Set environment variables from Secrets Manager
- [ ] Test database connectivity
- [ ] (Optional) Configure IAM authentication

### For Team Members
- [ ] Grant IAM permissions to read secrets:
  ```bash
  aws iam attach-user-policy \
    --user-name TEAM_MEMBER \
    --policy-arn <secrets-read-policy-arn>
  ```
- [ ] Share `.env.example` and this security guide
- [ ] Never share actual `.env` files with credentials

## Rotating Credentials

### Manual Rotation
```bash
# 1. Update terraform.tfvars with new password
db_password = "NewSecurePassword123!"

# 2. Apply changes
terraform apply

# 3. Restart all services to pick up new credentials
```

### Automatic Rotation (Advanced)
Consider setting up AWS Secrets Manager automatic rotation for production:
```hcl
resource "aws_secretsmanager_secret_rotation" "rds" {
  secret_id           = aws_secretsmanager_secret.rds_credentials.id
  rotation_lambda_arn = aws_lambda_function.rotate_secret.arn

  rotation_rules {
    automatically_after_days = 30
  }
}
```

## Troubleshooting

### "Access Denied" errors
- Check IAM role has `secrets_read_policy` attached
- Verify AWS credentials are configured: `aws sts get-caller-identity`

### Cannot connect to RDS
- Check security group allows your IP in `allowed_cidr_blocks`
- Verify VPC connectivity (use bastion host if needed)
- Check RDS is in "Available" state: `aws rds describe-db-instances`

### IAM Authentication fails
- Ensure IAM user is created in database with `AWSAuthenticationPlugin`
- Verify IAM role has `rds-db:connect` permission
- Check auth token is generated correctly (valid for 15 minutes)

## Additional Resources

- [AWS Secrets Manager Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)
- [IAM Database Authentication for MySQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.html)
- [RDS Security Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.Security.html)
