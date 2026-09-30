const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const PORT = process.env.PORT || 5000;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral';
const FORGEJO_URL = process.env.FORGEJO_URL || 'http://localhost:3000';
const FORGEJO_TOKEN = process.env.FORGEJO_TOKEN || '';

// Agent system prompts
const AGENT_PROMPTS = {
  Hermes: `You are Hermes, the DiscoKING orchestration agent.
Your role is to:
- Execute tools and skills for the user
- Coordinate tasks and workflows
- Manage the sandbox environment
- Plan execution strategies
- Provide technical guidance

Be concise, technical, and helpful. When asked, provide real solutions.`,

  Forgejo: `You are Forgejo, the DiscoKING repository agent.
Your role is to:
- Manage Git repositories
- Handle pull requests and issues
- Sync code and collaborate
- Manage branches and releases
- Review repository health

Talk like a developer. Be practical about Git workflows.`,

  Atlas: `You are Atlas, the DiscoKING planning agent.
Your role is to:
- Break down complex projects into tasks
- Identify dependencies and bottlenecks
- Create realistic timelines
- Allocate resources efficiently
- Build comprehensive roadmaps

Think strategically. Be clear about risks and constraints.`,

  Nova: `You are Nova, the DiscoKING vision agent.
Your role is to:
- Analyze system architecture
- Identify performance bottlenecks
- Suggest scalability improvements
- Review code quality
- Assess technical debt

Be analytical. Focus on long-term implications.`
};

// Health check
app.get('/health', async (req, res) => {
  try {
    const ollamaHealth = await axios.get(`${OLLAMA_URL}/api/tags`);
    const forgejoHealth = await axios.get(`${FORGEJO_URL}/api/v1/version`);
    
    res.json({
      status: 'ok',
      services: {
        ollama: 'running',
        forgejo: 'running',
        backend: 'running'
      },
      model: OLLAMA_MODEL,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: 'One or more services are down',
      details: error.message
    });
  }
});

// Main chat endpoint - real responses from Ollama
app.post('/api/chat', async (req, res) => {
  const { message, agent = 'Hermes', context = {} } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Build the system prompt based on agent
    const systemPrompt = AGENT_PROMPTS[agent] || AGENT_PROMPTS.Hermes;
    
    // Create the full prompt
    const fullPrompt = `${systemPrompt}\n\nUser Request: ${message}\n\nYour response:`;

    console.log(`[${new Date().toISOString()}] ${agent}: ${message.substring(0, 50)}...`);

    // Call Ollama for real AI response
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: fullPrompt,
      stream: false,
      temperature: 0.7
    }, {
      timeout: 60000
    });

    const reply = response.data.response.trim();

    return res.json({
      agent,
      reply,
      source: `ollama-${OLLAMA_MODEL}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Chat error for ${agent}:`, error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'AI service unavailable',
        detail: 'Ollama is not running. Start it with: docker compose up ollama',
        agent
      });
    }

    return res.status(500).json({
      error: 'Failed to generate response',
      detail: error.message,
      agent
    });
  }
});

// Tool execution simulation (can be extended)
app.post('/api/tools/execute', async (req, res) => {
  const { tool, args = {} } = req.body;

  if (!tool) {
    return res.status(400).json({ error: 'Tool name is required' });
  }

  // Simulated tool results
  const toolResults = {
    file_read: { content: 'File read operation simulated', file: args.path },
    file_write: { success: true, file: args.path, bytes: args.content?.length || 0 },
    shell_exec: { output: 'Command executed', command: args.cmd },
    git_clone: { success: true, repo: args.repo, path: args.path },
    code_search: { results: ['Match 1', 'Match 2'], pattern: args.pattern }
  };

  return res.json({
    tool,
    result: toolResults[tool] || { message: 'Tool not yet implemented' },
    timestamp: new Date().toISOString()
  });
});

// Forgejo integration - list repositories
app.get('/api/forgejo/repos', async (req, res) => {
  if (!FORGEJO_TOKEN) {
    return res.status(400).json({ 
      error: 'Forgejo token not configured',
      help: 'Set FORGEJO_TOKEN in backend/.env'
    });
  }

  try {
    const response = await axios.get(`${FORGEJO_URL}/api/v1/user/repos`, {
      headers: { 'Authorization': `token ${FORGEJO_TOKEN}` }
    });

    return res.json(response.data);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch repositories',
      detail: error.message
    });
  }
});

// Forgejo integration - create issue
app.post('/api/forgejo/issues', async (req, res) => {
  const { repo, title, body } = req.body;

  if (!FORGEJO_TOKEN || !repo || !title) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const [owner, repoName] = repo.split('/');
    const response = await axios.post(
      `${FORGEJO_URL}/api/v1/repos/${owner}/${repoName}/issues`,
      { title, body },
      { headers: { 'Authorization': `token ${FORGEJO_TOKEN}` } }
    );

    return res.json(response.data);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to create issue',
      detail: error.message
    });
  }
});

// Available agents
app.get('/api/agents', (req, res) => {
  res.json({
    agents: [
      { name: 'Hermes', role: 'orchestrator', description: 'tools + skills' },
      { name: 'Forgejo', role: 'repo manager', description: 'repo sync' },
      { name: 'Atlas', role: 'planner', description: 'task planning' },
      { name: 'Nova', role: 'architect', description: 'vision & analysis' }
    ]
  });
});

// Available tools
app.get('/api/tools', (req, res) => {
  res.json({
    tools: [
      { name: 'file_read', description: 'Read file contents' },
      { name: 'file_write', description: 'Write to files' },
      { name: 'shell_exec', description: 'Execute shell commands' },
      { name: 'git_clone', description: 'Clone repositories' },
      { name: 'code_search', description: 'Search code patterns' },
      { name: 'create_issue', description: 'Create Forgejo issues' },
      { name: 'create_pr', description: 'Create pull requests' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 DiscoKING Backend running on http://localhost:${PORT}`);
  console.log(`📡 Ollama (AI): ${OLLAMA_URL}`);
  console.log(`📦 Forgejo (Git): ${FORGEJO_URL}`);
  console.log(`🤖 Model: ${OLLAMA_MODEL}\n`);
});
