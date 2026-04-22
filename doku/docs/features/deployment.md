---
sidebar_position: 7
title: Deployment
---

# Deployment

Deployment is the process of taking your generated code and making it live for users. Scoriet streamlines this entire process, from preparation through monitoring, supporting deployment to various platforms and environments.

## Understanding Deployment in Scoriet

Deployment involves several stages:

1. **Preparation**: Ensure your code is ready
2. **Configuration**: Set up environment variables and databases
3. **Build**: Compile and package your application
4. **Deploy**: Push to production
5. **Verification**: Test in production
6. **Monitoring**: Watch for issues

<div class="screenshot-placeholder">Screenshot: Deployment dashboard showing deployment history and status — <code>deployment-dashboard.png</code></div>

## Deployment Preparation

### Pre-Deployment Checklist

Before deploying, verify:

- [ ] **Code generated successfully** from your templates
- [ ] **All translations complete** (or fallback language set)
- [ ] **Database migrations ready** (if needed)
- [ ] **Environment variables configured**
- [ ] **API keys and credentials secured**
- [ ] **Dependencies updated** to latest secure versions
- [ ] **Tests passing** (if applicable)
- [ ] **Build succeeds** without errors
- [ ] **Security scan** completed
- [ ] **Performance baseline** measured

### Environment Setup

Configure separate environments:

**Development**
- Local machine or development server
- Unrestricted access
- Use test data
- Detailed logging

**Staging**
- Pre-production environment
- Same infrastructure as production
- Production data (sanitized)
- Full testing before release
- Monitor performance

**Production**
- Live environment, users access
- Restricted access
- Real data
- Error logging only
- Peak performance required

Each environment has its own:
- Database
- API endpoints
- Configuration files
- Credentials
- SSL certificates

## Opening the Deployment Manager

To deploy your application:

1. **Click Deployment icon** in dock
2. **Or go to Tools > Deployment**
3. **Deployment Manager opens**
4. **Select deployment target** (where to deploy)
5. **Configure settings**
6. **Start deployment**

## Deployment Targets

### Supported Platforms

Scoriet supports deployment to various platforms:

#### Cloud Platforms
- **AWS**: EC2, Elastic Beanstalk, Lambda, RDS
- **Google Cloud**: App Engine, Cloud Run, Compute Engine
- **Microsoft Azure**: App Service, Virtual Machines
- **Heroku**: Easy push-button deployment
- **DigitalOcean**: Droplets, App Platform
- **Vercel** (for Next.js/frontend): Zero-config deployment
- **Netlify** (for JAMstack): Static site hosting + Functions

#### Traditional Hosting
- **Shared Hosting**: FTP or SSH deployment
- **VPS**: Virtual Private Servers
- **Dedicated Servers**: Full control
- **On-Premises**: Your own infrastructure
- **Docker**: Container-based deployment

#### Headless/Serverless
- **AWS Lambda**: Serverless functions
- **Google Cloud Functions**: Event-driven functions
- **Azure Functions**: Serverless compute

### Adding a Deployment Target

1. **Click "Add Target"**
2. **Select platform type**
3. **Name your target** (e.g., "Production AWS", "Staging Heroku")
4. **Enter credentials/connection details**:
   - For cloud: API keys or authentication
   - For traditional: SSH credentials
   - For Docker: Registry information
5. **Test connection** to verify
6. **Save target**

Example: AWS Deployment Target

```
Target Name: Production AWS
Platform: AWS Elastic Beanstalk
Region: us-east-1
Environment: eb-production
IAM Access Key: [hidden]
IAM Secret Key: [hidden]
RDS Database: production-db
RDS Endpoint: db.example.rds.amazonaws.com
```

## Configuring Deployment

### Build Configuration

Specify how to build your application:

```
Language: PHP (Laravel)
Node Version: 18.x
PHP Version: 8.2
Build Steps:
  1. composer install
  2. npm install
  3. npm run build
  4. php artisan migrate
  5. php artisan optimize
```

### Environment Variables

Set variables for your application:

```
APP_NAME=MyApp
APP_ENV=production
APP_DEBUG=false
APP_URL=https://myapp.com

DB_CONNECTION=mysql
DB_HOST=db.example.com
DB_PORT=3306
DB_DATABASE=production_db
DB_USERNAME=app_user
DB_PASSWORD=[Vault encrypted]

API_KEY=[Vault encrypted]
STRIPE_PUBLIC_KEY=[Vault encrypted]
STRIPE_SECRET_KEY=[Vault encrypted]

LOG_LEVEL=error
LOG_CHANNEL=stack
```

**Security**: Sensitive values are stored in Vault and never shown in logs.

### Database Migrations

If your app requires database schema changes:

```
Migration 1: Create users table
Migration 2: Create posts table
Migration 3: Add foreign keys
Migration 4: Create indexes
```

Select which migrations to run on deployment.

### Health Checks

Configure health checks that verify deployment success:

```
Health Checks:
├─ HTTP 200 status on /
├─ Database connectivity test
├─ API endpoint responds
├─ Static files accessible
└─ Email service available
```

Deployment succeeds only if all checks pass.

## Starting a Deployment

### Deployment Steps

```
1. Review changes
   ↓
2. Confirm deployment
   ↓
3. Create backup (optional)
   ↓
4. Run pre-deployment tasks
   ↓
5. Build application
   ↓
6. Run migrations
   ↓
7. Deploy code
   ↓
8. Run health checks
   ↓
9. Warm up caches
   ↓
10. Complete & notify team
```

### Starting Deployment

1. **Click "Deploy Now"** or schedule deployment
2. **Review changes** since last deployment
3. **Check deployment target** (Production? Really?)
4. **Click "Confirm Deployment"**
5. **Watch deployment progress**:
   - Build log output
   - Deployment status
   - Health check results
6. **Success or error** message shown
7. **Rollback available** if something fails

<div class="screenshot-placeholder">Screenshot: Deployment progress showing build steps and status — <code>deployment-progress.png</code></div>

## Deployment Strategies

### Blue-Green Deployment

Two identical production environments. Deploy to one while other serves users, then switch:

```
Before:
Users → [BLUE Production]
       [GREEN Staging]

Deploy to GREEN...

After:
Users → [GREEN Production]
       [BLUE Staging]
```

**Benefits**: Zero downtime, quick rollback if needed

### Canary Deployment

Roll out to small percentage of users first:

```
95% traffic → Old Version (stable)
5% traffic → New Version (canary)

Monitor for errors...

If good:
100% traffic → New Version
```

**Benefits**: Catch issues before full rollout

### Rolling Deployment

Gradually replace old version with new:

```
Time:      0%    25%    50%    75%    100%
────────────────────────────────────────
Server 1:  Old → Old  → New → New  → New
Server 2:  Old → Old  → New → New  → New
Server 3:  Old → Old  → Old → New  → New
Server 4:  Old → Old  → Old → New  → New

Users:    ✓ No downtime, always some servers running
```

**Benefits**: Gradual rollout, no downtime

### Recreate Deployment

Stop old, start new:

```
Timeline: Stop All → Build New → Start New

Downtime: Minimal (seconds to minutes)
```

**Benefits**: Simple, works for all architectures

### Instant Deployment

Update code without restart (hot reload):

```
Deploy → Code updated → Tests run → Instant live
```

**Limitations**: May not work for all frameworks

Choose strategy based on your needs and infrastructure.

## Monitoring Deployments

### Deployment History

See all past deployments:

```
┌──────────────┬──────────────┬────────────┬──────────┐
│ Date         │ Deployed By  │ Target     │ Status   │
├──────────────┼──────────────┼────────────┼──────────┤
│ 2026-04-13   │ John Smith   │ Production │ ✓ Success│
│ 2026-04-12   │ Jane Doe     │ Staging    │ ✓ Success│
│ 2026-04-11   │ John Smith   │ Production │ ✗ Failed │
│ 2026-04-10   │ Jane Doe     │ Production │ ✓ Success│
└──────────────┴──────────────┴────────────┴──────────┘
```

Click any deployment to see:
- What changed
- Build log
- Deployment duration
- Health check results

### Application Monitoring

After deployment, monitor your app:

- **Error Tracking**: See runtime errors users encounter
- **Performance**: Response times, database query performance
- **Traffic**: Users online, request rates
- **Database**: Query performance, slow queries
- **Infrastructure**: CPU, memory, disk usage

Example dashboard:

```
Performance Metrics:
├─ Response Time: 145ms (avg)
├─ Error Rate: 0.05%
├─ Requests/sec: 2,340
└─ Database Queries: 85ms avg

Server Health:
├─ CPU: 32% average
├─ Memory: 2.1 GB / 4 GB
└─ Disk: 14 GB / 50 GB free

Traffic:
├─ Active Users: 342
├─ Requests today: 1.2M
└─ Peak: 4,200 req/sec
```

## Rollback

If something goes wrong, rollback to previous version:

### Automatic Rollback

Automatically rollback if health checks fail:

```
1. Deployment completes
2. Health checks run
3. Checks fail
4. Auto-rollback starts
5. Previous version restored
6. Notifies admin team
```

### Manual Rollback

Manually rollback anytime:

1. **Click Deployment History**
2. **Find previous successful deployment**
3. **Click "Rollback"**
4. **Confirm rollback**
5. **Deployment reverses** to previous version

Rollback is fast—typically just pointing to previous code.

## Continuous Deployment (CI/CD)

Automate deployment with CI/CD pipelines:

### Setup

1. **Connect Git repository** (GitHub, GitLab, Bitbucket)
2. **Create deployment** workflow
3. **Define triggers**:
   - On push to main branch
   - On pull request merge
   - On schedule
   - Manual trigger

### Workflow Example

```
1. Developer pushes code to GitHub
2. GitHub Actions triggers
3. Run tests
4. Build application
5. If tests pass, deploy to staging
6. Run smoke tests on staging
7. If all good, create pull request for production
8. After approval, deploy to production
```

Configure within Scoriet or use external CI/CD (GitHub Actions, GitLab CI, CircleCI, Jenkins).

## Deployment Notifications

### Team Notifications

Notify team about deployments:

1. **Set notification channels**:
   - Email
   - Slack
   - Teams
   - Custom webhooks

2. **Notification triggers**:
   - Deployment started
   - Deployment successful
   - Deployment failed
   - Health checks failed
   - Errors detected in prod

Example Slack notification:

```
🚀 Production Deployment Success!
Deployed by: John Smith
Version: v2.3.1
Duration: 3 minutes 42 seconds
Changes: 15 commits, 342 lines changed
Health Checks: ✓ All passing
```

## Deployment Logs

Complete logs for every deployment:

```
========== Deployment Log ==========
Date: 2026-04-13 10:30:00 UTC
Target: Production AWS
Duration: 4m 23s

[10:30:02] Starting deployment...
[10:30:05] Pulling latest code from GitHub
[10:30:10] Running pre-deployment tasks
[10:30:15] Building application...
[10:31:45] Running tests...
[10:32:10] Building Docker image...
[10:33:40] Pushing to registry...
[10:33:50] Deploying to ECS...
[10:34:15] Running database migrations...
[10:34:20] Running health checks...
[10:34:25] ✓ All health checks passed!
[10:34:25] Deployment complete

====================================
Status: SUCCESS
Errors: 0
Warnings: 0
```

Download logs for troubleshooting or auditing.

## Scheduled Deployments

Deploy at specific times:

```
Deploy to Staging: Every night at 2 AM (off-hours testing)
Deploy to Production: Wednesday at 10 AM (during business hours)
Weekly backup: Every Sunday at 3 AM (minimal traffic)
```

Schedule deployments to avoid peak traffic times or coordinate with team schedules.

## Security in Deployment

### Secrets Management

Sensitive data is encrypted:

```
.env file contents:
DB_PASSWORD=[Vault encrypted]
API_KEY=[Vault encrypted]
STRIPE_KEY=[Vault encrypted]

Never exposed:
- In logs
- In Git
- In email
- In Slack messages
```

### Access Control

Control who can deploy:

```
Production deployments:
  ├─ Requires approval from team lead
  ├─ Limited to authorized users
  └─ All deployments logged with who/when

Staging deployments:
  ├─ Any developer can deploy
  └─ For testing purposes
```

### Audit Trail

Complete record of all deployments:

```
Deployment Audit:
├─ Who deployed
├─ When
├─ Where (which target)
├─ What changed
└─ Result (success/failure)
```

Useful for compliance and troubleshooting.

## Tips and Best Practices

:::tip
**Test in staging first**: Always test deployment process in staging before production.
:::

:::tip
**Deploy during business hours**: Have team available if something goes wrong.
:::

:::tip
**Have a rollback plan**: Know how to quickly rollback if needed.
:::

:::tip
**Monitor after deploy**: Watch metrics closely after deploying to catch issues.
:::

:::tip
**Use semantic versioning**: Tag releases (v1.0.0, v1.0.1) for easy reference.
:::

:::tip
**Automate deployments**: Use CI/CD to reduce human error.
:::

:::tip
**Document procedures**: Write deployment runbooks so anyone can deploy safely.
:::

## What's Next?

- Set up [Monitoring](./deployment.md#monitoring-deployments) to watch your app
- Configure [CI/CD](./deployment.md#continuous-deployment-cicd) for automated deployments
- Review [Security](./deployment.md#security-in-deployment) best practices
- Learn about [Multi-Language Support](./translations.md) for international apps
