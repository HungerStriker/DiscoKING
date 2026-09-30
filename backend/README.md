# DiscoKING Backend

Real AI-powered backend with Ollama LLM and Forgejo Git integration.

## Setup

### 1. Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- At least 8GB RAM for Ollama

### 2. Start All Services

```bash
# Copy example env
cp backend/.env.example backend/.env

# Start all services
docker compose up -d

# Wait for Ollama to download model (2-3 minutes first time)
docker logs discoking-ollama

# Check health
curl http://localhost:5000/health
```

### 3. Configure Forgejo

1. Open http://localhost:3000
2. Complete the setup (create admin account)
3. Go to Settings → Applications → Personal Access Tokens
4. Create a token with "repo" scope
5. Copy token to `backend/.env` as `FORGEJO_TOKEN`
6. Restart backend: `docker compose restart backend`

### 4. Test the Backend

```bash
# Health check
curl http://localhost:5000/health

# List agents
curl http://localhost:5000/api/agents

# Test chat
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the best way to structure a Node.js project?",
    "agent": "Hermes"
  }'
```

## Architecture

```
DiscoKING Frontend (index.html + app.html)
         ↓
   Backend API (Node.js)
    /api/chat endpoint
         ↓
    Ollama (Local LLM)
   mistral/llama model
         ↓
     Real AI Response
```

## Available Models

- `mistral` (7B) - Fast, good quality ⭐ Recommended
- `llama2` (7B/13B) - Strong reasoning
- `qwen2.5` (7B) - Great for code
- `deepseek-r1:8b` - Advanced reasoning

Pull a different model:

```bash
docker exec discoking-ollama ollama pull qwen2.5
```

Then update `OLLAMA_MODEL` in `.env`.

## Available Agents

- **Hermes**: Orchestration, tools, execution
- **Forgejo**: Repository management, Git operations
- **Atlas**: Planning, roadmaps, task breakdown
- **Nova**: Architecture, vision, performance analysis

## Available Tools

- `file_read` - Read file contents
- `file_write` - Write to files
- `shell_exec` - Execute commands
- `git_clone` - Clone repos
- `code_search` - Search patterns
- `create_issue` - Create Forgejo issues
- `create_pr` - Create pull requests

## Troubleshooting

### Ollama not responding
```bash
docker logs discoking-ollama

# Restart Ollama
docker compose restart ollama
```

### Forgejo token not working
1. Verify token exists: `http://localhost:3000/user/settings/applications`
2. Check token scope includes "repo"
3. Paste token in `backend/.env`
4. Restart: `docker compose restart backend`

### High memory usage
Ollama models use GPU/CPU memory. If running slow:
- Reduce model size: switch to 7B instead of 13B
- Increase available RAM
- Disable other services

## Development

Local development (without Docker):

```bash
cd backend
npm install

# Make sure Ollama and Forgejo are running
# Then:
npm run dev
```

## Production Deployment

See DEPLOYMENT.md for Heroku, AWS, or Docker production setup.
