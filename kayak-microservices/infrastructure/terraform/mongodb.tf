# DocumentDB (MongoDB-compatible) Cluster for MongoDB workloads

# DocumentDB Subnet Group
resource "aws_docdb_subnet_group" "docdb_subnet_group" {
  name       = "kayak-docdb-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name = "kayak-docdb-subnet-group"
  }
}

# Security Group for DocumentDB
resource "aws_security_group" "docdb_sg" {
  name        = "kayak-docdb-sg"
  description = "Security group for Kayak DocumentDB"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 27017
    to_port     = 27017
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "kayak-docdb-sg"
  }
}

# DocumentDB Cluster
resource "aws_docdb_cluster" "kayak_docdb" {
  cluster_identifier      = var.docdb_cluster_identifier
  engine                  = "docdb"
  master_username         = var.docdb_username
  master_password         = var.docdb_password
  backup_retention_period = var.docdb_backup_retention_period
  preferred_backup_window = "03:00-04:00"
  skip_final_snapshot     = var.skip_final_snapshot
  db_subnet_group_name    = aws_docdb_subnet_group.docdb_subnet_group.name
  vpc_security_group_ids  = [aws_security_group.docdb_sg.id]
  storage_encrypted       = true

  enabled_cloudwatch_logs_exports = ["audit", "profiler"]

  tags = {
    Name        = "kayak-docdb-cluster"
    Environment = var.environment
  }
}

# DocumentDB Cluster Instance
resource "aws_docdb_cluster_instance" "kayak_docdb_instance" {
  count              = var.docdb_instance_count
  identifier         = "${var.docdb_cluster_identifier}-${count.index}"
  cluster_identifier = aws_docdb_cluster.kayak_docdb.id
  instance_class     = var.docdb_instance_class

  tags = {
    Name        = "kayak-docdb-instance-${count.index}"
    Environment = var.environment
  }
}
