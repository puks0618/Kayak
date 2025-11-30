#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✓ AWS credentials loaded from .env"
else
    echo "✗ Error: .env file not found"
    echo "Copy .env.example to .env and fill in your credentials"
    exit 1
fi

# Verify AWS credentials
echo "Testing AWS connection..."
aws sts get-caller-identity

if [ $? -eq 0 ]; then
    echo "✓ AWS credentials valid"
    echo ""
    echo "You can now run:"
    echo "  terraform init"
    echo "  terraform plan"
    echo "  terraform apply"
else
    echo "✗ AWS credentials invalid or AWS CLI not configured"
    exit 1
fi
