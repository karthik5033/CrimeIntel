/**
 * Phase 0.5: Verifier Agent
 * 
 * Verifies AI-generated answers against evidence, flags unsupported claims
 */

import { BaseAgent } from './base-agent';
import {
  AgentProfile,
  AgentTask,
  AgentResponse,
  AgentCapability,
} from './types';

export interface VerificationResult {
  isValid: boolean;
  supportedClaims: string[];
  unsupportedClaims: string[];
  partiallySupported: string[];
  confidence: number;
  reasoning: string;
  flagsForReview: string[];
}

export class VerifierAgent extends BaseAgent {
  constructor() {
    const profile: AgentProfile = {
      role: 'coordinator', // Verifier is a coordinator sub-agent
      capabilities: [],
      description: 'Verifier agent that checks AI outputs against evidence',
      systemPrompt: `You are a Verifier AI specialized in fact-checking and evidence verification.

Your responsibilities:
1. Extract claims from AI-generated answers
2. Check each claim against provided evidence
3. Flag unsupported or partially supported claims
4. Assess overall answer validity
5. Prevent hallucinations from reaching users

Your role is critical for maintaining trust and accuracy in the system.`,
      temperature: 0.1, // Very low temperature for factual verification
      maxTokens: 2000,
    };

    super(profile);
  }

  protected getRequiredCapabilitiesForTask(task: AgentTask): AgentCapability[] {
    return [];
  }

  async executeTask(task: AgentTask): Promise<AgentResponse> {
    const startTime = Date.now();

    console.log(`[Verifier Agent] Executing verification task`);

    try {
      const result = await this.verifyAnswer(task.input);

      const executionTime = Date.now() - startTime;

      return this.createResponse(
        task.id,
        true,
        result,
        result.confidence,
        result.reasoning,
        [],
        executionTime
      );
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      return this.createResponse(
        task.id,
        false,
        null,
        0,
        `Verification error: ${error.message}`,
        [],
        executionTime,
        error.message
      );
    }
  }

  /**
   * Verify an AI-generated answer against evidence
   */
  async verifyAnswer(input: {
    answer: string;
    evidence: any[];
    agentResponses?: AgentResponse[];
  }): Promise<VerificationResult> {
    const { answer, evidence, agentResponses } = input;

    console.log(`[Verifier] Verifying answer with ${evidence.length} pieces of evidence`);

    // Step 1: Extract claims from the answer
    const claims = this.extractClaims(answer);

    console.log(`[Verifier] Extracted ${claims.length} claims to verify`);

    // Step 2: Verify each claim against evidence
    const verificationResults = claims.map(claim => this.verifyClaim(claim, evidence, agentResponses));

    // Step 3: Categorize claims
    const supportedClaims = claims.filter((_, i) => verificationResults[i] === 'supported');
    const unsupportedClaims = claims.filter((_, i) => verificationResults[i] === 'unsupported');
    const partiallySupported = claims.filter((_, i) => verificationResults[i] === 'partial');

    // Step 4: Determine overall validity
    const isValid = unsupportedClaims.length === 0;
    const confidence = supportedClaims.length / Math.max(claims.length, 1);

    // Step 5: Generate flags for review
    const flagsForReview: string[] = [];

    if (unsupportedClaims.length > 0) {
      flagsForReview.push(`${unsupportedClaims.length} unsupported claim(s) detected`);
    }

    if (partiallySupported.length > 0) {
      flagsForReview.push(`${partiallySupported.length} claim(s) need additional evidence`);
    }

    if (evidence.length === 0) {
      flagsForReview.push('No evidence provided - cannot verify claims');
    }

    const reasoning = this.generateVerificationReasoning(
      supportedClaims,
      unsupportedClaims,
      partiallySupported,
      evidence
    );

    console.log(`[Verifier] Verification complete: ${supportedClaims.length}/${claims.length} claims supported`);

    return {
      isValid,
      supportedClaims,
      unsupportedClaims,
      partiallySupported,
      confidence,
      reasoning,
      flagsForReview,
    };
  }

  /**
   * Extract verifiable claims from answer text
   */
  private extractClaims(answer: string): string[] {
    // Simple claim extraction - in production, use NLP/LLM for better extraction
    const claims: string[] = [];

    // Split by sentences
    const sentences = answer
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Filter to factual claims (exclude questions, greetings, etc.)
    for (const sentence of sentences) {
      // Skip meta-commentary
      if (sentence.toLowerCase().includes('based on') || 
          sentence.toLowerCase().includes('analysis from') ||
          sentence.toLowerCase().includes('confidence')) {
        continue;
      }

      // Include statements that make factual claims
      if (this.isFactualClaim(sentence)) {
        claims.push(sentence);
      }
    }

    return claims;
  }

  /**
   * Check if a sentence is a factual claim
   */
  private isFactualClaim(sentence: string): boolean {
    const lowerSentence = sentence.toLowerCase();

    // Questions are not claims
    if (sentence.includes('?')) return false;

    // Greetings/meta are not claims
    if (lowerSentence.startsWith('hello') || 
        lowerSentence.startsWith('thank') || 
        lowerSentence.startsWith('please')) {
      return false;
    }

    // Contains factual indicators
    const factualIndicators = [
      'detected', 'found', 'identified', 'shows', 'indicates',
      'crime', 'suspect', 'evidence', 'hotspot', 'pattern',
      'increased', 'decreased', 'correlation', 'trend',
    ];

    return factualIndicators.some(indicator => lowerSentence.includes(indicator));
  }

  /**
   * Verify a single claim against evidence
   */
  private verifyClaim(
    claim: string,
    evidence: any[],
    agentResponses?: AgentResponse[]
  ): 'supported' | 'unsupported' | 'partial' {
    // Simple heuristic verification - in production, use semantic similarity

    if (evidence.length === 0) {
      return 'unsupported';
    }

    // Check if claim keywords appear in evidence
    const claimKeywords = this.extractKeywords(claim);
    const evidenceText = JSON.stringify(evidence).toLowerCase();

    let matchCount = 0;
    for (const keyword of claimKeywords) {
      if (evidenceText.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }

    const matchRatio = matchCount / Math.max(claimKeywords.length, 1);

    if (matchRatio >= 0.7) return 'supported';
    if (matchRatio >= 0.3) return 'partial';
    return 'unsupported';
  }

  /**
   * Extract keywords from a claim
   */
  private extractKeywords(claim: string): string[] {
    // Simple keyword extraction - remove stop words
    const stopWords = new Set([
      'the', 'is', 'are', 'was', 'were', 'a', 'an', 'and', 'or', 'but',
      'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'as',
    ]);

    return claim
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  /**
   * Generate human-readable verification reasoning
   */
  private generateVerificationReasoning(
    supported: string[],
    unsupported: string[],
    partial: string[],
    evidence: any[]
  ): string {
    const total = supported.length + unsupported.length + partial.length;

    if (total === 0) {
      return 'No verifiable claims found in answer';
    }

    let reasoning = `Verification Results:\n`;
    reasoning += `- ${supported.length}/${total} claims fully supported by evidence\n`;

    if (partial.length > 0) {
      reasoning += `- ${partial.length} claims partially supported (need additional evidence)\n`;
    }

    if (unsupported.length > 0) {
      reasoning += `- ${unsupported.length} claims UNSUPPORTED (flagged for removal)\n`;
      reasoning += `\nUnsupported claims:\n${unsupported.map(c => `  • ${c}`).join('\n')}`;
    }

    reasoning += `\n\nEvidence sources: ${evidence.length} pieces analyzed`;

    return reasoning;
  }

  /**
   * Filter out unsupported claims from an answer
   */
  filterUnsupportedClaims(answer: string, verificationResult: VerificationResult): string {
    if (verificationResult.isValid) {
      return answer;
    }

    // Remove unsupported claims
    let filtered = answer;

    for (const unsupportedClaim of verificationResult.unsupportedClaims) {
      // Remove the unsupported sentence
      filtered = filtered.replace(unsupportedClaim, '');
    }

    // Clean up double periods, extra spaces
    filtered = filtered
      .replace(/\.+/g, '.')
      .replace(/\s+/g, ' ')
      .trim();

    // Add disclaimer if claims were removed
    if (verificationResult.unsupportedClaims.length > 0) {
      filtered += `\n\n[Note: ${verificationResult.unsupportedClaims.length} unsupported claim(s) were removed from this response for accuracy]`;
    }

    return filtered;
  }
}
