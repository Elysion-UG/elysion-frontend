> **ARCHIVIERT** — Dieses Dokument stammt aus der Planungsphase (Februar 2026) und beschreibt AWS-Infrastruktur (ECS, RDS, CloudFront), die nie aufgebaut wurde. Tatsächliches Deployment: Render.com (`marketplace-backend-1-1w30.onrender.com`). Aktuelle Dokumentation: [README.md](../../README.md)

# Deployment-Guide

## AWS Infrastructure Setup

**Version:** 1.0  
**Cloud Provider:** AWS  
**Ziel:** Production-Ready Deployment

---

## Übersicht

Dieses Dokument beschreibt Schritt-für-Schritt das Setup der AWS-Infrastruktur für die Nachhaltigkeits-Plattform.

### Architektur-Übersicht

```
Internet (Route 53)
       │
       ▼
   CloudFront (CDN)
       │
       ├─────► S3 (Frontend Static Files)
       │
       ▼
   ALB (Load Balancer)
       │
       ▼
   ECS Fargate (Backend Container)
       │
       ├─────► RDS PostgreSQL (Database)
       ├─────► ElastiCache Redis (Cache)
       └─────► S3 (File Uploads)
```

---

## Voraussetzungen

### 1. AWS-Account

- [ ] AWS-Account erstellen
- [ ] IAM-User mit Admin-Rechten erstellen
- [ ] AWS CLI installieren & konfigurieren

```bash
aws configure
# AWS Access Key ID: [Dein Key]
# AWS Secret Access Key: [Dein Secret]
# Default region: eu-central-1
# Default output format: json
```

### 2. Tools installieren

```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Terraform (optional, für Infrastructure as Code)
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose
```

---

## Phase 1: Netzwerk & VPC

### 1.1 VPC erstellen

```bash
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=sustainability-vpc}]'

# VPC-ID notieren (z.B. vpc-12345678)
```

### 1.2 Subnets erstellen

**Public Subnet (für ALB):**

```bash
aws ec2 create-subnet \
  --vpc-id vpc-12345678 \
  --cidr-block 10.0.1.0/24 \
  --availability-zone eu-central-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=public-subnet-1a}]'

aws ec2 create-subnet \
  --vpc-id vpc-12345678 \
  --cidr-block 10.0.2.0/24 \
  --availability-zone eu-central-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=public-subnet-1b}]'
```

**Private Subnet (für ECS, RDS):**

```bash
aws ec2 create-subnet \
  --vpc-id vpc-12345678 \
  --cidr-block 10.0.10.0/24 \
  --availability-zone eu-central-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=private-subnet-1a}]'

aws ec2 create-subnet \
  --vpc-id vpc-12345678 \
  --cidr-block 10.0.11.0/24 \
  --availability-zone eu-central-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=private-subnet-1b}]'
```

### 1.3 Internet Gateway

```bash
aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=sustainability-igw}]'

aws ec2 attach-internet-gateway \
  --vpc-id vpc-12345678 \
  --internet-gateway-id igw-12345678
```

### 1.4 Route Tables

**Public Route Table:**

```bash
aws ec2 create-route-table \
  --vpc-id vpc-12345678 \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=public-rt}]'

aws ec2 create-route \
  --route-table-id rtb-12345678 \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id igw-12345678

# Associate with public subnets
aws ec2 associate-route-table --subnet-id subnet-public-1a --route-table-id rtb-12345678
aws ec2 associate-route-table --subnet-id subnet-public-1b --route-table-id rtb-12345678
```

### 1.5 NAT Gateway (für Private Subnets)

```bash
# Elastic IP erstellen
aws ec2 allocate-address --domain vpc

# NAT Gateway erstellen
aws ec2 create-nat-gateway \
  --subnet-id subnet-public-1a \
  --allocation-id eipalloc-12345678

# Private Route Table
aws ec2 create-route-table \
  --vpc-id vpc-12345678 \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=private-rt}]'

aws ec2 create-route \
  --route-table-id rtb-private-12345678 \
  --destination-cidr-block 0.0.0.0/0 \
  --nat-gateway-id nat-12345678
```

---

## Phase 2: Datenbank (RDS PostgreSQL)

### 2.1 DB Subnet Group

```bash
aws rds create-db-subnet-group \
  --db-subnet-group-name sustainability-db-subnet \
  --db-subnet-group-description "Subnet group for sustainability platform" \
  --subnet-ids subnet-private-1a subnet-private-1b
```

### 2.2 Security Group (RDS)

```bash
aws ec2 create-security-group \
  --group-name sustainability-rds-sg \
  --description "Security group for RDS" \
  --vpc-id vpc-12345678

# Erlauben von PostgreSQL-Zugriff (nur von ECS)
aws ec2 authorize-security-group-ingress \
  --group-id sg-rds-12345678 \
  --protocol tcp \
  --port 5432 \
  --source-group sg-ecs-12345678
```

### 2.3 RDS Instance erstellen

```bash
aws rds create-db-instance \
  --db-instance-identifier sustainability-db \
  --db-instance-class db.t3.micro \  # Für MVP, später db.t3.small oder größer
  --engine postgres \
  --engine-version 14.9 \
  --master-username postgres \
  --master-user-password 'CHANGE_ME_STRONG_PASSWORD' \
  --allocated-storage 20 \
  --storage-type gp3 \
  --db-subnet-group-name sustainability-db-subnet \
  --vpc-security-group-ids sg-rds-12345678 \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --publicly-accessible false \
  --multi-az false \  # Für Production: true
  --storage-encrypted \
  --enable-cloudwatch-logs-exports '["postgresql"]'

# Endpoint notieren für später (z.B. sustainability-db.xxxx.eu-central-1.rds.amazonaws.com)
```

**Kosten:** ~30 EUR/Monat (db.t3.micro)

---

## Phase 3: Cache (ElastiCache Redis)

### 3.1 Cache Subnet Group

```bash
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name sustainability-cache-subnet \
  --cache-subnet-group-description "Subnet for Redis" \
  --subnet-ids subnet-private-1a subnet-private-1b
```

### 3.2 Security Group (Redis)

```bash
aws ec2 create-security-group \
  --group-name sustainability-redis-sg \
  --description "Security group for Redis" \
  --vpc-id vpc-12345678

aws ec2 authorize-security-group-ingress \
  --group-id sg-redis-12345678 \
  --protocol tcp \
  --port 6379 \
  --source-group sg-ecs-12345678
```

### 3.3 Redis Cluster erstellen

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id sustainability-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name sustainability-cache-subnet \
  --security-group-ids sg-redis-12345678

# Endpoint notieren
```

**Kosten:** ~15 EUR/Monat (cache.t3.micro)

---

## Phase 4: File Storage (S3)

### 4.1 Buckets erstellen

```bash
# Bucket für Uploads (Produktbilder, Zertifikate)
aws s3api create-bucket \
  --bucket sustainability-uploads-prod \
  --region eu-central-1 \
  --create-bucket-configuration LocationConstraint=eu-central-1

# Bucket für Frontend (Static Files)
aws s3api create-bucket \
  --bucket sustainability-frontend-prod \
  --region eu-central-1 \
  --create-bucket-configuration LocationConstraint=eu-central-1

# Versioning aktivieren (für Uploads)
aws s3api put-bucket-versioning \
  --bucket sustainability-uploads-prod \
  --versioning-configuration Status=Enabled

# Lifecycle Policy (alte Versionen nach 90 Tagen löschen)
cat > lifecycle.json <<EOF
{
  "Rules": [
    {
      "Id": "DeleteOldVersions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 90
      }
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket sustainability-uploads-prod \
  --lifecycle-configuration file://lifecycle.json
```

### 4.2 CORS konfigurieren (für Uploads)

```bash
cat > cors.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://yourplatform.com"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket sustainability-uploads-prod \
  --cors-configuration file://cors.json
```

### 4.3 IAM Policy für S3-Zugriff

```bash
cat > s3-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::sustainability-uploads-prod/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::sustainability-uploads-prod"
    }
  ]
}
EOF

aws iam create-policy \
  --policy-name SustainabilityS3Access \
  --policy-document file://s3-policy.json
```

**Kosten:** ~5-10 EUR/Monat (abhängig von Traffic)

---

## Phase 5: Container Registry (ECR)

```bash
aws ecr create-repository \
  --repository-name sustainability/backend \
  --image-scanning-configuration scanOnPush=true \
  --region eu-central-1

# Login zu ECR
aws ecr get-login-password --region eu-central-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.eu-central-1.amazonaws.com

# Image bauen & pushen
cd backend
docker build -t sustainability/backend:latest .
docker tag sustainability/backend:latest \
  123456789012.dkr.ecr.eu-central-1.amazonaws.com/sustainability/backend:latest
docker push 123456789012.dkr.ecr.eu-central-1.amazonaws.com/sustainability/backend:latest
```

---

## Phase 6: ECS (Elastic Container Service)

### 6.1 ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name sustainability-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy \
    capacityProvider=FARGATE,weight=1 \
    capacityProvider=FARGATE_SPOT,weight=4
```

### 6.2 Task Definition

```json
{
  "family": "sustainability-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "123456789012.dkr.ecr.eu-central-1.amazonaws.com/sustainability/backend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:eu-central-1:123456789012:secret:db-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:eu-central-1:123456789012:secret:jwt-secret"
        },
        {
          "name": "STRIPE_SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:eu-central-1:123456789012:secret:stripe-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/sustainability-backend",
          "awslogs-region": "eu-central-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

```bash
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json
```

### 6.3 ECS Service

```bash
aws ecs create-service \
  --cluster sustainability-cluster \
  --service-name backend-service \
  --task-definition sustainability-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-private-1a,subnet-private-1b],securityGroups=[sg-ecs-12345678],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=3000" \
  --health-check-grace-period-seconds 60
```

**Kosten:** ~50-70 EUR/Monat (2 Tasks à 0.5 vCPU, 1GB RAM)

---

## Phase 7: Load Balancer (ALB)

### 7.1 Security Group

```bash
aws ec2 create-security-group \
  --group-name sustainability-alb-sg \
  --description "Security group for ALB" \
  --vpc-id vpc-12345678

# HTTPS (443) von überall
aws ec2 authorize-security-group-ingress \
  --group-id sg-alb-12345678 \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# HTTP (80) von überall (für Redirect zu HTTPS)
aws ec2 authorize-security-group-ingress \
  --group-id sg-alb-12345678 \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0
```

### 7.2 ALB erstellen

```bash
aws elbv2 create-load-balancer \
  --name sustainability-alb \
  --subnets subnet-public-1a subnet-public-1b \
  --security-groups sg-alb-12345678 \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4
```

### 7.3 Target Group

```bash
aws elbv2 create-target-group \
  --name sustainability-backend-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-12345678 \
  --target-type ip \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3
```

### 7.4 Listener (HTTPS)

```bash
# SSL-Zertifikat vorher in ACM erstellen
aws acm request-certificate \
  --domain-name api.yourplatform.com \
  --validation-method DNS \
  --region eu-central-1

# Listener erstellen
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...

# HTTP → HTTPS Redirect
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig={Protocol=HTTPS,Port=443,StatusCode=HTTP_301}
```

**Kosten:** ~20 EUR/Monat (ALB)

---

## Phase 8: CloudFront (CDN)

### 8.1 Frontend zu S3 deployen

```bash
cd frontend
npm run build

aws s3 sync out/ s3://sustainability-frontend-prod/ --delete
```

### 8.2 CloudFront Distribution

```bash
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

**cloudfront-config.json:**

```json
{
  "CallerReference": "sustainability-frontend-2026",
  "Aliases": {
    "Quantity": 1,
    "Items": ["yourplatform.com"]
  },
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-sustainability-frontend",
        "DomainName": "sustainability-frontend-prod.s3.eu-central-1.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": "origin-access-identity/cloudfront/E..."
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-sustainability-frontend",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "Compress": true,
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "ViewerCertificate": {
    "ACMCertificateArn": "arn:aws:acm:us-east-1:...",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "Enabled": true
}
```

**Kosten:** ~5-15 EUR/Monat (abhängig von Traffic)

---

## Phase 9: Domain & DNS (Route 53)

### 9.1 Hosted Zone

```bash
aws route53 create-hosted-zone \
  --name yourplatform.com \
  --caller-reference 2026-02-06
```

### 9.2 DNS Records

```bash
# A-Record für Frontend (CloudFront)
cat > change-batch-frontend.json <<EOF
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "yourplatform.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d123456789.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456789 \
  --change-batch file://change-batch-frontend.json

# A-Record für API (ALB)
cat > change-batch-api.json <<EOF
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.yourplatform.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z215JYRZR1TBD5",
          "DNSName": "sustainability-alb-123456789.eu-central-1.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456789 \
  --change-batch file://change-batch-api.json
```

**Kosten:** ~0.50 EUR/Monat (Hosted Zone)

---

## Phase 10: Secrets Manager

```bash
# Database URL
aws secretsmanager create-secret \
  --name sustainability/db-url \
  --secret-string "postgresql://postgres:PASSWORD@sustainability-db.xxxx.rds.amazonaws.com:5432/sustainability"

# JWT Secret
aws secretsmanager create-secret \
  --name sustainability/jwt-secret \
  --secret-string "RANDOM_STRONG_SECRET_KEY_HERE"

# Stripe
aws secretsmanager create-secret \
  --name sustainability/stripe-secret \
  --secret-string "sk_live_..."
```

**Kosten:** ~1 EUR/Monat (3 Secrets)

---

## Phase 11: Monitoring & Logs

### 11.1 CloudWatch Log Group

```bash
aws logs create-log-group \
  --log-group-name /ecs/sustainability-backend

aws logs put-retention-policy \
  --log-group-name /ecs/sustainability-backend \
  --retention-in-days 7
```

### 11.2 CloudWatch Alarms

```bash
# CPU-Alarm (wenn > 80% für 5 Min)
aws cloudwatch put-metric-alarm \
  --alarm-name sustainability-high-cpu \
  --alarm-description "CPU utilization > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ServiceName,Value=backend-service \
  --alarm-actions arn:aws:sns:eu-central-1:123456789012:alerts

# Error-Rate-Alarm (wenn > 10 Errors/Min)
aws cloudwatch put-metric-alarm \
  --alarm-name sustainability-high-error-rate \
  --metric-name 5XXError \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 60 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:eu-central-1:123456789012:alerts
```

### 11.3 SNS für Alerts

```bash
aws sns create-topic --name sustainability-alerts

aws sns subscribe \
  --topic-arn arn:aws:sns:eu-central-1:123456789012:sustainability-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com
```

---

## Kosten-Übersicht (Production)

| Service               | Typ                       | Kosten/Monat       |
| --------------------- | ------------------------- | ------------------ |
| **RDS PostgreSQL**    | db.t3.small               | ~50 EUR            |
| **ElastiCache Redis** | cache.t3.micro            | ~15 EUR            |
| **ECS Fargate**       | 2 Tasks (0.5 vCPU, 1GB)   | ~60 EUR            |
| **ALB**               | Application Load Balancer | ~20 EUR            |
| **S3**                | Storage + Transfer        | ~10 EUR            |
| **CloudFront**        | CDN                       | ~10 EUR            |
| **Route 53**          | Hosted Zone + Queries     | ~1 EUR             |
| **Secrets Manager**   | 3 Secrets                 | ~1 EUR             |
| **CloudWatch**        | Logs + Metrics            | ~5 EUR             |
| **NAT Gateway**       | Data Transfer             | ~35 EUR            |
| **Gesamt**            |                           | **~207 EUR/Monat** |

**Hinweis:** Preise sind Schätzungen für eu-central-1 (Frankfurt) und können variieren.

---

## Auto-Scaling (Production)

### ECS Auto-Scaling

```bash
# Target Tracking Scaling Policy
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/sustainability-cluster/backend-service \
  --min-capacity 2 \
  --max-capacity 10

aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/sustainability-cluster/backend-service \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

**scaling-policy.json:**

```json
{
  "TargetValue": 75.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  },
  "ScaleInCooldown": 300,
  "ScaleOutCooldown": 60
}
```

---

## Backup & Disaster Recovery

### RDS Automated Backups

- **Retention:** 7 Tage
- **Backup-Window:** 03:00-04:00 UTC
- **Snapshots:** Wöchentlich manuell vor großen Deployments

### S3 Versioning

- **Uploads-Bucket:** Versioning enabled
- **Lifecycle:** Alte Versionen nach 90 Tagen löschen

### Disaster Recovery Plan

**RTO (Recovery Time Objective):** 4 Stunden  
**RPO (Recovery Point Objective):** 24 Stunden

**Recovery-Schritte:**

1. RDS Snapshot wiederherstellen (30 Min)
2. ECS Service neu deployen (10 Min)
3. DNS umschalten (propagation: 1-2h)
4. Smoke-Tests (30 Min)

---

## CI/CD Integration

Siehe GitHub Actions Workflow in Repository (`.github/workflows/deploy.yml`)

**Trigger:**

- Push to `main` → Deploy to Staging
- Manual Trigger → Deploy to Production

**Schritte:**

1. Build Docker Image
2. Push to ECR
3. Update ECS Task Definition
4. Deploy to ECS
5. Smoke Tests
6. Rollback bei Fehler

---

## Nächste Schritte

1. [ ] Alle Schritte in dieser Anleitung durchführen
2. [ ] Smoke-Tests durchführen
3. [ ] Load-Tests (k6 oder Artillery)
4. [ ] Security-Audit (AWS Inspector)
5. [ ] Kosten optimieren (Reserved Instances für RDS)
6. [ ] Monitoring-Dashboards erstellen (CloudWatch + Grafana)

---

**Bei Fragen:** AWS Support oder Community-Foren konsultieren
