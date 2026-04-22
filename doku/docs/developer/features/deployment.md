---
sidebar_position: 6
---

# Deployment System

## Overview

The Deployment System enables users to deploy generated code to production environments via FTP/SSH uploads or Git integration (GitHub, GitLab, Bitbucket). Supports multiple deployment targets, automated workflows, and comprehensive deployment logging.

## Key Features

- **Multiple Deployment Methods** - FTP, SSH, Git integration
- **Git Integration** - GitHub, GitLab, Bitbucket support
- **Automated Workflows** - Push, Pull Request, Merge automation
- **Deployment Logs** - Real-time status tracking
- **Archive Management** - Store generated project archives
- **Rollback Support** - Revert to previous deployments
- **Environment Configuration** - Dev, staging, production
- **Webhook Support** - Trigger deployments from external events

## Deployment Methods

### FTP Upload

```typescript
interface FTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  remote_path: string;
  passive_mode?: boolean;
}

const ftpDeployment = async (config: FTPConfig, files: File[]) => {
  const formData = new FormData();
  formData.append('deployment_method', 'ftp');
  formData.append('ftp_host', config.host);
  formData.append('ftp_port', config.port.toString());
  formData.append('ftp_username', config.username);
  formData.append('ftp_password', config.password);
  formData.append('ftp_path', config.remote_path);
  
  files.forEach((file, i) => {
    formData.append(`files[${i}]`, file);
  });
  
  await fetch('/api/deployments/upload', {
    method: 'POST',
    body: formData,
    headers: { 'Authorization': `Bearer ${token}` }
  });
};
```

### SSH Upload

```typescript
interface SSHConfig {
  host: string;
  port: number;
  username: string;
  auth_method: 'password' | 'key';
  password?: string;
  private_key?: string;
  remote_path: string;
}

const sshDeployment = async (config: SSHConfig, projectArchive: File) => {
  const formData = new FormData();
  formData.append('deployment_method', 'ssh');
  formData.append('ssh_host', config.host);
  formData.append('ssh_port', config.port.toString());
  formData.append('ssh_username', config.username);
  formData.append('ssh_auth_method', config.auth_method);
  formData.append('ssh_path', config.remote_path);
  
  if (config.auth_method === 'password') {
    formData.append('ssh_password', config.password);
  } else {
    formData.append('ssh_key', config.private_key);
  }
  
  formData.append('archive', projectArchive);
  
  await fetch('/api/deployments/upload', {
    method: 'POST',
    body: formData,
    headers: { 'Authorization': `Bearer ${token}` }
  });
};
```

## Git Integration

![Git Connector](/img/screenshots/git_connector.png)
*Project Settings with GitHub and GitLab connector configuration*

### GitHub Integration

```typescript
interface GitHubConfig {
  owner: string;
  repo: string;
  branch: string;
  access_token: string;
}

const deployViaGitHub = async (config: GitHubConfig, files: File[]) => {
  // 1. Create feature branch
  const branchName = `feature/scoriet-${Date.now()}`;
  
  // 2. Commit files to branch
  const commit = await fetch(
    `https://api.github.com/repos/${config.owner}/${config.repo}/contents/src`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `token ${config.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Generated code from Scoriet',
        content: btoa(fileContent),
        branch: branchName
      })
    }
  );
  
  // 3. Create Pull Request
  const pr = await fetch(
    `https://api.github.com/repos/${config.owner}/${config.repo}/pulls`,
    {
      method: 'POST',
      headers: {
        'Authorization': `token ${config.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Generated code from Scoriet',
        body: 'Automatic code generation',
        head: branchName,
        base: config.branch
      })
    }
  );
  
  return pr;
};
```

### GitLab Integration

```typescript
interface GitLabConfig {
  project_id: number;
  branch: string;
  access_token: string;
  gitlab_url?: string;
}

const deployViaGitLab = async (config: GitLabConfig, fileContent: string) => {
  const apiUrl = config.gitlab_url || 'https://gitlab.com';
  
  // Create commit
  const response = await fetch(
    `${apiUrl}/api/v4/projects/${config.project_id}/repository/commits`,
    {
      method: 'POST',
      headers: {
        'PRIVATE-TOKEN': config.access_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        branch: config.branch,
        commit_message: 'Generated code from Scoriet',
        actions: [{
          action: 'create',
          file_path: 'generated/code.ts',
          content: fileContent
        }]
      })
    }
  );
  
  return await response.json();
};
```

### Bitbucket Integration

```typescript
interface BitbucketConfig {
  workspace: string;
  repo: string;
  branch: string;
  username: string;
  app_password: string;
}

const deployViaBitbucket = async (config: BitbucketConfig, fileContent: string) => {
  const auth = btoa(`${config.username}:${config.app_password}`);
  
  const response = await fetch(
    `https://api.bitbucket.org/2.0/repositories/${config.workspace}/${config.repo}/src`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        files: fileContent,
        branch: config.branch,
        message: 'Generated code from Scoriet'
      })
    }
  );
  
  return await response.json();
};
```

## Deployment Logs

Real-time deployment status tracking:

```typescript
interface DeploymentLog {
  id: number;
  deployment_id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  metadata?: any;
  task_id?: number;
  created_at: string;
}

// Stream logs in real-time
const pollDeploymentLogs = async (deploymentId: number) => {
  const response = await fetch(`/api/deployments/${deploymentId}/logs`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const { logs } = await response.json();
  
  logs.forEach(log => {
    console.log(`[${log.type.toUpperCase()}] ${log.message}`);
  });
};

// WebSocket for real-time updates
const watchDeployment = (deploymentId: number) => {
  const channel = getEcho().channel(`deployment.${deploymentId}`);
  
  channel.listen('LogAdded', (data) => {
    console.log(`[${data.log.type}] ${data.log.message}`);
  });
  
  channel.listen('DeploymentCompleted', (data) => {
    console.log(`Deployment ${data.status}`);
  });
};
```

## Deployment Workflow

### 1. Generate Code

```
Project → Code Generation → Configure options
Select template, database, form layout
```

### 2. Create Deployment

```typescript
const createDeployment = async (projectId: number, codeGenerationId: number) => {
  const response = await fetch('/api/deployments', {
    method: 'POST',
    body: JSON.stringify({
      project_id: projectId,
      code_generation_id: codeGenerationId,
      deployment_method: 'git',
      target_environment: 'production'
    }),
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
};
```

### 3. Configure Target

```
Deployment → Select Method → FTP/SSH/Git
Enter credentials, configure paths
```

### 4. Deploy

```typescript
const executeDeployment = async (deploymentId: number) => {
  const response = await fetch(`/api/deployments/${deploymentId}/execute`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return await response.json();
};
```

### 5. Monitor Logs

```
Deployment → View Logs → Real-time progress
Watch for errors, completion status
```

## Archive Management

Store and retrieve generated project archives:

```typescript
interface ProjectArchive {
  id: number;
  code_generation_id: number;
  file_path: string;
  file_size: number;
  created_at: string;
  expires_at?: string;
}

// Download generated archive
const downloadArchive = async (codeGenerationId: number) => {
  const response = await fetch(`/api/archives/${codeGenerationId}/download`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'project.zip';
  a.click();
};
```

## Environment Configuration

Support for multiple deployment environments:

```typescript
interface DeploymentEnvironment {
  id: number;
  name: string;
  type: 'development' | 'staging' | 'production';
  ftp_config?: FTPConfig;
  ssh_config?: SSHConfig;
  git_config?: GitHubConfig;
  is_default?: boolean;
}

// Configure environment
const configureEnvironment = async (projectId: number, config: DeploymentEnvironment) => {
  await fetch(`/api/projects/${projectId}/environments`, {
    method: 'POST',
    body: JSON.stringify(config),
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Deploy to specific environment
const deployToEnvironment = async (environmentId: number, codeGenerationId: number) => {
  const response = await fetch(`/api/deployments`, {
    method: 'POST',
    body: JSON.stringify({
      environment_id: environmentId,
      code_generation_id: codeGenerationId
    }),
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
};
```

## Rollback

Revert to previous deployment version:

```typescript
const rollbackDeployment = async (deploymentId: number, previousDeploymentId: number) => {
  const response = await fetch(`/api/deployments/${deploymentId}/rollback`, {
    method: 'POST',
    body: JSON.stringify({
      rollback_to: previousDeploymentId
    }),
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
};

// View deployment history
const getDeploymentHistory = async (projectId: number) => {
  const response = await fetch(`/api/projects/${projectId}/deployments`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return await response.json();
};
```

## Webhook Support

Trigger deployments from external events:

```typescript
interface DeploymentWebhook {
  id: number;
  event_type: 'code_generated' | 'manual_trigger' | 'scheduled';
  target_url: string;
  secret_key: string;
  is_active: boolean;
}

// Create webhook
const createWebhook = async (projectId: number, webhook: DeploymentWebhook) => {
  await fetch(`/api/projects/${projectId}/webhooks`, {
    method: 'POST',
    body: JSON.stringify(webhook),
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Webhook payload
const webhookPayload = {
  event: 'code_generated',
  project_id: 123,
  code_generation_id: 456,
  timestamp: '2026-04-13T10:30:00Z',
  signature: 'hmac_sha256_signature'
};
```

## API Endpoints

```
# Deployments
POST   /api/deployments                   # Create deployment
GET    /api/projects/{id}/deployments     # List deployments
GET    /api/deployments/{id}              # Get deployment status
POST   /api/deployments/{id}/execute      # Execute deployment
POST   /api/deployments/{id}/rollback     # Rollback deployment

# Logs
GET    /api/deployments/{id}/logs         # Get deployment logs
POST   /api/deployments/{id}/logs/clear   # Clear logs

# Archives
GET    /api/archives/{id}/download        # Download archive
DELETE /api/archives/{id}                 # Delete archive

# Environments
POST   /api/projects/{id}/environments    # Create environment
GET    /api/projects/{id}/environments    # List environments
PUT    /api/environments/{id}             # Update environment
DELETE /api/environments/{id}             # Delete environment

# Webhooks
POST   /api/projects/{id}/webhooks        # Create webhook
GET    /api/projects/{id}/webhooks        # List webhooks
DELETE /api/webhooks/{id}                 # Delete webhook
```

## Best Practices

1. **Test Before Production** - Deploy to staging first
2. **Keep Archives** - Store backups for rollback
3. **Monitor Logs** - Watch for errors during deployment
4. **Gradual Rollout** - Use staging environment
5. **Automate Workflows** - Set up CI/CD pipelines
6. **Secure Credentials** - Store tokens securely
7. **Document Changes** - Use commit messages
8. **Plan Rollback** - Know how to revert

## Troubleshooting

### Deployment Fails
- Check credentials
- Verify file permissions
- Review deployment logs
- Test connection separately

### Git Integration Issues
- Verify access token scope
- Check repository permissions
- Ensure branch exists
- Review API rate limits

### FTP/SSH Upload Fails
- Test FTP/SSH connection manually
- Verify firewall rules
- Check file size limits
- Confirm remote path permissions

## Next Steps

- [Form Designer](form-designer.md) - Design forms
- [Report Designer](report-designer.md) - Create reports
- [Code Generation](../frontend/panels.md#codegenerationpanel) - Generate code
