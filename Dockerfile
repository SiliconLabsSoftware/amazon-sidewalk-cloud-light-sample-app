FROM node:24.11-slim

ARG TF_VERSION=1.14.0
ARG TARGETARCH 

# install dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
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

WORKDIR /app
COPY run.sh ./run.sh
CMD ["./run.sh"]
