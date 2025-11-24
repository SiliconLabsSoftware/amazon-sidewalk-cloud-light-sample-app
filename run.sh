#!/bin/bash

# Deployment orchestration script for Sidewalk Cloud Light
# This script manages AWS infrastructure deployment via Terraform,
# Lambda functions, and frontend deployment to S3/CloudFront

CONFIG_FILE="./configure.sh"
CONFIG_FILE_SAMPLE="./configure.sh-sample"

# These are mandatory to be provided either via ENV or in the config file:
required_vars=(
    "AWS_PROFILE"
    "AWS_REGION"
    "TERRAFORM_BACKEND_BUCKET"
    "FRONTEND_PASSWORD"
)

if [[ "$#" -eq 0 ]]; then
    echo "Deployment orchestration script for Sidewalk Cloud Light"
    echo ""
    echo "usage:"
    echo "  ./run.sh <command> [<command>...]"
    echo ""
    echo "commands:"
    echo "  init          initialize terraform backend"
    echo "  plan          plan before deployment"
    echo "  deploy        deploy both backend and frontend"
    echo "  tf            deploy (apply) terraformed backend infrastructure"
    echo "  outputs       export deployment outputs: URLs, IDs etc"
    echo "  lambda-deps   install lambda dependencies"
    echo "  lambda        deploy lambda functions"
    echo "  ui-deps       install frontend dependencies"
    echo "  ui            deploy web frontend"
    echo "  version       print version and debug info"
    echo ""
    exit
else
    args=("$@")
fi

# Exit on error, undefined variables, and pipe failures
set -euo pipefail

if [[ " ${args[@]} " =~ " version " ]]; then
    echo "==> Printing version and debug info"
    echo "OS: $(uname -a)"
    echo "OS release: $(cat /etc/os-release)"
    echo "node version: $(node -v)"
    echo "npm version: $(npm -v)"
    terraform -v
    aws --version
    exit
fi

# A config file's presence is required even when values are set via ENV
# because some values have to be saved back if they have to be generated
# e.g. terraform bucket name or frontend password (if not provided)
if [[ ! -f "$CONFIG_FILE" ]]; then
    if [[ ! -f "$CONFIG_FILE_SAMPLE" ]]; then
        echo "Error: No configure.sh, nor configure.sh-sample file found. Aborting!" >&2
        exit 1
    else
        cp "$CONFIG_FILE_SAMPLE" "$CONFIG_FILE"
        echo "Created $CONFIG_FILE from $CONFIG_FILE_SAMPLE - default values will be used"
    fi
fi

# Function to update an environment variable in configure.sh
# Usage: update_env_var "VAR_NAME" "value"
update_env_var() {
    local var_name="$1"
    local var_value="$2"
    
    if [[ -z "$var_name" ]] || [[ -z "$var_value" ]]; then
        echo "Error: update_env_var requires both variable name and value"
        return 1
    fi
    
    if [[ ! -f "$CONFIG_FILE" ]]; then
        echo "Error: $CONFIG_FILE not found"
        return 1
    fi
    
    # Check if the variable exists in the file
    if grep -q "^export ${var_name}=" "$CONFIG_FILE"; then
        # Variable exists, update it with sed
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS version of sed
            sed -i '' "s|^export ${var_name}=.*|export ${var_name}=\"${var_value}\"|" "$CONFIG_FILE"
        else
            # Linux version of sed
            sed -i "s|^export ${var_name}=.*|export ${var_name}=\"${var_value}\"|" "$CONFIG_FILE"
        fi
        echo "${var_name} updated in $CONFIG_FILE"
    else
        # Variable doesn't exist, append it to the file
        echo "export ${var_name}=\"${var_value}\"" >> "$CONFIG_FILE"
        echo "${var_name} added to $CONFIG_FILE"
    fi
    
    # Export the variable in the current shell
    export "${var_name}=${var_value}"
}

# Function to check which required variables are missing
# Returns an array of missing variable names via global missing_vars array
# and an array of found variable names via global found_vars array
check_required_vars() {
    missing_vars=()
    found_vars=()
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        else
            found_vars+=("$var")
        fi
    done
}

# Check which required variables are missing
check_required_vars
# Determine configuration state
num_missing=${#missing_vars[@]}
num_required=${#required_vars[@]}
if [[ $num_missing -eq $num_required ]]; then
    # All variables are missing - try to load from config file
    echo "Loading required variables from $CONFIG_FILE ..."
    source $CONFIG_FILE
    # Re-check after loading config file
    check_required_vars
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        echo "Error: Missing required environment variables after loading config: ${missing_vars[*]}"
        exit 1
    fi
elif [[ $num_missing -gt 0 ]]; then
    # Some variables are provided but not all - invalid configuration
    echo "Error: Inconsistent configuration - only some variables provided." >&2
    echo "Found in environment: ${found_vars[*]}" >&2
    echo "Missing: ${missing_vars[*]}" >&2
    echo "Either provide all required variables via environment variables or none (will load from $CONFIG_FILE)" >&2
    echo "You can run 'source $CONFIG_FILE' in shell to load all variables into the environment" >&2
    exit 1
fi

# Find AWS Account ID based on credentials
if ! AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text 2>/dev/null); then
    echo "Error: Failed to retrieve AWS Account ID. Please check your AWS credentials." >&2
    exit 1
fi
if [[ -z "$AWS_ACCOUNT_ID" ]]; then
    echo "Error: AWS Account ID is empty" >&2
    exit 1
fi
echo "Using AWS Account ID: $AWS_ACCOUNT_ID"

# Export terraform variables
export TF_VAR_aws_region=$AWS_REGION
export TF_VAR_aws_account_id=$AWS_ACCOUNT_ID
export TF_VAR_product="cloud-light"

# **********
# ACTIONS
# **********

if [[ " ${args[@]} " =~ " deploy " ]]; then
    args=("init" "tf" "outputs" "lambda-deps" "lambda" "ui-deps" "ui")
fi

if [[ " ${args[@]} " =~ " init " ]]; then
    echo "==> Initializing Terraform backend"
    # check if bucket name is "null" (i.e. not provided)
    if [[ "$TERRAFORM_BACKEND_BUCKET" == "null" ]]; then
        echo "Terraform remote state S3 bucket name not provided - generating a name..."
        BUCKET="cloud-light-terraform-backend-$(uuidgen | tr -d - | tr '[:upper:]' '[:lower:]')"
        update_env_var "TERRAFORM_BACKEND_BUCKET" "$BUCKET"
        echo "... generated bucket name: $BUCKET"
    else
        echo "Using provided Terraform backend bucket name: $TERRAFORM_BACKEND_BUCKET"
        BUCKET=$TERRAFORM_BACKEND_BUCKET
    fi
    TABLE="cloud-light-tfstatelock"
    BUCKET_KEY="terraform.tfstate"
    
    if ! aws s3api head-bucket --bucket "$BUCKET" 1>&2>/dev/null; then
        echo "Creating new terraform backend bucket: $BUCKET"
        aws s3api create-bucket \
            --bucket "$BUCKET"

        # Create DynamoDB table for state locking (silent fail if already exists)
        aws dynamodb create-table \
            --table-name "$TABLE" \
            --attribute-definitions AttributeName=LockID,AttributeType=S \
            --key-schema AttributeName=LockID,KeyType=HASH \
            --billing-mode PAY_PER_REQUEST \
            >/dev/null 2>/dev/null || true
    fi
    
    pushd terraform >/dev/null
    terraform init \
        -backend-config="bucket=$BUCKET" \
        -backend-config="dynamodb_table=$TABLE" \
        -backend-config="region=$AWS_REGION" \
        -backend-config="key=$BUCKET_KEY" \
        -reconfigure
    popd >/dev/null
fi

if [[ " ${args[@]} " =~ " plan " ]]; then
    echo "==> Planning Terraform changes"
    pushd terraform
    terraform plan
    popd >/dev/null
fi

if [[ " ${args[@]} " =~ " tf " ]]; then
    echo "==> Applying Terraform infrastructure"
    # TODO lambda
    pushd terraform >/dev/null
    terraform apply -auto-approve
    popd >/dev/null
fi

if [[ " ${args[@]} " =~ " outputs " ]]; then
    echo "==> Extracting Terraform outputs"
    pushd terraform >/dev/null
    rm -f .outputs.sh
    terraform output public_cloudfront_domain_name | tr '\n' ' ' | echo "export APP_PUBLIC_URL=$(cat -)" >>.outputs.sh
    terraform output rest_url | tr '\n' ' ' | echo "export APP_REST_URL=$(cat -)" >>.outputs.sh
    terraform output wss_url | tr '\n' ' ' | echo "export APP_WSS_URL=$(cat -)" >>.outputs.sh
    terraform output app_s3_bucket | tr '\n' ' ' | echo "export APP_S3_BUCKET=$(cat -)" >>.outputs.sh
    terraform output public_cloudfront_id | tr '\n' ' ' | echo "export CLOUDFRONT_ID=$(cat -)" >>.outputs.sh
    terraform output iot_endpoint | tr '\n' ' ' | echo "export IOT_ENDPOINT=$(cat -)" >>.outputs.sh
    cat .outputs.sh
    popd >/dev/null
fi

if [[ " ${args[@]} " =~ " lambda-deps " ]]; then
    echo "==> Installing lambda dependencies"
    pushd lambda >/dev/null
    npm install
    popd >/dev/null
fi

if [[ " ${args[@]} " =~ " lambda " ]]; then
    echo "==> Building and deploying lambda functions"
    pushd lambda >/dev/null
    npm run build
    # TODO: deploy lambda functions
    popd >/dev/null
fi

if [[ " ${args[@]} " =~ " ui-deps " ]]; then
    echo "==> Installing frontend dependencies"
    pushd frontend >/dev/null
    npm install
    popd >/dev/null
fi

if [[ " ${args[@]} " =~ " ui " ]]; then
    echo "==> Deploying frontend"
    if [[ ! -f "terraform/.outputs.sh" ]]; then
        echo "Error: terraform/.outputs.sh not found - run './run.sh outputs' first" >&2
        exit 1
    fi
    source terraform/.outputs.sh
    pushd frontend >/dev/null
    echo "Building frontend..."
    echo VITE_REST_URL=\"$APP_REST_URL\" > .env
    echo VITE_WSS_URL=\"$APP_WSS_URL\" >> .env
    npm install
    npm run build
    rm -f .env
    echo "Deploying to S3..."
    aws s3 sync --delete dist "s3://$APP_S3_BUCKET/"
    echo "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_ID" --paths "/*" >/dev/null
    echo "Deployment complete: https://$APP_PUBLIC_URL"
    popd >/dev/null
fi

echo ""
echo "==> All requested commands completed"
