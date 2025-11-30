# Kayak Infrastructure - Terraform Setup

## 🔒 Security Features

- **AWS Secrets Manager**: Database credentials stored securely
- **IAM Authentication**: Password-less RDS access using IAM roles  
- **Network Security**: Restricted CIDR blocks and VPC-only access
- **No Hardcoded Credentials**: All secrets via environment variables

📖 **Read [SECURITY.md](./SECURITY.md) for comprehensive security guide**

## Prerequisites
1. AWS CLI configured with credentials
2. Terraform installed (v1.0+)
3. Your VPC ID and Subnet IDs

## Quick Start

1. **Copy the example tfvars:**
```bash
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
```

2. **Edit `terraform.tfvars` with your values:**
```hcl
vpc_id     = "vpc-your-vpc-id"
subnet_ids = ["subnet-xxx", "subnet-yyy"]
db_password = "YourSecurePassword123!"
```

3. **Initialize Terraform:**
```bash
terraform init
```

4. **Preview changes:**
```bash
terraform plan
```

5. **Create RDS:**
```bash
terraform apply
```

6. **Get connection details:**
```bash
terraform output rds_endpoint
terraform output rds_address
```

## Update Application Config

After RDS is created, update your `.env`:
```
DB_HOST=$(terraform output -raw rds_address)
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=YourSecurePassword123!
DB_NAME=kayak_db
```

## Cleanup

To destroy RDS:
```bash
terraform destroy
```

## Cost Estimate
- **db.t3.micro**: ~$15/month (free tier eligible for 12 months)
- **Storage (20GB gp3)**: ~$2.30/month
