# 🚀 CD Pipeline Setup Guide – Veracis API

Complete step-by-step guide to configure AWS Secrets Manager and Azure DevOps
variable groups so the CD pipeline can deploy to **TEST** and **PROD** on ECS.

Estimated time: ~45–60 minutes

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [AWS – Create Secrets Manager Secrets](#2-aws--create-secrets-manager-secrets)
3. [AWS – IAM Permissions](#3-aws--iam-permissions)
4. [Azure DevOps – Variable Groups](#4-azure-devops--variable-groups)
5. [Azure DevOps – Environments & Approval Gates](#5-azure-devops--environments--approval-gates)
6. [Azure DevOps – Service Connection](#6-azure-devops--service-connection)
7. [Pipeline Flow Reference](#7-pipeline-flow-reference)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

Before starting, make sure you have:

- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Access to the AWS account where ECR and ECS live
- [ ] Admin access to the Azure DevOps project
- [ ] The CI pipeline (`API - CI`) already running and pushing images to ECR
- [ ] ECS cluster, service, and task definition already created for each environment

### Values you will need

Gather these before proceeding:

| Item                        | Example value                                         |
|-----------------------------|-------------------------------------------------------|
| AWS Account ID              | `123456789012`                                        |
| AWS Region                  | `us-east-1`                                           |
| ECR Registry URL            | `123456789012.dkr.ecr.us-east-1.amazonaws.com`        |
| ECR Repository name         | `veracis-api`                                         |
| TEST ECS Cluster name       | `veracis-test-cluster`                                |
| TEST ECS Service name       | `veracis-api-test`                                    |
| TEST Task Definition family | `veracis-api-test`                                    |
| PROD ECS Cluster name       | `veracis-prod-cluster`                                |
| PROD ECS Service name       | `veracis-api-prod`                                    |
| PROD Task Definition family | `veracis-api-prod`                                    |
| Container name (both)       | `veracis-api`                                         |
| Azure DevOps service conn   | `veracis-aws-oidc`                                    |

---

## 2. AWS – Create Secrets Manager Secrets

The pipeline fetches **one JSON secret per environment** and injects every
key/value pair as an environment variable inside the ECS container.

### 2.1 Generate strong secrets first

```bash
# Generate random values for JWT secrets (run once, save the output)
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
```

### 2.2 Create the TEST secret

Replace every placeholder value (`...`) with your real values before running.

```bash
aws secretsmanager create-secret \
  --name "veracis/test/secrets" \
  --description "Veracis API – TEST environment variables" \
  --region us-east-1 \
  --secret-string '{
    "DATABASE_URL":       "postgresql://user:password@test-db.host:5432/veracis_test",
    "REDIS_URL":          "redis://test-redis.host:6379",
    "JWT_SECRET":         "REPLACE_WITH_GENERATED_VALUE",
    "JWT_REFRESH_SECRET": "REPLACE_WITH_GENERATED_VALUE",
    "SMTP_HOST":          "smtp.example.com",
    "SMTP_PORT":          "587",
    "SMTP_USER":          "noreply@veracis.com",
    "SMTP_PASS":          "smtp-password",
    "APP_URL":            "https://test-api.veracis.com",
    "NODE_ENV":           "test",
    "LOG_LEVEL":          "debug"
  }'
```

### 2.3 Create the PROD secret

```bash
aws secretsmanager create-secret \
  --name "veracis/prod/secrets" \
  --description "Veracis API – PROD environment variables" \
  --region us-east-1 \
  --secret-string '{
    "DATABASE_URL":       "postgresql://user:password@prod-db.host:5432/veracis_prod",
    "REDIS_URL":          "redis://prod-redis.host:6379",
    "JWT_SECRET":         "REPLACE_WITH_GENERATED_VALUE",
    "JWT_REFRESH_SECRET": "REPLACE_WITH_GENERATED_VALUE",
    "SMTP_HOST":          "smtp.example.com",
    "SMTP_PORT":          "587",
    "SMTP_USER":          "noreply@veracis.com",
    "SMTP_PASS":          "smtp-password",
    "APP_URL":            "https://api.veracis.com",
    "NODE_ENV":           "production",
    "LOG_LEVEL":          "warn"
  }'
```

### 2.4 Verify the secrets were created

```bash
# List all veracis secrets
aws secretsmanager list-secrets \
  --region us-east-1 \
  --query "SecretList[?starts_with(Name,'veracis/')].{Name:Name,ARN:ARN}" \
  --output table

# Read TEST secret (to confirm structure – do this in a secure terminal only)
aws secretsmanager get-secret-value \
  --secret-id "veracis/test/secrets" \
  --region us-east-1 \
  --query "SecretString" \
  --output text | python3 -m json.tool
```

### 2.5 Update a secret later

```bash
# Update TEST
aws secretsmanager update-secret \
  --secret-id "veracis/test/secrets" \
  --region us-east-1 \
  --secret-string '{"DATABASE_URL":"new-value", ...}'

# Update PROD
aws secretsmanager update-secret \
  --secret-id "veracis/prod/secrets" \
  --region us-east-1 \
  --secret-string '{"DATABASE_URL":"new-value", ...}'
```

> **Tip:** To add or change a single key without rewriting the whole secret,
> fetch the current value, edit it locally, then push the updated JSON back.

---

## 3. AWS – IAM Permissions

The IAM role used by the Azure DevOps service connection (`veracis-aws-oidc`)
must have the following permissions.

### 3.1 Minimum IAM policy

Create or update the policy attached to the OIDC role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRAuth",
      "Effect": "Allow",
      "Action": ["ecr:GetAuthorizationToken"],
      "Resource": "*"
    },
    {
      "Sid": "ECRImages",
      "Effect": "Allow",
      "Action": [
        "ecr:DescribeImages",
        "ecr:BatchGetImage",
        "ecr:GetDownloadUrlForLayer"
      ],
      "Resource": "arn:aws:ecr:us-east-1:123456789012:repository/veracis-api"
    },
    {
      "Sid": "ECSTaskDefinition",
      "Effect": "Allow",
      "Action": [
        "ecs:DescribeTaskDefinition",
        "ecs:RegisterTaskDefinition"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ECSService",
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:DescribeTasks",
        "ecs:ListTasks"
      ],
      "Resource": [
        "arn:aws:ecs:us-east-1:123456789012:cluster/veracis-test-cluster",
        "arn:aws:ecs:us-east-1:123456789012:cluster/veracis-prod-cluster",
        "arn:aws:ecs:us-east-1:123456789012:service/veracis-test-cluster/veracis-api-test",
        "arn:aws:ecs:us-east-1:123456789012:service/veracis-prod-cluster/veracis-api-prod"
      ]
    },
    {
      "Sid": "SecretsManager",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:123456789012:secret:veracis/test/secrets-*",
        "arn:aws:secretsmanager:us-east-1:123456789012:secret:veracis/prod/secrets-*"
      ]
    },
    {
      "Sid": "PassRole",
      "Effect": "Allow",
      "Action": ["iam:PassRole"],
      "Resource": [
        "arn:aws:iam::123456789012:role/veracis-ecs-task-execution-role",
        "arn:aws:iam::123456789012:role/veracis-ecs-task-role"
      ]
    }
  ]
}
```

> **Important:** Replace `123456789012` with your real AWS account ID, and
> update the role ARNs in `PassRole` to match the roles attached to your ECS
> task definitions.

### 3.2 Apply the policy via CLI

```bash
# Save the JSON above to a file
cat > /tmp/veracis-cd-policy.json << 'EOF'
{ ... paste the JSON above ... }
EOF

# Create the policy
aws iam create-policy \
  --policy-name "VeracisApiCDPolicy" \
  --policy-document file:///tmp/veracis-cd-policy.json \
  --region us-east-1

# Attach it to the OIDC role
aws iam attach-role-policy \
  --role-name "your-oidc-role-name" \
  --policy-arn "arn:aws:iam::123456789012:policy/VeracisApiCDPolicy"
```

---

## 4. Azure DevOps – Variable Groups

Go to: **Pipelines → Library → + Variable group**

### 4.1 Group: `Veracis-Api-Registry`

Shared by both TEST and PROD stages.

| Variable name           | Example value                                          | Secret? |
|-------------------------|--------------------------------------------------------|---------|
| `ECR_REGISTRY`          | `123456789012.dkr.ecr.us-east-1.amazonaws.com`         | No      |
| `ECR_REPOSITORY`        | `veracis-api`                                          | No      |
| `AWS_REGION`            | `us-east-1`                                            | No      |
| `AWS_SERVICE_CONNECTION`| `veracis-aws-oidc`                                     | No      |

**Steps:**
1. Click **+ Variable group**
2. Name: `Veracis-Api-Registry`
3. Add each variable from the table above
4. Click **Save**

---

### 4.2 Group: `Veracis-Api-Deploy-Test`

TEST environment deployment configuration.

| Variable name                  | Example value                              | Secret? |
|--------------------------------|--------------------------------------------|---------|
| `ECS_CLUSTER`                  | `veracis-test-cluster`                     | No      |
| `ECS_SERVICE`                  | `veracis-api-test`                         | No      |
| `ECS_TASK_DEFINITION_FAMILY`   | `veracis-api-test`                         | No      |
| `ECS_CONTAINER_NAME`           | `veracis-api`                              | No      |
| `SECRETS_MANAGER_SECRET_NAME`  | `veracis/test/secrets`                     | No      |
| `HEALTH_CHECK_URL`             | `https://test-api.veracis.com/health`      | No      |

**Steps:**
1. Click **+ Variable group**
2. Name: `Veracis-Api-Deploy-Test`
3. Add each variable from the table above
4. Click **Save**

---

### 4.3 Group: `Veracis-Api-Deploy-Prod`

PROD environment deployment configuration.

| Variable name                  | Example value                         | Secret? |
|--------------------------------|---------------------------------------|---------|
| `ECS_CLUSTER`                  | `veracis-prod-cluster`                | No      |
| `ECS_SERVICE`                  | `veracis-api-prod`                    | No      |
| `ECS_TASK_DEFINITION_FAMILY`   | `veracis-api-prod`                    | No      |
| `ECS_CONTAINER_NAME`           | `veracis-api`                         | No      |
| `SECRETS_MANAGER_SECRET_NAME`  | `veracis/prod/secrets`                | No      |
| `HEALTH_CHECK_URL`             | `https://api.veracis.com/health`      | No      |

**Steps:**
1. Click **+ Variable group**
2. Name: `Veracis-Api-Deploy-Prod`
3. Add each variable from the table above
4. Click **Save**

---

### 4.4 Pipeline permission for variable groups

After creating the groups, grant pipeline access:

1. Open the variable group
2. Click **Pipeline permissions**
3. Click **+** and select your CD pipeline (`API - CD`)
4. Repeat for all three groups

---

## 5. Azure DevOps – Environments & Approval Gates

Go to: **Pipelines → Environments**

### 5.1 Environment: `testing`

Used by the TEST stage – **no approval gate** (deploys automatically).

1. Click **New environment**
2. Name: `testing`
3. Resource: **None**
4. Click **Create**
5. Leave **no approvals** configured

### 5.2 Environment: `api-prod`

Used by the PROD stage – **requires manual approval**.

1. Click **New environment**
2. Name: `api-prod`
3. Resource: **None**
4. Click **Create**
5. Open the environment → **...** menu → **Approvals and checks**
6. Click **+** → **Approvals**
7. Add the **approvers** (QA lead, tech lead, etc.)
8. Set **Timeout**: `1 day` (or as appropriate)
9. Optional: check **"Requester should not approve their own run"**
10. Click **Create**

> The PROD stage will pause and send a notification to approvers after TEST
> succeeds. The pipeline resumes only when someone approves it.

---

## 6. Azure DevOps – Service Connection

The service connection `veracis-aws-oidc` must already exist and use **AWS
credentials via OIDC (OpenID Connect)** or an IAM user access key.

### 6.1 Verify it exists

Go to: **Project Settings → Service connections**

Look for `veracis-aws-oidc`. If it exists, verify the role/credentials have
the permissions from [Section 3](#3-aws--iam-permissions).

### 6.2 Create it (if missing)

**Option A – OIDC (recommended for security):**

1. Go to **Project Settings → Service connections → New service connection**
2. Select **AWS for .NET** or use the **AWSShellScript** extension connection type
3. Configure OIDC federation:
   - In AWS, create an OIDC identity provider for Azure DevOps
   - Create an IAM role with a trust policy for the Azure DevOps issuer
   - Set the role ARN in the service connection
4. Name it: `veracis-aws-oidc`

**Option B – IAM Access Key (simpler but less secure):**

1. In AWS, create an IAM user with the policy from Section 3
2. Generate an access key for that user
3. In Azure DevOps: **New service connection → AWS**
4. Enter the Access Key ID and Secret Access Key
5. Set Region: `us-east-1`
6. Name it: `veracis-aws-oidc`

> **Note:** The `AWSShellScript@1` task requires the
> [AWS Toolkit for Azure DevOps](https://marketplace.visualstudio.com/items?itemName=AmazonWebServices.aws-vsts-tools)
> extension installed in your Azure DevOps organisation.

---

## 7. Pipeline Flow Reference

```
git push → main
     │
     ▼
┌─────────────────────────────────────┐
│  CI Pipeline  (ci-pipeline.yml)     │
│                                     │
│  1. Build Docker image              │
│  2. Tag: <sha>  +  latest           │
│  3. Push both tags → ECR            │
│  4. Publish artifact: docker-image  │
│  5. Publish artifact: build-info    │
└─────────────────┬───────────────────┘
                  │  triggers automatically
                  ▼
┌─────────────────────────────────────┐
│  CD Stage 1 – TEST (automatic)      │
│                                     │
│  1. Download build-info.json        │
│  2. Validate all required vars      │
│  3. Verify image in ECR             │
│  4. Load secrets → Secrets Manager  │
│     (veracis/test/secrets)          │
│  5. Register new Task Definition    │
│     image + env vars injected       │
│  6. Update ECS Service              │
│  7. Wait for steady state           │
│  8. Health check                    │
│  9. Rollback on failure (auto)      │
└─────────────────┬───────────────────┘
                  │
                  ▼
         ⏸️  APPROVAL GATE
         (QA validates TEST)
         Azure DevOps notifies
         approvers via email
                  │
        [ Approved by reviewer ]
                  │
                  ▼
┌─────────────────────────────────────┐
│  CD Stage 2 – PROD (after approval) │
│                                     │
│  Same steps as TEST but using:      │
│  • veracis/prod/secrets             │
│  • PROD cluster / service           │
│  • PROD task definition             │
└─────────────────────────────────────┘
```

### What gets injected into ECS

The pipeline fetches the secret JSON from Secrets Manager and converts it into
ECS container environment variables:

```
Secret JSON stored in Secrets Manager:
{
  "DATABASE_URL": "postgresql://...",
  "JWT_SECRET":   "abc123..."
}

         │
         ▼  pipeline transforms to

ECS Task Definition → containerDefinitions[0].environment:
[
  { "name": "DATABASE_URL", "value": "postgresql://..." },
  { "name": "JWT_SECRET",   "value": "abc123..."       }
]
```

Existing environment variables in the task definition that are **not** in the
secret are preserved (merge strategy). Secret values always take precedence.

---

## 8. Troubleshooting

### ❌ `AccessDeniedException` when fetching secret

**Symptom:**
```
An error occurred (AccessDeniedException) when calling the GetSecretValue operation
```

**Fix:**
- Confirm the IAM role has `secretsmanager:GetSecretValue` on the exact ARN
- Check that the secret name matches exactly (case-sensitive): `veracis/test/secrets`
- Make sure the secret exists in the **same region** as `AWS_REGION`

---

### ❌ `Secret returned empty value`

**Symptom:** Pipeline exits at the "Load secrets" step with:
```
❌ Secret 'veracis/test/secrets' returned empty value!
```

**Fix:**
```bash
# Verify the secret has content
aws secretsmanager get-secret-value \
  --secret-id veracis/test/secrets \
  --region us-east-1 \
  --query SecretString \
  --output text
```
If the output is empty or `None`, update the secret:
```bash
aws secretsmanager put-secret-value \
  --secret-id veracis/test/secrets \
  --region us-east-1 \
  --secret-string '{"DATABASE_URL":"...", "NODE_ENV":"test"}'
```

---

### ❌ Variable group not found / variable empty

**Symptom:** A step fails saying a variable like `ECS_CLUSTER` is empty.

**Fix:**
1. Confirm the variable group name matches exactly (case-sensitive)
2. Go to the variable group → **Pipeline permissions** → grant access to the CD pipeline
3. Confirm the variable name spelling in the group matches the `$(VAR_NAME)` reference in the YAML

---

### ❌ `NoSuchEntityException` on `iam:PassRole`

**Symptom:** Task definition registration fails with a PassRole error.

**Fix:**
- The IAM role attached to the service connection needs `iam:PassRole` for the
  **task execution role** and **task role** referenced in the task definition.
- Find the role names:
  ```bash
  aws ecs describe-task-definition \
    --task-definition veracis-api-test \
    --query 'taskDefinition.{exec:executionRoleArn,task:taskRoleArn}'
  ```
- Add both ARNs to the `PassRole` statement in Section 3.

---

### ❌ Deployment fails to reach steady state

**Symptom:**
```
❌ Service did not reach desired task count!
```

**Fix:**
1. Check CloudWatch Logs for the container's error output:
   ```bash
   aws logs tail /ecs/veracis-api-test --follow --region us-east-1
   ```
2. Check ECS service events:
   ```bash
   aws ecs describe-services \
     --cluster veracis-test-cluster \
     --services veracis-api-test \
     --region us-east-1 \
     --query 'services[0].events[:5]'
   ```
3. Common causes: missing environment variable, wrong DB URL, container crash on startup.

The pipeline will **automatically roll back** to the previous task definition
if this step fails.

---

### ❌ Health check fails (HTTP 000 or 5xx)

**Symptom:**
```
❌ Health check failed after 15 attempts!
```

**Fix:**
1. Verify the container started correctly (see CloudWatch Logs above)
2. Confirm `HEALTH_CHECK_URL` points to the correct endpoint (e.g. `/health` not `/`)
3. Check that the ECS security group allows inbound traffic on the container port
4. If the load balancer target group is unhealthy, check its health check settings

---

### ❌ `AWSShellScript@1` task not found

**Symptom:**
```
##[error] Task 'AWSShellScript' not found
```

**Fix:**
Install the AWS Toolkit extension in your Azure DevOps organisation:
[https://marketplace.visualstudio.com/items?itemName=AmazonWebServices.aws-vsts-tools](https://marketplace.visualstudio.com/items?itemName=AmazonWebServices.aws-vsts-tools)

---

## Checklist

Use this checklist before triggering the pipeline for the first time:

### AWS
- [ ] Secret `veracis/test/secrets` created with all required keys
- [ ] Secret `veracis/prod/secrets` created with all required keys
- [ ] IAM policy `VeracisApiCDPolicy` created and attached to the OIDC role
- [ ] Verified with: `aws secretsmanager get-secret-value --secret-id veracis/test/secrets`

### Azure DevOps
- [ ] Variable group `Veracis-Api-Registry` created with all 4 variables
- [ ] Variable group `Veracis-Api-Deploy-Test` created with all 6 variables
- [ ] Variable group `Veracis-Api-Deploy-Prod` created with all 6 variables
- [ ] All 3 variable groups granted pipeline permission for the CD pipeline
- [ ] Environment `testing` created (no approval)
- [ ] Environment `api-prod` created with approval gate configured
- [ ] Service connection `veracis-aws-oidc` exists and is working

### Pipeline
- [ ] CI pipeline (`API - CI`) name matches the `source:` field in `cd-pipeline.yml`
- [ ] CD pipeline registered in Azure DevOps pointing to `.pipelines/api/cd-pipeline.yml`
- [ ] Test run: trigger CI manually, verify CD runs automatically for TEST
- [ ] Approve PROD gate and verify PROD deployment completes
- [ ] Health checks return `200 OK` on both TEST and PROD URLs
