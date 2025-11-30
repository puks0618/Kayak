# Quick Reference: Database Security Setup

## 🚀 For New Team Members

### 1. First Time Setup

```bash
# Clone the repository
git clone <repo-url>
cd kayak-microservices

# Configure AWS credentials
aws configure
# Enter your AWS Access Key ID and Secret Access Key

# Verify credentials work
aws sts get-caller-identity
```

### 2. Get Database Connection Info

```bash
cd infrastructure/terraform

# Get RDS endpoint
terraform output rds_address

# Get DocumentDB endpoint  
terraform output docdb_endpoint

# Get credentials from Secrets Manager
../../scripts/get-db-credentials.sh rds dev
../../scripts/get-db-credentials.sh docdb dev
```

### 3. Setup Your Local Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env and add the values from step 2
nano .env
```

## 🔐 Security Checklist

### Before Deploying
- [ ] Update `allowed_cidr_blocks` in `terraform.tfvars` with your IP
  ```bash
  # Find your IP
  curl ifconfig.me
  
  # Add to terraform.tfvars
  allowed_cidr_blocks = ["YOUR_IP/32", "10.0.0.0/16"]
  ```
- [ ] Set strong passwords in `terraform.tfvars`
- [ ] Set `publicly_accessible = false` for production
- [ ] Review all variables in `terraform.tfvars`

### After Deploying
- [ ] Retrieve credentials from Secrets Manager (never hardcode)
- [ ] Verify IAM role is attached to your services
- [ ] Test database connectivity
- [ ] Delete any `.env` files from git (check `.gitignore`)

## 📋 Common Commands

### Terraform
```bash
# Initialize
terraform init

# Plan changes
terraform plan

# Apply changes
terraform apply

# View outputs
terraform output

# Destroy (be careful!)
terraform destroy
```

### AWS Secrets Manager
```bash
# Get RDS credentials
aws secretsmanager get-secret-value \
  --secret-id kayak/rds/credentials-dev \
  --query SecretString --output text | jq .

# Get DocumentDB credentials
aws secretsmanager get-secret-value \
  --secret-id kayak/docdb/credentials-dev \
  --query SecretString --output text | jq .
```

### Database Connection
```bash
# Connect to RDS MySQL
mysql -h $(terraform output -raw rds_address) \
  -u admin -p kayak_db

# Connect to DocumentDB (requires SSL)
mongo --ssl \
  --host $(terraform output -raw docdb_endpoint) \
  --username kayakadmin \
  --password
```

## 🚨 Security Rules

### ✅ DO
- Store credentials in AWS Secrets Manager
- Use environment variables in code
- Restrict CIDR blocks to specific IPs
- Use IAM authentication when possible
- Enable SSL for all database connections
- Rotate credentials regularly

### ❌ DON'T
- Hardcode credentials in code
- Commit `.env` files to git
- Use `0.0.0.0/0` in `allowed_cidr_blocks`
- Share credentials via chat/email
- Set `publicly_accessible = true` in production
- Use weak passwords

## 🆘 Troubleshooting

### Can't connect to database
```bash
# 1. Check if your IP is allowed
# Add your IP to terraform.tfvars and apply

# 2. Verify security group
aws ec2 describe-security-groups \
  --group-ids $(terraform output -raw rds_sg_id)

# 3. Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier kayak-mysql-db
```

### Access Denied to Secrets Manager
```bash
# Verify your IAM permissions
aws iam get-user

# Check attached policies
aws iam list-attached-user-policies --user-name YOUR_USERNAME
```

### "Module not found" in Terraform
```bash
# Reinitialize
terraform init -upgrade
```

## 📚 Additional Resources

- [Full Security Guide](./SECURITY.md)
- [Terraform Configuration](./main.tf)
- [Variables Reference](./variables.tf)
- [Helper Scripts](../../scripts/)

## 💬 Need Help?

1. Check [SECURITY.md](./SECURITY.md) for detailed guides
2. Review error messages carefully
3. Ask team members
4. Check AWS CloudWatch logs

---

**Remember**: Security is everyone's responsibility! 🔒
