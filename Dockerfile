###############################################################################
# @file
# @brief Container image with Node, Terraform, and AWS CLI for Sidewalk Cloud Light deploys.
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
FROM node:24.11-slim

ARG TF_VERSION=1.14.0
ARG TARGETARCH 

# install dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    uuid-runtime \
    curl \
    unzip \
    gnupg \
    ca-certificates \
    groff \
    less \
    && rm -rf /var/lib/apt/lists/*

# install terraform, see: https://developer.hashicorp.com/well-architected-framework/verify-hashicorp-binary
# map Docker TARGETARCH to Terraform OS/Arch format
RUN case ${TARGETARCH} in \
    "amd64") TF_OS_ARCH="linux_amd64" ;; \
    "arm64") TF_OS_ARCH="linux_arm64" ;; \
    *) echo "Unsupported architecture: ${TARGETARCH}" && exit 1 ;; \
    esac && \
    echo "Building for Terraform architecture: ${TF_OS_ARCH}" && \
    cd /tmp && \
    curl -fsSL --remote-name https://releases.hashicorp.com/terraform/${TF_VERSION}/terraform_${TF_VERSION}_${TF_OS_ARCH}.zip && \
    curl -fsSL --remote-name https://releases.hashicorp.com/terraform/${TF_VERSION}/terraform_${TF_VERSION}_SHA256SUMS && \
    curl -fsSL --remote-name https://releases.hashicorp.com/terraform/${TF_VERSION}/terraform_${TF_VERSION}_SHA256SUMS.sig && \
    curl -fsSL https://www.hashicorp.com/.well-known/pgp-key.txt | gpg --import && \
    gpg --verify terraform_${TF_VERSION}_SHA256SUMS.sig terraform_${TF_VERSION}_SHA256SUMS && \
    grep terraform_${TF_VERSION}_${TF_OS_ARCH}.zip terraform_${TF_VERSION}_SHA256SUMS | sha256sum -c && \
    unzip /tmp/terraform_${TF_VERSION}_${TF_OS_ARCH}.zip -d /tmp && \
    mv /tmp/terraform /usr/local/bin/terraform && \
    rm -rf /tmp/*

# intall AWS CLI with dependencies, see: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
# map Docker TARGETARCH to AWS CLI OS/Arch format
RUN case ${TARGETARCH} in \
    "amd64") AWS_CLI_OS_ARCH="linux-x86_64" ;; \
    "arm64") AWS_CLI_OS_ARCH="linux-aarch64" ;; \
    *) echo "Unsupported architecture: ${TARGETARCH}" && exit 1 ;; \
    esac && \
    echo "Building for AWS CLI architecture: ${AWS_CLI_OS_ARCH}" && \
    cd /tmp && \
    curl -fsSL https://awscli.amazonaws.com/awscli-exe-${AWS_CLI_OS_ARCH}.zip -o "awscliv2.zip" && \
    unzip /tmp/awscliv2.zip -d /tmp && \
    ./aws/install && \
    rm -rf /tmp/*

WORKDIR /cloud-light
COPY run.sh ./run.sh
ENTRYPOINT [ "./run.sh" ]
CMD ["deploy"]
