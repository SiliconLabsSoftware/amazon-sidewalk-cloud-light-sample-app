#!/bin/bash

echo "from orchestrator script"

echo "node version: $(node -v)"
echo "npm version: $(npm -v)"
terraform -v
aws --version
cat /etc/os-release
uname -a

aws s3 ls
