/**
 * Phase 0.5: Coordinator Agent
 * 
 * Routes queries to specialist agents, manages task dependencies, and synthesizes responses
 */

import { BaseAgent } from './base-agent';
import {
  AgentProfile,
  AgentTask,
  AgentResponse,
  AgentCapability,
  AgentRole,
  CoordinatorPlan,
  AgentMessage,
  MultiAgentResult,
} from './types';
import { AnalystAgent } from './analyst-agent';
import { InvestigatorAgent } from './investigator-agent';

export interface AgentRegistry {
  [key: string]: BaseAgent;
}

export class CoordinatorAgent extends BaseAgent {
  private agentRegistry: AgentRegistry = {};
  private taskHistory: AgentTask[] = [];
  private responseHistory: AgentResponse[] = [];

  constructor() {
    const profile: AgentProfile = {
      role: 'coordinator',
      capabilities: [],
      description: 'Coordinator agent that routes tasks to specialists and synthesizes results',
      systemPrompt: `You are the Coordinator AI that orchestrates multi-agent collaboration.

Your responsibilities:
1. Analyze incoming queries and decompose them into sub-tasks
2. Route tasks to specialist agents based on their capabilities
3. Manage task dependencies and execution order
4. Synthesize responses from multiple agents into coherent answers
5. Facilitate inter-agent communication when needed

Available specialist agents:
- Analyst: Crime pattern analysis, hotspot detection, trend analysis
- Investigator: Case investigation, evidence gathering, relationship mapping
- Profiler: Offender profiling, behavioral analysis
- Forecaster: Predictive analytics, crime forecasting
- Financial: Financial crime analysis, transaction tracking

Your goal is to efficiently delegate work and produce comprehensive, evidence-based answers.`,
      temperature: 0.4,
      maxTokens: 3000,
    };

    super(profile);
    this.initializeAgents();
  }

  private initializeAgents(): void {
    // Register all specialist agents
    this.agentRegistry['analyst'] = new AnalystAgent();
    this.agentRegistry['investigator'] = new InvestigatorAgent();
    
    // TODO: Add more agents as they're implemented
    // this.agentRegistry['profiler'] = new ProfilerAgent();
    // this.agentRegistry['forecaster'] = new ForecasterAgent();
    // this.agentRegistry['financial'] = new FinancialAgent();

    console.log(`[Coordinator] Initialized with ${Object.keys(this.agentRegistry).length} agents`);
  }

  protected getRequiredCapabilitiesForTask(task: AgentTask): AgentCapability[] {
    // Coordinator doesn't have specific capabilities - it delegates
    return [];
  }

  async executeTask(task: AgentTask): Promise<AgentResponse> {
    const startTime = Date.now();

    console.log(`[Coordinator] Executing coordination task: ${task.type}`);

    try {
      // Step 1: Analyze query and create execution plan
      const plan = await this.createCoordinatorPlan(task);

      // Step 2: Execute plan (dispatch to specialist agents)
      const agentResponses = await this.executePlan(plan);

      // Step 3: Synthesize responses
      const finalAnswer = await this.synthesizeResponses(plan, agentResponses);

      const executionTime = Date.now() - startTime;

      return this.createResponse(
        task.id,
        true,
        {
          plan,
          agentResponses,
          finalAnswer,
        },
        this.calculateOverallConfidence(agentResponses),
        'Coordinator synthesized responses from multiple agents',
        this.gatherAllEvidence(agentResponses),
        executionTime
      );
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      return this.createResponse(
        task.id,
        false,
        null,
        0,
        `Coordination error: ${error.message}`,
        [],
        executionTime,
        error.message
      );
    }
  }

  /**
   * Analyze query and create execution plan
   */
  private async createCoordinatorPlan(task: AgentTask): Promise<CoordinatorPlan> {
    const { query } = task.input;

    console.log(`[Coordinator] Creating plan for: ${query}`);

    // Classify query intent and determine which agents to invoke
    const intent = this.classifyIntent(query);
    const requiredAgents = this.determineRequiredAgents(intent);

    // Create sub-tasks for each agent
    const tasks: AgentTask[] = requiredAgents.map((agentRole, index) => ({
      id: `${task.id}-subtask-${index}`,
      type: this.getTaskTypeForAgent(agentRole, intent),
      description: `${agentRole} analysis for: ${query}`,
      assignedTo: agentRole,
      status: 'pending',
      priority: task.priority,
      input: task.input,
      dependencies: [], // Could add dependencies here for sequential execution
    }));

    const plan: CoordinatorPlan = {
      id: `plan-${task.id}`,
      query,
      intent,
      tasks,
      dependencies: new Map(),
      executionOrder: tasks.map(t => t.id), // Simple parallel for now
      estimatedDuration: tasks.length * 1000, // Rough estimate
      createdAt: new Date(),
    };

    console.log(`[Coordinator] Plan created with ${tasks.length} tasks for agents: ${requiredAgents.join(', ')}`);

    return plan;
  }

  /**
   * Classify query intent
   */
  private classifyIntent(query: string): string {
    const lowerQuery = query.toLowerCase();

    // Pattern analysis
    if (lowerQuery.includes('pattern') || lowerQuery.includes('trend') || lowerQuery.includes('hotspot')) {
      return 'pattern_analysis';
    }

    // Relationship queries
    if (lowerQuery.includes('connect') || lowerQuery.includes('relationship') || lowerQuery.includes('network')) {
      return 'relationship_query';
    }

    // Investigation queries
    if (lowerQuery.includes('investigate') || lowerQuery.includes('evidence') || lowerQuery.includes('case')) {
      return 'investigation_query';
    }

    // Predictive queries
    if (lowerQuery.includes('predict') || lowerQuery.includes('forecast') || lowerQuery.includes('risk')) {
      return 'predictive_query';
    }

    // Financial queries
    if (lowerQuery.includes('money') || lowerQuery.includes('financial') || lowerQuery.includes('transaction')) {
      return 'financial_query';
    }

    // Default: general retrieval
    return 'general_retrieval';
  }

  /**
   * Determine which agents are needed for this intent
   */
  private determineRequiredAgents(intent: string): AgentRole[] {
    const agentMap: Record<string, AgentRole[]> = {
      'pattern_analysis': ['analyst'],
      'relationship_query': ['investigator', 'analyst'],
      'investigation_query': ['investigator', 'analyst'],
      'predictive_query': ['analyst'], // TODO: add 'forecaster' when implemented
      'financial_query': ['investigator'], // TODO: add 'financial' when implemented
      'general_retrieval': ['analyst'],
    };

    return agentMap[intent] || ['analyst'];
  }

  /**
   * Get appropriate task type for agent
   */
  private getTaskTypeForAgent(agentRole: AgentRole, intent: string): string {
    if (agentRole === 'analyst') {
      if (intent === 'pattern_analysis') return 'analyze_crime_patterns';
      if (intent === 'predictive_query') return 'detect_trends';
      return 'analyze_crime_patterns';
    }

    if (agentRole === 'investigator') {
      if (intent === 'relationship_query') return 'map_relationships';
      if (intent === 'investigation_query') return 'investigate_case';
      return 'gather_evidence';
    }

    return 'general_task';
  }

  /**
   * Execute the plan by dispatching tasks to agents
   */
  private async executePlan(plan: CoordinatorPlan): Promise<AgentResponse[]> {
    console.log(`[Coordinator] Executing plan with ${plan.tasks.length} tasks`);

    const responses: AgentResponse[] = [];

    // For now, execute in parallel (simple approach)
    // TODO: Respect dependencies for sequential execution
    const promises = plan.tasks.map(async (task) => {
      const agent = this.agentRegistry[task.assignedTo];

      if (!agent) {
        console.error(`[Coordinator] Agent ${task.assignedTo} not found in registry`);
        return this.createResponse(
          task.id,
          false,
          null,
          0,
          `Agent ${task.assignedTo} not available`,
          [],
          0,
          'Agent not found'
        );
      }

      task.status = 'in_progress';
      task.startedAt = new Date();

      try {
        const response = await agent.executeTask(task);
        
        task.status = response.success ? 'completed' : 'failed';
        task.completedAt = new Date();
        task.output = response.result;
        task.error = response.error;

        return response;
      } catch (error: any) {
        task.status = 'failed';
        task.completedAt = new Date();
        task.error = error.message;

        return this.createResponse(
          task.id,
          false,
          null,
          0,
          `Task execution failed: ${error.message}`,
          [],
          0,
          error.message
        );
      }
    });

    const allResponses = await Promise.all(promises);
    responses.push(...allResponses);

    this.responseHistory.push(...responses);

    return responses;
  }

  /**
   * Synthesize responses from multiple agents into final answer
   */
  private async synthesizeResponses(
    plan: CoordinatorPlan,
    responses: AgentResponse[]
  ): Promise<string> {
    console.log(`[Coordinator] Synthesizing ${responses.length} agent responses`);

    // Gather all successful responses
    const successfulResponses = responses.filter(r => r.success);

    if (successfulResponses.length === 0) {
      return 'Unable to generate answer - all agent queries failed.';
    }

    // Build synthesis prompt
    const evidenceText = successfulResponses
      .map(r => {
        return `**${r.agent} Agent**:\n${r.reasoning}\nConfidence: ${r.confidence}\nEvidence: ${r.evidence.join(', ')}`;
      })
      .join('\n\n');

    const synthesisPrompt = `Synthesize the following agent responses into a coherent answer for the query: "${plan.query}"

${evidenceText}

Provide a clear, evidence-based answer that:
1. Integrates insights from all agents
2. Highlights key findings
3. Notes any conflicts or uncertainties
4. Maintains appropriate confidence level`;

    // Use LLM to synthesize (mock for now)
    const synthesized = `Based on analysis from ${successfulResponses.length} specialist agent(s):

${successfulResponses.map(r => `- **${r.agent}**: ${r.reasoning.slice(0, 200)}...`).join('\n')}

**Key Findings**:
${this.extractKeyFindings(successfulResponses)}

**Confidence**: ${this.calculateOverallConfidence(responses).toFixed(2)}

**Evidence Sources**: ${this.gatherAllEvidence(responses).length} pieces of evidence analyzed`;

    return synthesized;
  }

  /**
   * Extract key findings from agent responses
   */
  private extractKeyFindings(responses: AgentResponse[]): string {
    // Simple extraction - in production, use LLM to intelligently extract
    const findings = responses
      .filter(r => r.result)
      .map(r => {
        const result = r.result;
        
        if (result.patterns) {
          return `Crime patterns identified: ${result.patterns.length} patterns detected`;
        }
        if (result.hotspots) {
          return `Hotspots detected: ${result.hotspots.length} high-risk areas`;
        }
        if (result.findings) {
          return `Investigation findings: ${result.findings.length} findings documented`;
        }
        if (result.correlations) {
          return `Correlations found: ${result.correlations.length} connections`;
        }
        
        return 'Additional analysis completed';
      })
      .join('\n');

    return findings || 'Analysis in progress';
  }

  /**
   * Calculate overall confidence from agent responses
   */
  private calculateOverallConfidence(responses: AgentResponse[]): number {
    const successfulResponses = responses.filter(r => r.success);
    
    if (successfulResponses.length === 0) return 0;

    const avgConfidence = successfulResponses.reduce((sum, r) => sum + r.confidence, 0) / successfulResponses.length;
    
    return avgConfidence;
  }

  /**
   * Gather all evidence from agent responses
   */
  private gatherAllEvidence(responses: AgentResponse[]): any[] {
    const allEvidence: any[] = [];

    responses.forEach(r => {
      if (r.evidence && r.evidence.length > 0) {
        allEvidence.push(...r.evidence);
      }
    });

    // Deduplicate evidence
    return Array.from(new Set(allEvidence));
  }

  /**
   * Public method to handle user query
   */
  async handleQuery(query: string, filters?: any): Promise<MultiAgentResult> {
    const startTime = Date.now();

    // Create coordinator task
    const task: AgentTask = {
      id: `coord-${Date.now()}`,
      type: 'coordinate_query',
      description: `Coordinate multi-agent response for: ${query}`,
      assignedTo: 'coordinator',
      status: 'pending',
      priority: 'medium',
      input: { query, filters },
    };

    // Execute coordination
    const response = await this.executeTask(task);

    const totalTime = Date.now() - startTime;

    const result: MultiAgentResult = {
      query,
      coordinatorPlan: response.result.plan,
      agentResponses: response.result.agentResponses,
      finalAnswer: response.result.finalAnswer,
      confidence: response.confidence,
      reasoning: response.reasoning,
      evidence: response.evidence,
      metadata: {
        totalTasks: response.result.plan.tasks.length,
        completedTasks: response.result.plan.tasks.filter((t: AgentTask) => t.status === 'completed').length,
        failedTasks: response.result.plan.tasks.filter((t: AgentTask) => t.status === 'failed').length,
        totalExecutionTimeMs: totalTime,
        agentsInvolved: response.result.agentResponses.map((r: AgentResponse) => r.agent),
      },
    };

    return result;
  }
}
