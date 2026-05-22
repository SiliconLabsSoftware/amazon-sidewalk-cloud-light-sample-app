#!/bin/bash

###############################################################################
# @file
# @brief Orchestrates Terraform, Lambda, and frontend deployment for Sidewalk Cloud Light.
###############################################################################
# # License
# Copyright 2026 Silicon Laboratories Inc. www.silabs.com
###############################################################################
#
# SPDX-License-Identifier: Zlib
#
# The licensor of this software is Silicon Laboratories Inc.
#
# This software is provided 'as-is', without any express or implied
# warranty. In no event will the authors be held liable for any damages
# arising from the use of this software.
#
# Permission is granted to anyone to use this software for any purpose,
# including commercial applications, and to alter it and redistribute it
# freely, subject to the following restrictions:
#
# 1. The origin of this software must not be misrepresented; you must not
#    claim that you wrote the original software. If you use this software
#    in a product, an acknowledgment in the product documentation would be
#    appreciated but is not required.
# 2. Altered source versions must be plainly marked as such, and must not be
#    misrepresented as being the original software.
# 3. This notice may not be removed or altered from any source distribution.
#
###############################################################################

# Deployment orchestration script for Sidewalk Cloud Light
# This script manages AWS infrastructure deployment via Terraform,
# Lambda functions, and frontend deployment to S3/CloudFront

CONFIG_FILE="./configure.sh"
CONFIG_FILE_SAMPLE="./configure.sh-sample"

if [[ "$#" -eq 0 ]]; then
    echo "Deployment orchestration script for Sidewalk Cloud Light"
    echo ""
    echo "usage:"
    echo "  ./run.sh <command> [<command>...]"
    echo ""
    echo "commands:"
    echo "  init          initialize terraform backend"
    echo "  deploy        deploy both backend and frontend"
    echo "  lambda-deps   install lambda dependencies"
    echo "  lambda-build  build lambda functions (tf will also build)"
    echo "  plan          terraform plan before deployment"
    echo "  tf            deploy (apply) terraformed backend infrastructure"
    echo "  outputs       export deployment outputs: URLs, IDs etc"
    echo "  ui-deps       install frontend dependencies"
    echo "  ui            deploy web frontend"
    echo "  destroy       destroy terraform infrastructure"
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

# Run certificate fix script if it exists
if [[ -f "certificate-fix.sh" ]]; then
    echo "==> Running certificate fix script"
    ./certificate-fix.sh
fi

# Ensure configure.sh exists — needed as a write-back target for
# auto-generated values (bucket name, password) in config-file mode
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

# Detect configuration source: environment variables vs config file.
# If AWS_REGION is already in the environment, assume all config is provided
# via env (e.g. CI/CD) and require all three variables — auto-generation
# cannot persist values back in that context.
# Otherwise, load from configure.sh where only AWS_REGION is required
# and the rest can be auto-generated and saved back to the file.
if [[ -n "${AWS_REGION:-}" ]]; then
    echo "==> Configuration: using environment variables"
    for var in AWS_REGION TERRAFORM_BACKEND_BUCKET FRONTEND_PASSWORD; do
        if [[ -z "${!var:-}" ]]; then
            echo "Error: $var must be set when providing configuration via environment variables." >&2
            echo "In environment mode all three are required because generated values cannot be persisted." >&2
            exit 1
        fi
    done
else
    echo "==> Configuration: loading from $CONFIG_FILE"
    source "$CONFIG_FILE"
    if [[ -z "${AWS_REGION:-}" ]]; then
        echo "Error: AWS_REGION is not set in $CONFIG_FILE." >&2
        exit 1
    fi
fi

# Find AWS Account ID based on credentials (and thereby validate credentials)
if ! AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text 2>/dev/null); then
    echo "Error: Failed to retrieve AWS Account ID. Please check your AWS credentials." >&2
    echo "Example ways to provide AWS credentials:" >&2
    echo "  - set environment variables AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY (+ optional AWS_SESSION_TOKEN), or" >&2
    echo "  - set env or configure.sh variable AWS_PROFILE (with ~/.aws/credentials mounted into the container)" >&2
    exit 1
fi
if [[ -z "$AWS_ACCOUNT_ID" ]]; then
    echo "Error: AWS Account ID is empty" >&2
    exit 1
fi
echo "Using AWS Account ID: $AWS_ACCOUNT_ID"

# check if frontend password is "null" (i.e. not provided)
if [[ -z "${FRONTEND_PASSWORD:-}" || "$FRONTEND_PASSWORD" == "null" ]]; then
    echo "Frontend password not provided - generating a password..."
    PASSWORD=$(printf "%04d\n" $((RANDOM % 10000)))
    update_env_var "FRONTEND_PASSWORD" "$PASSWORD"
    echo "... generated password: $FRONTEND_PASSWORD"
else
    echo "Using provided frontend password"
fi

if [[ ${#FRONTEND_PASSWORD} -gt 20 ]]; then
    echo "Error: FRONTEND_PASSWORD exceeds 20 characters (max for device downlink URL message)" >&2
    exit 1
fi

# Export terraform variables
export TF_VAR_aws_region=$AWS_REGION
export TF_VAR_aws_account_id=$AWS_ACCOUNT_ID
export TF_VAR_frontend_password=$FRONTEND_PASSWORD

# **********
# ACTIONS
# **********

if [[ " ${args[@]} " =~ " deploy " ]]; then
    args=("init" "lambda-deps" "tf" "outputs" "ui-deps" "ui")
fi

if [[ " ${args[@]} " =~ " init " ]]; then
    echo "==> Initializing Terraform backend"
    # check if bucket name is "null" (i.e. not provided)
    if [[ -z "${TERRAFORM_BACKEND_BUCKET:-}" || "$TERRAFORM_BACKEND_BUCKET" == "null" ]]; then
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
    pushd terraform >/dev/null
    terraform plan
    popd >/dev/null
fi

if [[ " ${args[@]} " =~ " lambda-deps " ]]; then
    echo "==> Installing lambda dependencies"
    pushd lambda >/dev/null
    npm install
    popd >/dev/null
fi

if [[ " ${args[@]} " =~ " lambda-build " ]]; then
    echo "==> Building lambda functions"
    pushd lambda >/dev/null
    npm run build
    popd >/dev/null
fi

if [[ " ${args[@]} " =~ " tf " ]]; then
    echo "==> Deploying Terraform infrastructure"
    echo "Building lambda functions..."
    pushd lambda >/dev/null
    npm run build
    popd >/dev/null
    
    echo "Applying Terraform infrastructure..."
    pushd terraform >/dev/null
    terraform apply -auto-approve
    popd >/dev/null
fi

if [[ " ${args[@]} " =~ " outputs " ]]; then
    echo "==> Extracting Terraform outputs"
    pushd terraform >/dev/null
    rm -f .outputs.sh
    terraform output iot_endpoint | tr '\n' ' ' | echo "export IOT_ENDPOINT=$(cat -)" >>.outputs.sh
    terraform output rest_url | tr '\n' ' ' | echo "export APP_REST_URL=$(cat -)" >>.outputs.sh
    terraform output wss_url | tr '\n' ' ' | echo "export APP_WSS_URL=$(cat -)" >>.outputs.sh
    terraform output frontend_s3_bucket | tr '\n' ' ' | echo "export FRONTEND_S3_BUCKET=$(cat -)" >>.outputs.sh
    terraform output public_cloudfront_id | tr '\n' ' ' | echo "export CLOUDFRONT_ID=$(cat -)" >>.outputs.sh
    terraform output public_cloudfront_domain_name | tr '\n' ' ' | echo "export FRONTEND_PUBLIC_URL=$(cat -)" >>.outputs.sh
    echo ""
    cat .outputs.sh
    popd >/dev/null
fi

if [[ " ${args[@]} " =~ " ui-deps " ]]; then
    echo "==> Installing frontend dependencies"
    pushd frontend >/dev/null
    npm install
    popd >/dev/null
fi

if [[ " ${args[@]} " =~ " outputs-to-ui " ]]; then
    echo "==> Copying Terraform outputs to frontend"
    source terraform/.outputs.sh
    pushd frontend >/dev/null
    rm -f .env
    echo VITE_REST_URL=\"$APP_REST_URL\" > .env
    echo VITE_WSS_URL=\"$APP_WSS_URL\" >> .env
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
    aws s3 sync --delete dist "s3://$FRONTEND_S3_BUCKET/"
    echo "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_ID" --paths "/*" >/dev/null
    echo ""
    echo "------------------------------------------------"
    echo "Deployment complete: https://$FRONTEND_PUBLIC_URL"
    echo "------------------------------------------------"
    echo ""
    popd >/dev/null
fi

if [[ " ${args[@]} " =~ " destroy " ]]; then
    echo "==> Destroying Terraform infrastructure"
    pushd terraform >/dev/null
    terraform destroy -auto-approve
    popd >/dev/null
fi

echo ""
echo "==> All requested commands completed"
