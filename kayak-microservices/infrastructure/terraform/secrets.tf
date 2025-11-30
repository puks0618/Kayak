# AWS Secrets Manager for Database Credentials
# This provides secure storage for database credentials instead of hardcoding them

# Secret for RDS MySQL credentials
resource "aws_secretsmanager_secret" "rds_credentials" {
  name        = "kayak/rds/credentials-${var.environment}"
  description = "RDS MySQL credentials for Kayak microservices"

  tags = {
    Name        = "kayak-rds-credentials"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "rds_credentials" {
  secret_id = aws_secretsmanager_secret.rds_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    engine   = "mysql"
    host     = aws_db_instance.kayak_mysql.address
    port     = aws_db_instance.kayak_mysql.port
    dbname   = var.db_name
  })
}

# Secret for DocumentDB credentials
resource "aws_secretsmanager_secret" "docdb_credentials" {
  name        = "kayak/docdb/credentials-${var.environment}"
  description = "DocumentDB credentials for Kayak microservices"

  tags = {
    Name        = "kayak-docdb-credentials"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "docdb_credentials" {
  secret_id = aws_secretsmanager_secret.docdb_credentials.id
  secret_string = jsonencode({
    username = var.docdb_username
    password = var.docdb_password
    engine   = "docdb"
    host     = aws_docdb_cluster.kayak_docdb.endpoint
    port     = aws_docdb_cluster.kayak_docdb.port
  })
}

# IAM policy for services to read secrets
resource "aws_iam_policy" "secrets_read_policy" {
  name        = "kayak-secrets-read-policy-${var.environment}"
  description = "Allow reading Kayak database secrets from Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          aws_secretsmanager_secret.rds_credentials.arn,
          aws_secretsmanager_secret.docdb_credentials.arn
        ]
      }
    ]
  })

  tags = {
    Name        = "kayak-secrets-read-policy"
    Environment = var.environment
  }
}

# IAM role for EC2/ECS services to assume
resource "aws_iam_role" "service_role" {
  name = "kayak-service-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = [
            "ec2.amazonaws.com",
            "ecs-tasks.amazonaws.com"
          ]
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "kayak-service-role"
    Environment = var.environment
  }
}

# Attach secrets policy to service role
resource "aws_iam_role_policy_attachment" "service_secrets_policy" {
  role       = aws_iam_role.service_role.name
  policy_arn = aws_iam_policy.secrets_read_policy.arn
}

# IAM policy for RDS IAM authentication
resource "aws_iam_policy" "rds_iam_auth_policy" {
  name        = "kayak-rds-iam-auth-policy-${var.environment}"
  description = "Allow IAM authentication to RDS"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds-db:connect"
        ]
        Resource = [
          "arn:aws:rds-db:${var.aws_region}:*:dbuser:${aws_db_instance.kayak_mysql.resource_id}/${var.db_username}"
        ]
      }
    ]
  })

  tags = {
    Name        = "kayak-rds-iam-auth-policy"
    Environment = var.environment
  }
}

# Attach RDS IAM auth policy to service role
resource "aws_iam_role_policy_attachment" "service_rds_iam_auth" {
  role       = aws_iam_role.service_role.name
  policy_arn = aws_iam_policy.rds_iam_auth_policy.arn
}
