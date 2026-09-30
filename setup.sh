#!/bin/bash

# DiscoKING Full Stack Setup
# This script sets up Hermes, Forgejo, and all agents with free tools/skills

echo "🚀 Starting DiscoKING Full Stack Setup..."

# Create data directories
mkdir -p ./data/hermes ./data/forgejo ./data/agents ./logs

# 1. Start Forgejo (Git Server)
echo "📦 Starting Forgejo..."
docker run -d \
  --name discoking-forgejo \
  -p 3000:3000 \
  -p 222:22 \
  -e "FORGEJO__DEFAULT__RUN_MODE=prod" \
  -e "FORGEJO__repository__ROOT=/data/git/repositories" \
  -v ./data/forgejo:/data \
  -v /etc/timezone:/etc/timezone:ro \
  forgejo/forgejo:latest

echo "✅ Forgejo running at http://localhost:3000"
echo "   First run: Create admin account at http://localhost:3000/install"

# 2. Start Hermes (AI Orchestration with Free Models)
echo "🤖 Starting Hermes..."
docker run -d \
  --name discoking-hermes \
  -p 8000:8000 \
  -e "HERMES_MODE=local" \
  -e "HERMES_MODEL=mistral" \
  -v ./data/hermes:/root/.hermes \
  -v ./data/agents:/agents \
  ghcr.io/geniusrise/hermes:latest

echo "✅ Hermes running at http://localhost:8000"

# 3. Start Ollama (Free Local AI Models)
echo "🧠 Starting Ollama (Free Models)..."
docker run -d \
  --name discoking-ollama \
  -p 11434:11434 \
  -v ./data/ollama:/root/.ollama \
  ollama/ollama

echo "✅ Ollama running at http://localhost:11434"
echo "   Pulling Mistral model..."
docker exec discoking-ollama ollama pull mistral

# 4. Setup Agent Configs
echo "📋 Creating agent configurations..."

# Hermes Agent Config
cat > ./data/agents/hermes-config.json << 'EOF'
{
  "name": "Hermes",
  "role": "orchestrator",
  "description": "tools + skills",
  "model": "mistral",
  "skills": [
    "file_io",
    "shell_execution",
    "repo_operations",
    "code_analysis",
    "task_planning"
  ],
  "tools": [
    {
      "name": "file_read",
      "description": "Read file contents",
      "enabled": true
    },
    {
      "name": "file_write",
      "description": "Write to files",
      "enabled": true
    },
    {
      "name": "shell_exec",
      "description": "Execute shell commands",
      "enabled": true
    },
    {
      "name": "git_clone",
      "description": "Clone repositories",
      "enabled": true
    },
    {
      "name": "code_search",
      "description": "Search code patterns",
      "enabled": true
    }
  ],
  "settings": {
    "timeout": 30,
    "max_tokens": 2000,
    "temperature": 0.7
  }
}
EOF

# Forgejo Agent Config
cat > ./data/agents/forgejo-config.json << 'EOF'
{
  "name": "Forgejo",
  "role": "repository_manager",
  "description": "repo sync",
  "model": "mistral",
  "skills": [
    "repo_operations",
    "issue_management",
    "pull_request_handling",
    "branch_management",
    "code_review"
  ],
  "tools": [
    {
      "name": "create_repo",
      "description": "Create new repository",
      "enabled": true
    },
    {
      "name": "clone_repo",
      "description": "Clone repository",
      "enabled": true
    },
    {
      "name": "create_issue",
      "description": "Create GitHub/Forgejo issue",
      "enabled": true
    },
    {
      "name": "create_pr",
      "description": "Create pull request",
      "enabled": true
    },
    {
      "name": "merge_pr",
      "description": "Merge pull request",
      "enabled": true
    },
    {
      "name": "manage_branches",
      "description": "Create/delete branches",
      "enabled": true
    }
  ],
  "forgejo_url": "http://localhost:3000",
  "settings": {
    "timeout": 30,
    "max_tokens": 2000,
    "temperature": 0.7
  }
}
EOF

# Atlas Agent Config (Planner)
cat > ./data/agents/atlas-config.json << 'EOF'
{
  "name": "Atlas",
  "role": "planner",
  "description": "planner",
  "model": "mistral",
  "skills": [
    "task_planning",
    "workflow_design",
    "dependency_analysis",
    "resource_allocation",
    "timeline_estimation"
  ],
  "tools": [
    {
      "name": "create_task",
      "description": "Create task and add to plan",
      "enabled": true
    },
    {
      "name": "analyze_dependencies",
      "description": "Analyze task dependencies",
      "enabled": true
    },
    {
      "name": "estimate_timeline",
      "description": "Estimate project timeline",
      "enabled": true
    },
    {
      "name": "allocate_resources",
      "description": "Allocate resources to tasks",
      "enabled": true
    },
    {
      "name": "generate_roadmap",
      "description": "Generate project roadmap",
      "enabled": true
    }
  ],
  "settings": {
    "timeout": 45,
    "max_tokens": 3000,
    "temperature": 0.5
  }
}
EOF

# Nova Agent Config (Vision)
cat > ./data/agents/nova-config.json << 'EOF'
{
  "name": "Nova",
  "role": "vision",
  "description": "vision",
  "model": "mistral",
  "skills": [
    "architecture_design",
    "system_analysis",
    "optimization",
    "performance_analysis",
    "scalability_assessment"
  ],
  "tools": [
    {
      "name": "analyze_architecture",
      "description": "Analyze system architecture",
      "enabled": true
    },
    {
      "name": "performance_check",
      "description": "Check performance metrics",
      "enabled": true
    },
    {
      "name": "identify_bottlenecks",
      "description": "Identify performance bottlenecks",
      "enabled": true
    },
    {
      "name": "suggest_improvements",
      "description": "Suggest system improvements",
      "enabled": true
    },
    {
      "name": "generate_metrics",
      "description": "Generate performance metrics",
      "enabled": true
    }
  ],
  "settings": {
    "timeout": 40,
    "max_tokens": 2500,
    "temperature": 0.6
  }
}
EOF

echo "✅ Agent configurations created"

# 5. Create Node.js Backend
echo "🔧 Creating Node.js backend..."

cat > ./backend/package.json << 'EOF'
{
  "name": "discoking-backend",
  "version": "1.0.0",
  "description": "DiscoKING Backend with Hermes + Forgejo",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.4.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "body-parser": "^1.20.2"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
EOF

cat > ./backend/.env << 'EOF'
HERMES_URL=http://localhost:8000
OLLAMA_URL=http://localhost:11434
FORGEJO_URL=http://localhost:3000
FORGEJO_TOKEN=your_forgejo_token_here
BACKEND_PORT=5000
NODE_ENV=development
EOF

echo "✅ Backend files created"

# Final Instructions
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║           🎉 DiscoKING Full Stack Ready! 🎉           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📍 Services Running:"
echo "   🟢 Forgejo (Git):    http://localhost:3000"
echo "   🟢 Hermes (AI):      http://localhost:8000"
echo "   🟢 Ollama (Models):  http://localhost:11434"
echo ""
echo "🚀 Next Steps:"
echo "   1. Setup Forgejo admin: http://localhost:3000/install"
echo "   2. Start backend: cd backend && npm install && npm start"
echo "   3. Update .env with Forgejo token"
echo "   4. Frontend will connect to http://localhost:5000"
echo ""
echo "📚 Free Models Available:"
echo "   - Mistral (7B) - Fast & Capable"
echo "   - Llama2 (7B/13B) - Flexible"
echo "   - Neural Chat - Conversational"
echo ""
echo "✨ All services are free and self-hosted!"
echo ""
