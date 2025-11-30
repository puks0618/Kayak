output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.kayak_mysql.endpoint
}

output "rds_address" {
  description = "RDS instance address"
  value       = aws_db_instance.kayak_mysql.address
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.kayak_mysql.port
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.kayak_mysql.db_name
}

output "connection_string" {
  description = "MySQL connection string (without password)"
  value       = "mysql://${var.db_username}@${aws_db_instance.kayak_mysql.endpoint}/${var.db_name}"
  sensitive   = true
}

# DocumentDB Outputs
output "docdb_endpoint" {
  description = "DocumentDB cluster endpoint"
  value       = aws_docdb_cluster.kayak_docdb.endpoint
}

output "docdb_reader_endpoint" {
  description = "DocumentDB cluster reader endpoint"
  value       = aws_docdb_cluster.kayak_docdb.reader_endpoint
}

output "docdb_port" {
  description = "DocumentDB cluster port"
  value       = aws_docdb_cluster.kayak_docdb.port
}

output "mongodb_connection_string" {
  description = "MongoDB connection string (without password)"
  value       = "mongodb://${var.docdb_username}@${aws_docdb_cluster.kayak_docdb.endpoint}:27017/?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
  sensitive   = true
}

# Secrets Manager Outputs
output "rds_secret_arn" {
  description = "ARN of RDS credentials secret in Secrets Manager"
  value       = aws_secretsmanager_secret.rds_credentials.arn
}

output "docdb_secret_arn" {
  description = "ARN of DocumentDB credentials secret in Secrets Manager"
  value       = aws_secretsmanager_secret.docdb_credentials.arn
}

output "service_role_arn" {
  description = "ARN of IAM role for services to access secrets and databases"
  value       = aws_iam_role.service_role.arn
}

output "service_role_name" {
  description = "Name of IAM role for services"
  value       = aws_iam_role.service_role.name
}

# Security Group Outputs
output "rds_security_group_id" {
  description = "Security group ID for RDS"
  value       = aws_security_group.rds_sg.id
}

output "docdb_security_group_id" {
  description = "Security group ID for DocumentDB"
  value       = aws_security_group.docdb_sg.id
}
