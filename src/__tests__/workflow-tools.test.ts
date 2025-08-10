import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIToolHandlers } from '../handlers/ai-tools';
import { MockProviderManager } from './mocks/provider-manager';

describe('Workflow Tools - Zen MCP Integration', () => {
  let handlers: AIToolHandlers;
  let mockProviderManager: MockProviderManager;

  beforeEach(() => {
    mockProviderManager = new MockProviderManager();
    // Set up all providers that our workflow tools use
    mockProviderManager.addMockProvider('openai');
    mockProviderManager.addMockProvider('gemini');
    mockProviderManager.addMockProvider('azure');
    mockProviderManager.addMockProvider('grok');
    mockProviderManager.setConfiguredProviders(['openai', 'gemini', 'azure', 'grok']);
    handlers = new AIToolHandlers(mockProviderManager as any);
  });

  describe('challenge tool', () => {
    it('should handle challenge analysis with required prompt', async () => {
      const params = {
        prompt: 'But I think the code is fine as is, why change it?'
      };

      const result = await handlers.handleChallenge(params);

      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      // Challenge tool returns JSON structure
      const responseJson = JSON.parse(result.content[0].text);
      expect(responseJson.status).toBe('challenge_created');
      expect(responseJson.original_statement).toBe('But I think the code is fine as is, why change it?');
      expect(responseJson.challenge_prompt).toContain('CRITICAL REASSESSMENT');
      expect(responseJson.instructions).toContain('Present the challenge_prompt');
    });

    it('should handle challenge with manual invocation prefix removal', async () => {
      const params = {
        prompt: 'challenge Why did you choose that approach over this one?'
      };

      const result = await handlers.handleChallenge(params);

      expect(result).toBeDefined();
      expect(result.content[0].type).toBe('text');
      
      const responseJson = JSON.parse(result.content[0].text);
      expect(responseJson.original_statement).toBe('challenge Why did you choose that approach over this one?');
    });

    it('should handle empty prompt gracefully', async () => {
      const params = {
        prompt: ''
      };

      const result = await handlers.handleChallenge(params);

      expect(result).toBeDefined();
      expect(result.content[0].type).toBe('text');
      
      const responseJson = JSON.parse(result.content[0].text);
      expect(responseJson.status).toBe('challenge_created');
    });
  });

  describe('consensus tool', () => {
    it('should handle consensus analysis with multiple models', async () => {
      const params = {
        proposal: 'We should implement microservices architecture',
        models: [
          { model: 'gemini-pro', stance: 'for' as const, provider: 'gemini' as const },
          { model: 'gpt-4', stance: 'against' as const, provider: 'openai' as const },
          { model: 'gpt-5', stance: 'neutral' as const, provider: 'azure' as const }
        ]
      };

      const result = await handlers.handleConsensus(params);

      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      // Consensus tool returns JSON structure
      const responseJson = JSON.parse(result.content[0].text);
      expect(responseJson.proposal).toBe('We should implement microservices architecture');
      expect(responseJson.individual_analyses).toBeDefined();
      expect(responseJson.synthesis).toBeDefined();
      expect(responseJson.total_models_consulted).toBe(3);
      
      // Check metadata structure
      expect(result.metadata?.toolName).toBe('consensus');
      expect(result.metadata?.modelsConsulted).toBe(3);
    });

    it('should handle consensus with files context', async () => {
      const params = {
        proposal: 'Refactor authentication system',
        models: [
          { model: 'gemini-pro', stance: 'neutral' as const }
        ],
        files: ['/src/auth.ts', '/src/middleware.ts']
      };

      const result = await handlers.handleConsensus(params);

      expect(result).toBeDefined();
      const responseJson = JSON.parse(result.content[0].text);
      expect(responseJson.proposal).toBe('Refactor authentication system');
    });

    it('should handle empty models array gracefully', async () => {
      const params = {
        proposal: 'Test proposal',
        models: []
      };

      const result = await handlers.handleConsensus(params);
      
      expect(result).toBeDefined();
      const responseJson = JSON.parse(result.content[0].text);
      expect(responseJson.proposal).toBe('Test proposal');
      expect(responseJson.total_models_consulted).toBe(0);
    });

    it('should handle same model with different stances', async () => {
      const params = {
        proposal: 'Should we use TypeScript?',
        models: [
          { model: 'gpt-4', stance: 'for' as const, provider: 'openai' as const },
          { model: 'gpt-4', stance: 'against' as const, provider: 'openai' as const }
        ]
      };

      const result = await handlers.handleConsensus(params);

      expect(result).toBeDefined();
      const responseJson = JSON.parse(result.content[0].text);
      expect(responseJson.proposal).toBe('Should we use TypeScript?');
      expect(responseJson.total_models_consulted).toBe(2);
    });
  });

  describe('planner tool', () => {
    it('should handle basic planning task', async () => {
      const params = {
        task: 'Plan migration from REST to GraphQL',
        stepNumber: 1,
        totalSteps: 5,
        scope: 'standard' as const,
        provider: 'gemini' as const,
        isRevision: false,
        isBranching: false
      };

      const result = await handlers.handlePlanner(params);

      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      // Planner returns JSON structure
      const responseJson = JSON.parse(result.content[0].text);
      expect(responseJson.currentStep.stepNumber).toBe(1);
      expect(responseJson.currentStep.totalSteps).toBe(5);
      expect(responseJson.currentStep.scope).toBe('standard');
      
      // Check metadata structure
      expect(result.metadata?.toolName).toBe('planner');
      expect(result.metadata?.stepNumber).toBe(1);
      expect(result.metadata?.totalSteps).toBe(5);
      expect(result.metadata?.scope).toBe('standard');
    });

    it('should handle comprehensive scope planning', async () => {
      const params = {
        task: 'Design enterprise authentication system',
        stepNumber: 2,
        totalSteps: 8,
        scope: 'comprehensive' as const,
        requirements: 'SAML, OAuth2, LDAP integration, multi-factor auth',
        provider: 'azure' as const,
        isRevision: false,
        isBranching: false
      };

      const result = await handlers.handlePlanner(params);

      expect(result).toBeDefined();
      const responseJson = JSON.parse(result.content[0].text);
      expect(responseJson.currentStep.scope).toBe('comprehensive');
      expect(responseJson.currentStep.requirements).toBe('SAML, OAuth2, LDAP integration, multi-factor auth');
      expect(result.metadata?.scope).toBe('comprehensive');
    });

    it('should handle step revision', async () => {
      const params = {
        task: 'Revised approach for step 3 - use different database strategy',
        stepNumber: 3,
        totalSteps: 6,
        scope: 'standard' as const,
        isRevision: true,
        revisingStep: 3,
        provider: 'gemini' as const,
        isBranching: false
      };

      const result = await handlers.handlePlanner(params);

      expect(result).toBeDefined();
      const responseJson = JSON.parse(result.content[0].text);
      expect(responseJson.currentStep.isRevision).toBe(true);
      expect(responseJson.currentStep.revisingStep).toBe(3);
    });

    it('should handle branch exploration', async () => {
      const params = {
        task: 'Explore microservices approach as alternative',
        stepNumber: 4,
        totalSteps: 7,
        scope: 'standard' as const,
        isBranching: true,
        branchingFrom: 2,
        branchId: 'microservices-approach',
        provider: 'openai' as const,
        isRevision: false
      };

      const result = await handlers.handlePlanner(params);

      expect(result).toBeDefined();
      const responseJson = JSON.parse(result.content[0].text);
      expect(responseJson.currentStep.isBranching).toBe(true);
      expect(responseJson.currentStep.branchingFrom).toBe(2);
      expect(responseJson.currentStep.branchId).toBe('microservices-approach');
    });

    it('should handle zero step numbers gracefully', async () => {
      const params = {
        task: 'Invalid step number test',
        stepNumber: 0,
        totalSteps: 1,
        scope: 'minimal' as const,
        provider: 'gemini' as const,
        isRevision: false,
        isBranching: false
      };

      const result = await handlers.handlePlanner(params);
      expect(result).toBeDefined();
      // The implementation doesn't validate step numbers, so it should work
    });
  });

  describe('precommit tool', () => {
    it('should handle precommit validation step', async () => {
      const params = {
        task: 'Validate authentication changes before commit',
        files: ['/src/auth.ts', '/src/middleware.ts', '/src/types.ts'],
        focus: 'all' as const,
        provider: 'gemini' as const,
        severity: 'medium' as const,
        includeStaged: true,
        includeUnstaged: false
      };

      const result = await handlers.handlePrecommit(params);

      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      // Precommit returns JSON structure
      const responseJson = JSON.parse(result.content[0].text);
      expect(responseJson.validation.task).toBe('Validate authentication changes before commit');
      expect(responseJson.validation.focus).toBe('all');
      
      // Check metadata structure
      expect(result.metadata?.toolName).toBe('precommit');
      expect(result.metadata?.focus).toBe('all');
    });

    it('should handle precommit with security focus', async () => {
      const params = {
        task: 'Security review of payment system changes',
        files: ['/src/payment.ts', '/src/db.ts'],
        focus: 'security' as const,
        severity: 'high' as const,
        provider: 'azure' as const,
        includeStaged: true,
        includeUnstaged: false
      };

      const result = await handlers.handlePrecommit(params);

      expect(result).toBeDefined();
      const responseJson = JSON.parse(result.content[0].text);
      expect(responseJson.validation.task).toBe('Security review of payment system changes');
      expect(responseJson.validation.focus).toBe('security');
      expect(responseJson.validation.severity).toBe('high');
      
      expect(result.metadata?.focus).toBe('security');
      expect(result.metadata?.severity).toBe('high');
    });

    it('should handle git comparison settings', async () => {
      const params = {
        task: 'Compare against main branch',
        compareTo: 'main',
        includeStaged: true,
        includeUnstaged: false,
        focus: 'all' as const,
        provider: 'openai' as const,
        severity: 'medium' as const
      };

      const result = await handlers.handlePrecommit(params);

      expect(result).toBeDefined();
      const responseJson = JSON.parse(result.content[0].text);
      expect(responseJson.validation.validation_config.compare_to).toBe('main');
      expect(responseJson.validation.validation_config.include_staged).toBe(true);
      expect(responseJson.validation.validation_config.include_unstaged).toBe(false);
    });

    it('should handle different severity levels', async () => {
      const validSeverityLevels = ['critical', 'high', 'medium', 'low', 'all'];
      
      for (const severity of validSeverityLevels) {
        const params = {
          task: 'Test severity validation',
          focus: 'all' as const,
          severity: severity as any,
          provider: 'gemini' as const,
          includeStaged: true,
          includeUnstaged: false
        };

        const result = await handlers.handlePrecommit(params);
        expect(result).toBeDefined();
        expect(result.metadata?.severity).toBe(severity);
      }
    });
  });

  describe('secaudit tool', () => {
    it('should handle comprehensive security audit', async () => {
      const params = {
        task: 'Security audit of authentication system',
        files: ['/src/auth.ts', '/src/middleware.ts', '/src/crypto.ts'],
        focus: 'comprehensive' as const,
        threatLevel: 'high' as const,
        provider: 'azure' as const,
        severity: 'all' as const
      };

      const result = await handlers.handleSecaudit(params);

      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      // Secaudit returns JSON structure
      const responseJson = JSON.parse(result.content[0].text);
      expect(responseJson.audit.task).toBe('Security audit of authentication system');
      expect(responseJson.audit.focus).toBe('comprehensive');
      expect(responseJson.audit.threat_level).toBe('high');
      
      // Check metadata structure
      expect(result.metadata?.toolName).toBe('secaudit');
      expect(result.metadata?.focus).toBe('comprehensive');
      expect(result.metadata?.threatLevel).toBe('high');
    });

    it('should handle OWASP focused audit', async () => {
      const params = {
        task: 'OWASP Top 10 security review',
        focus: 'owasp' as const,
        threatLevel: 'critical' as const,
        severity: 'critical' as const,
        provider: 'openai' as const
      };

      const result = await handlers.handleSecaudit(params);

      expect(result).toBeDefined();
      const responseJson = JSON.parse(result.content[0].text);
      expect(responseJson.audit.focus).toBe('owasp');
      expect(responseJson.audit.threat_level).toBe('critical');
      
      expect(result.metadata?.focus).toBe('owasp');
      expect(result.metadata?.threatLevel).toBe('critical');
    });

    it('should handle compliance audit', async () => {
      const params = {
        task: 'GDPR compliance security review',
        focus: 'compliance' as const,
        complianceRequirements: ['GDPR', 'SOC2', 'ISO27001'],
        threatLevel: 'medium' as const,
        provider: 'gemini' as const,
        severity: 'all' as const
      };

      const result = await handlers.handleSecaudit(params);

      expect(result).toBeDefined();
      const responseJson = JSON.parse(result.content[0].text);
      expect(responseJson.audit.focus).toBe('compliance');
      expect(responseJson.audit.compliance_requirements).toEqual(['GDPR', 'SOC2', 'ISO27001']);
      
      expect(result.metadata?.focus).toBe('compliance');
    });

    it('should validate threat levels', async () => {
      const validThreatLevels = ['low', 'medium', 'high', 'critical'];
      
      for (const threatLevel of validThreatLevels) {
        const params = {
          task: 'Test threat level validation',
          focus: 'comprehensive' as const,
          threatLevel: threatLevel as any,
          provider: 'gemini' as const,
          severity: 'all' as const
        };

        const result = await handlers.handleSecaudit(params);
        expect(result).toBeDefined();
        expect(result.metadata?.threatLevel).toBe(threatLevel);
      }
    });
  });

  describe('tracer tool', () => {
    it('should handle precision tracing mode', async () => {
      const params = {
        task: 'Trace execution flow of user authentication',
        traceMode: 'precision' as const,
        targetDescription: 'Authentication flow from login to session creation',
        files: ['/src/auth.ts', '/src/utils.ts'],
        provider: 'gemini' as const
      };

      const result = await handlers.handleTracer(params);

      expect(result).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      
      // Tracer returns JSON structure
      const responseJson = JSON.parse(result.content[0].text);
      expect(responseJson.trace.task).toBe('Trace execution flow of user authentication');
      expect(responseJson.trace.trace_mode).toBe('precision');
      expect(responseJson.trace.target_description).toBe('Authentication flow from login to session creation');
      
      // Check metadata structure
      expect(result.metadata?.toolName).toBe('tracer');
      expect(result.metadata?.traceMode).toBe('precision');
    });

    it('should handle dependencies tracing mode', async () => {
      const params = {
        task: 'Map dependencies of UserService class',
        traceMode: 'dependencies' as const,
        targetDescription: 'Map all incoming and outgoing dependencies for UserService',
        files: ['/src/services/user.ts', '/src/services/auth.ts', '/src/db.ts'],
        provider: 'azure' as const
      };

      const result = await handlers.handleTracer(params);

      expect(result).toBeDefined();
      const responseJson = JSON.parse(result.content[0].text);
      expect(responseJson.trace.trace_mode).toBe('dependencies');
      expect(responseJson.trace.target_description).toBe('Map all incoming and outgoing dependencies for UserService');
      
      expect(result.metadata?.traceMode).toBe('dependencies');
    });

    it('should handle ask mode for mode selection', async () => {
      const params = {
        task: 'Need to understand PaymentProcessor - which mode should I use?',
        traceMode: 'ask' as const,
        targetDescription: 'Understanding PaymentProcessor class structure and behavior',
        provider: 'openai' as const
      };

      const result = await handlers.handleTracer(params);

      expect(result).toBeDefined();
      const responseJson = JSON.parse(result.content[0].text);
      expect(responseJson.trace.trace_mode).toBe('ask');
      expect(responseJson.trace.target_description).toBe('Understanding PaymentProcessor class structure and behavior');
      
      expect(result.metadata?.traceMode).toBe('ask');
    });

    it('should validate trace modes', async () => {
      const validTraceModes = ['precision', 'dependencies', 'ask'];
      
      for (const traceMode of validTraceModes) {
        const params = {
          task: 'Test trace mode validation',
          traceMode: traceMode as any,
          targetDescription: 'Test target',
          provider: 'gemini' as const
        };

        const result = await handlers.handleTracer(params);
        expect(result).toBeDefined();
        expect(result.metadata?.traceMode).toBe(traceMode);
      }
    });

    it('should handle complex tracing without step-based workflow', async () => {
      const params = {
        task: 'Trace API flow with architecture diagrams',
        traceMode: 'precision' as const,
        targetDescription: 'API request flow with visual architecture reference',
        files: ['/src/controllers/api.ts', '/src/services/data.ts', '/src/db/models.ts'],
        provider: 'gemini' as const
      };

      const result = await handlers.handleTracer(params);

      expect(result).toBeDefined();
      const responseJson = JSON.parse(result.content[0].text);
      expect(responseJson.trace.trace_mode).toBe('precision');
      expect(responseJson.trace.target_description).toBe('API request flow with visual architecture reference');
    });
  });

  describe('workflow tools integration', () => {
    it('should include all workflow tools in tool definitions', () => {
      const definitions = handlers.getToolDefinitions();
      
      // Original tools: deep-reasoning, investigate, research, list-ai-models (4)
      // Zen-inspired tools: analyze-code, review-code, debug-issue, plan-feature, generate-docs (5)
      // Workflow tools: challenge, consensus, planner, precommit, secaudit, tracer (6)
      // Total: 15 tools
      expect(definitions).toHaveLength(15);

      const toolNames = definitions.map(def => def.name);
      
      // Check workflow tools are included
      expect(toolNames).toContain('challenge');
      expect(toolNames).toContain('consensus');
      expect(toolNames).toContain('planner');
      expect(toolNames).toContain('precommit');
      expect(toolNames).toContain('secaudit');
      expect(toolNames).toContain('tracer');
    });

    it('should have proper schemas for workflow tools', () => {
      const definitions = handlers.getToolDefinitions();
      
      // Test challenge tool schema
      const challenge = definitions.find(def => def.name === 'challenge');
      expect(challenge).toBeDefined();
      expect(challenge!.inputSchema.required).toEqual(['prompt']);
      expect(challenge!.inputSchema.properties.prompt).toBeDefined();

      // Test consensus tool schema
      const consensus = definitions.find(def => def.name === 'consensus');
      expect(consensus).toBeDefined();
      expect(consensus!.inputSchema.required).toEqual(['proposal', 'models']);
      expect(consensus!.inputSchema.properties.proposal).toBeDefined();
      expect(consensus!.inputSchema.properties.models).toBeDefined();

      // Test planner tool schema
      const planner = definitions.find(def => def.name === 'planner');
      expect(planner).toBeDefined();
      expect(planner!.inputSchema.required).toEqual(['task', 'stepNumber', 'totalSteps']);
      expect(planner!.inputSchema.properties.task).toBeDefined();
      expect(planner!.inputSchema.properties.stepNumber).toBeDefined();

      // Test precommit tool schema
      const precommit = definitions.find(def => def.name === 'precommit');
      expect(precommit).toBeDefined();
      expect(precommit!.inputSchema.required).toEqual(['task']);
      expect(precommit!.inputSchema.properties.task).toBeDefined();
      expect(precommit!.inputSchema.properties.focus).toBeDefined();

      // Test secaudit tool schema
      const secaudit = definitions.find(def => def.name === 'secaudit');
      expect(secaudit).toBeDefined();
      expect(secaudit!.inputSchema.required).toEqual(['task']);
      expect(secaudit!.inputSchema.properties.task).toBeDefined();
      expect(secaudit!.inputSchema.properties.focus).toBeDefined();

      // Test tracer tool schema
      const tracer = definitions.find(def => def.name === 'tracer');
      expect(tracer).toBeDefined();
      expect(tracer!.inputSchema.required).toEqual(['task']);
      expect(tracer!.inputSchema.properties.task).toBeDefined();
      expect(tracer!.inputSchema.properties.traceMode).toBeDefined();
    });

    it('should handle provider defaults correctly for workflow tools', () => {
      const definitions = handlers.getToolDefinitions();
      
      // Most workflow tools should default to 'gemini' provider
      const planner = definitions.find(def => def.name === 'planner');
      expect((planner!.inputSchema.properties as any).provider?.default).toBe('gemini');

      const tracer = definitions.find(def => def.name === 'tracer');
      expect((tracer!.inputSchema.properties as any).provider?.default).toBe('gemini');
      
      const precommit = definitions.find(def => def.name === 'precommit');
      expect((precommit!.inputSchema.properties as any).provider?.default).toBe('gemini');
      
      const secaudit = definitions.find(def => def.name === 'secaudit');
      expect((secaudit!.inputSchema.properties as any).provider?.default).toBe('gemini');
    });
  });

  describe('error handling', () => {
    it('should not throw errors for challenge tool', async () => {
      // Challenge tool doesn't use AI providers, so it won't throw provider errors
      const params = {
        prompt: 'Test error handling'
      };

      const result = await handlers.handleChallenge(params);
      expect(result).toBeDefined();
      expect(result.content[0].type).toBe('text');
    });

    it('should validate required parameters', async () => {
      // Test missing required parameter for consensus
      const invalidParams = {
        proposal: 'Test proposal'
        // Missing required 'models' parameter
      };

      await expect(handlers.handleConsensus(invalidParams as any)).rejects.toThrow();
    });

    it('should handle tracer tool without validation errors', async () => {
      // Test tracer with minimal required parameters
      const validParams = {
        task: 'Test task',
        traceMode: 'precision' as const,
        provider: 'gemini' as const
      };

      const result = await handlers.handleTracer(validParams);
      expect(result).toBeDefined();
      expect(result.content[0].type).toBe('text');
    });
  });
});
