---
sidebar_position: 2
title: "Scoriet Local Service"
---

# Scoriet Local Service

The **Scoriet Local Service** is a background daemon that runs on your machine for high-performance code generation, local processing, and integration with development tools. It's ideal for developers who want faster generation, offline capability, and integration with IDEs and build tools.

## What is the Local Service?

The Local Service is a background application that:

- **Runs locally** — Code generation happens on your machine
- **Fast generation** — Reduced latency compared to cloud
- **Offline capability** — Work without internet (with cached projects)
- **IDE integration** — Plugins for VS Code, JetBrains IDEs
- **Hook integration** — Git hooks, build system integration
- **Resource control** — Use your machine's compute power

:::info When to Use Local Service
- **High-frequency generation** — Generating code constantly
- **Sensitive data** — Processing templates locally for privacy
- **Offline work** — No internet connectivity available
- **IDE integration** — Seamless editor integration
- **Custom workflows** — Advanced automation needs
:::

## Installation

### Windows

**Step 1: Download Installer**
```
Visit: https://scoriet.com/download/local-service/windows
Download: scoriet-local-service-x.x.x.exe
```

**Step 2: Run Installer**
- Double-click the installer
- Follow installation wizard
- Select installation directory (default: `C:\Program Files\Scoriet`)
- Choose auto-start on system boot (recommended)

**Step 3: Verify Installation**
```bash
scoriet-service --version
```

**Step 4: Start Service**
```bash
# Via Windows Services
sc start ScorlexLocalService

# Or via command line
scoriet-service start
```

### macOS

**Step 1: Install via Homebrew**
```bash
brew tap scoriet/services
brew install scoriet-local-service
```

**Step 2: Install as LaunchAgent** (runs on login)
```bash
brew services start scoriet-local-service
```

**Step 3: Verify Installation**
```bash
scoriet-service --version
```

### Linux

**Step 1: Install via apt**
```bash
# Ubuntu/Debian
sudo apt-add-repository ppa:scoriet/services
sudo apt-get update
sudo apt-get install scoriet-local-service
```

**Step 2: Enable Service**
```bash
sudo systemctl enable scoriet-local-service
sudo systemctl start scoriet-local-service
```

**Step 3: Verify Status**
```bash
sudo systemctl status scoriet-local-service
```

### Docker

Run Local Service in Docker:

```bash
docker run -d \
  --name scoriet-local \
  -p 9000:9000 \
  -v ~/.scoriet:/root/.scoriet \
  -e SCORIET_LOG_LEVEL=info \
  scoriet/local-service:latest
```

**Docker Compose**:

```yaml
version: '3.8'

services:
  scoriet:
    image: scoriet/local-service:latest
    container_name: scoriet-local
    ports:
      - "9000:9000"
    volumes:
      - ~/.scoriet:/root/.scoriet
    environment:
      SCORIET_LOG_LEVEL: info
      SCORIET_CACHE_SIZE: 1024
    restart: unless-stopped
```

## Configuration

### Configuration File

Configuration is stored in `~/.scoriet/local-service.yaml`:

```yaml
# Local Service Configuration

# Server settings
server:
  host: localhost
  port: 9000
  timeout: 30

# Authentication
auth:
  api_key: sk_test_xxxxx
  auto_login: true

# Cache settings
cache:
  enabled: true
  location: ~/.scoriet/cache
  max_size: 1024  # MB
  ttl: 86400      # seconds

# Logging
logging:
  level: info     # debug, info, warn, error
  file: ~/.scoriet/logs/service.log
  max_size: 10    # MB
  max_files: 5

# Performance
performance:
  workers: 4      # Parallel workers
  memory_limit: 512  # MB
  cpu_limit: 0    # 0 = unlimited

# Integrations
integrations:
  git_hooks: true
  ide_plugins: true
  build_tools: true
```

### Common Configuration Changes

**Change Port** (if 9000 is in use):
```yaml
server:
  port: 9001
```

**Increase Cache Size** (for offline work):
```yaml
cache:
  max_size: 2048  # 2GB
  ttl: 604800     # 1 week
```

**Set API Key** (for authentication):
```yaml
auth:
  api_key: sk_test_xxxxx
```

**Enable Debug Logging**:
```yaml
logging:
  level: debug
```

## Starting and Stopping

### macOS/Linux

```bash
# Start
sudo systemctl start scoriet-local-service

# Stop
sudo systemctl stop scoriet-local-service

# Restart
sudo systemctl restart scoriet-local-service

# Check status
sudo systemctl status scoriet-local-service
```

### Windows (Command Line)

```bash
# Start
sc start ScorlexLocalService

# Stop
sc stop ScorlexLocalService

# Restart
sc stop ScorlexLocalService
sc start ScorlexLocalService
```

### Windows (Services App)

1. Open **Services** (Win+R, type `services.msc`)
2. Find "Scoriet Local Service"
3. Right-click → **Start**, **Stop**, or **Restart**

### Verify Service Running

```bash
# Check if service is accessible
curl http://localhost:9000/health

# Output:
# {"status":"healthy","version":"1.2.3","uptime_seconds":3600}
```

## Using Local Service

### Via CLI

```bash
# The CLI automatically uses local service if running
scoriet generate my-project my-template
```

### Via REST API

```bash
# Direct API calls to local service
curl -X POST http://localhost:9000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "my-project",
    "template": "my-template",
    "language": "en"
  }'
```

### Response:
```json
{
  "success": true,
  "template": "my-template",
  "output": "<?php class User { ... }",
  "duration_ms": 45,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## IDE Integration

### VS Code Extension

The Scoriet Local Service integrates with the VS Code extension for:

- **Command Palette** — `Scoriet: Generate Code`
- **Context Menu** — Right-click files/folders
- **Status Bar** — See service status
- **Quick Generation** — Hot keys for quick access

**Installation**:
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search "Scoriet"
4. Click **Install**
5. Service integration is automatic

**Usage**:
```
Ctrl+Shift+P → Scoriet: Generate Code
Select project → Select template → View generated code
```

### JetBrains IDEs (IntelliJ, WebStorm, PyCharm)

**Installation**:
1. Open IDE → **Preferences/Settings**
2. **Plugins** → **Marketplace**
3. Search "Scoriet"
4. Click **Install**

**Usage**:
- Right-click file/folder → **Scoriet** → **Generate Code**
- Use keyboard shortcut (Cmd+Alt+G on macOS, Ctrl+Alt+G on Windows/Linux)

### Neovim

Install plugin with your package manager:

```lua
-- Using vim-plug
Plug 'scoriet/vim-scoriet'

-- Using packer.nvim
use 'scoriet/vim-scoriet'
```

Usage:
```
:ScorlexGenerate <project> <template>
```

---

## Integration with Development Tools

### Git Hooks

Automatically generate code during git operations:

**Pre-commit Hook** — Generate code before commit:

```bash
#!/bin/bash
# .git/hooks/pre-commit

scoriet generate my-project my-template --output ./src/generated.php
git add ./src/generated.php
```

**Post-merge Hook** — Regenerate after pulling:

```bash
#!/bin/bash
# .git/hooks/post-merge

scoriet generate my-project my-template --output ./src/generated.php
```

**Enable Hooks Automatically**:
```bash
scoriet-service --install-git-hooks
```

### Build System Integration

#### npm Scripts

```json
{
  "scripts": {
    "generate": "scoriet generate my-project my-template --output ./src/generated.php",
    "build": "npm run generate && npm run webpack",
    "dev": "npm run generate && npm run dev-server"
  }
}
```

#### Laravel Artisan

Create a custom Artisan command:

```php
<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;

class GenerateCode extends Command
{
    protected $signature = 'scoriet:generate {project} {template}';
    protected $description = 'Generate code using Scoriet';

    public function handle()
    {
        $project = $this->argument('project');
        $template = $this->argument('template');
        
        $process = new Process([
            'scoriet', 'generate', $project, $template
        ]);
        
        $process->run();
        
        $this->info($process->getOutput());
    }
}
```

Usage:
```bash
php artisan scoriet:generate my-project my-template
```

#### Docker Builds

```dockerfile
FROM php:8.2

# Install Scoriet CLI
RUN curl -fsSL https://scoriet.com/install-cli.sh | bash

# Copy project
COPY . /app
WORKDIR /app

# Generate code
RUN scoriet generate my-project laravel-model \
    --output ./app/Models/User.php

# Run application
CMD ["php", "artisan", "serve"]
```

---

## Performance Tuning

### Increase Worker Count

For high-volume generation:

```yaml
performance:
  workers: 8      # Match your CPU core count
```

### Adjust Memory Limit

For large templates:

```yaml
performance:
  memory_limit: 1024  # 1GB
```

### Enable Compression

For network efficiency:

```yaml
server:
  compression: gzip
  compression_level: 6
```

### Monitor Performance

```bash
# Check service stats
curl http://localhost:9000/stats

# Output:
# {
#   "requests_total": 1024,
#   "requests_per_second": 2.3,
#   "average_generation_time_ms": 45,
#   "cache_hit_rate": 0.75,
#   "memory_usage_mb": 256
# }
```

---

## Troubleshooting

### Service Won't Start

**Windows**:
```bash
# Check Windows Event Viewer
eventvwr.msc

# Restart manually
sc stop ScorlexLocalService
sc start ScorlexLocalService

# Check if port is in use
netstat -ano | findstr :9000
```

**macOS/Linux**:
```bash
# Check system logs
journalctl -u scoriet-local-service -f

# Check if port is in use
lsof -i :9000

# Run directly (not as service) to see errors
scoriet-service run
```

### Connection Refused

```bash
# Check if service is running
curl http://localhost:9000/health

# Check port
lsof -i :9000

# Check firewall
# Windows: Check Windows Defender Firewall
# macOS: System Preferences > Security & Privacy > Firewall
# Linux: sudo ufw status
```

### High Memory Usage

```yaml
# Reduce cache size
cache:
  max_size: 512

# Reduce worker count
performance:
  workers: 2
```

### Slow Generation

1. Check system resources (CPU, RAM)
2. Increase worker count (if not maxed out)
3. Check network latency: `ping api.scoriet.com`
4. Clear cache: `scoriet-service --clear-cache`

---

## Security Considerations

:::caution API Key Security
- Never commit API keys to version control
- Store in environment variables or secrets manager
- Use least-privilege tokens for CI/CD
- Rotate keys regularly
:::

:::tip Local Network Only
By default, service only listens on localhost:

```yaml
server:
  host: localhost  # Not accessible from network
```

To expose to network:
```yaml
server:
  host: 0.0.0.0
```

Only do this on trusted networks!
:::

:::info Firewall Rules
- Block external access on port 9000
- Use VPN for remote access
- Consider reverse proxy (nginx) with authentication
:::

---

## Uninstalling

### Windows

```bash
# Via Control Panel
1. Settings > Apps > Apps & features
2. Find "Scoriet Local Service"
3. Click > Uninstall

# Or command line
msiexec /x ScorlexLocalService.msi /q
```

### macOS

```bash
# Stop service
brew services stop scoriet-local-service

# Uninstall
brew uninstall scoriet-local-service

# Remove config
rm -rf ~/.scoriet
```

### Linux

```bash
# Stop service
sudo systemctl stop scoriet-local-service

# Uninstall
sudo apt-get remove scoriet-local-service

# Remove config
rm -rf ~/.scoriet
```

---

## Next Steps

- **[Automation & CI/CD](./automation.md)** — Integrate with pipelines
- **[CLI Overview](./cli-overview.md)** — Command-line interface
- **[User Guide Home](/docs)** — Main documentation

