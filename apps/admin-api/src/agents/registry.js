"use strict";

/**
 * Agent Registry
 *
 * Central registry for all AI agents in the Slimy.ai ecosystem.
 * Defines agent capabilities, supported task types, and metadata.
 *
 * TODO: Auto-load from YAML files (AGENT_TASKS.yaml / CLAUDE_SKILLS.yaml)
 */

/**
 * @typedef {Object} AgentDefinition
 * @property {string} name - Unique agent identifier
 * @property {string} description - Human-readable description of the agent
 * @property {string[]} supportedTaskTypes - List of task types this agent can handle
 * @property {Object} [metadata] - Additional metadata (model names, cost hints, etc.)
 */

/**
 * Registry of available agents
 * @type {AgentDefinition[]}
 */
const AGENTS = [
  {
    name: "claude-code",
    description: "Claude AI coding assistant for software development tasks",
    supportedTaskTypes: [
      "code-generation",
      "code-review",
      "bug-fix",
      "refactoring",
      "documentation",
      "test-generation"
    ],
    metadata: {
      model: "claude-sonnet-4",
      provider: "anthropic",
      costTier: "premium"
    }
  },
  {
    name: "autocodex",
    description: "Automated code analysis and documentation generator",
    supportedTaskTypes: [
      "code-analysis",
      "documentation-generation",
      "api-documentation",
      "code-metrics"
    ],
    metadata: {
      model: "gpt-4-turbo",
      provider: "openai",
      costTier: "standard"
    }
  },
  {
    name: "snail-analytics",
    description: "Discord analytics and insights agent for Snail bot",
    supportedTaskTypes: [
      "user-analytics",
      "guild-analytics",
      "message-analysis",
      "trend-detection",
      "report-generation"
    ],
    metadata: {
      model: "claude-haiku",
      provider: "anthropic",
      costTier: "economy"
    }
  },
  {
    name: "snail-support",
    description: "AI-powered support agent for user queries and help",
    supportedTaskTypes: [
      "user-support",
      "faq-response",
      "troubleshooting",
      "feature-explanation"
    ],
    metadata: {
      model: "gpt-3.5-turbo",
      provider: "openai",
      costTier: "economy"
    }
  },
  {
    name: "content-moderator",
    description: "Content moderation and safety analysis agent",
    supportedTaskTypes: [
      "content-moderation",
      "toxicity-detection",
      "spam-detection",
      "safety-analysis"
    ],
    metadata: {
      model: "claude-instant",
      provider: "anthropic",
      costTier: "economy"
    }
  },
  {
    name: "docs-writer",
    description: "Technical documentation and tutorial creator",
    supportedTaskTypes: [
      "documentation",
      "tutorial-creation",
      "api-docs",
      "user-guides",
      "changelog-generation"
    ],
    metadata: {
      model: "gpt-4",
      provider: "openai",
      costTier: "standard"
    }
  }
];

/**
 * Get an agent definition by name
 * @param {string} name - Agent name
 * @returns {AgentDefinition | undefined}
 */
function getAgentByName(name) {
  return AGENTS.find(agent => agent.name === name);
}

/**
 * Get all registered agents
 * @returns {AgentDefinition[]}
 */
function getAllAgents() {
  return AGENTS;
}

/**
 * Check if an agent exists
 * @param {string} name - Agent name
 * @returns {boolean}
 */
function agentExists(name) {
  return AGENTS.some(agent => agent.name === name);
}

/**
 * Get agents that support a specific task type
 * @param {string} taskType - Task type to search for
 * @returns {AgentDefinition[]}
 */
function getAgentsByTaskType(taskType) {
  return AGENTS.filter(agent =>
    agent.supportedTaskTypes.includes(taskType)
  );
}

module.exports = {
  AGENTS,
  getAgentByName,
  getAllAgents,
  agentExists,
  getAgentsByTaskType
};
