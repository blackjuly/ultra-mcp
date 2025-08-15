import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ProviderManager } from '../providers/manager';
// Removed import for non-existent stream-utils
import { ConfigManager } from '../config/manager';
// import { trackUsage } from '../db/tracking'; // TODO: Implement tracking
import { logger } from '../utils/logger';

// Common workflow types
interface WorkflowStep {
  stepNumber: number;
  totalSteps: number;
  findings: string;
  nextStepRequired: boolean;
  confidence?: 'exploring' | 'low' | 'medium' | 'high' | 'very_high' | 'almost_certain' | 'certain';
}

// Handler response type - must extend CallToolResult
interface HandlerResponse extends CallToolResult {
  content: Array<{ type: 'text'; text: string }>;
}

// Base workflow response formatter
function formatWorkflowResponse(
  stepNumber: number,
  totalSteps: number,
  nextStepRequired: boolean,
  content: string,
  requiredActions?: string[]
): string {
  const header = `## Step ${stepNumber} of ${totalSteps}`;
  const status = nextStepRequired 
    ? `\n**Status**: Investigation in progress - more analysis needed`
    : `\n**Status**: Investigation complete - ready for final analysis`;
  
  const actions = requiredActions && requiredActions.length > 0
    ? `\n\n### Required Actions Before Next Step:\n${requiredActions.map(a => `- ${a}`).join('\n')}`
    : '';
  
  const nextStep = nextStepRequired
    ? `\n\n**Next Step**: Call this tool again with step_number=${stepNumber + 1} after completing the required actions.`
    : '';
  
  return `${header}${status}\n\n${content}${actions}${nextStep}`;
}

// Code Review Tool Schema
export const CodeReviewSchema = z.object({
  task: z.string().describe('What to review in the code'),
  files: z.array(z.string()).optional().describe('File paths to review (optional)'),
  focus: z.enum(['bugs', 'security', 'performance', 'style', 'architecture', 'all']).default('all')
    .describe('Review focus area'),
  provider: z.enum(['openai', 'gemini', 'azure', 'grok', 'bailian']).optional()
    .describe('AI provider to use'),
  model: z.string().optional().describe('Specific model to use'),
  
  // Workflow fields
  stepNumber: z.number().min(1).default(1).describe('Current step in the review workflow'),
  totalSteps: z.number().min(1).default(3).describe('Estimated total steps needed'),
  findings: z.string().default('').describe('Accumulated findings from the review'),
  nextStepRequired: z.boolean().default(true).describe('Whether another step is needed'),
  confidence: z.enum(['exploring', 'low', 'medium', 'high', 'very_high', 'almost_certain', 'certain'])
    .optional().describe('Confidence level in findings'),
  filesChecked: z.array(z.string()).default([]).describe('Files examined during review'),
  issuesFound: z.array(z.object({
    severity: z.enum(['critical', 'high', 'medium', 'low']),
    description: z.string(),
    location: z.string().optional(),
  })).default([]).describe('Issues identified during review'),
});

// Code Analysis Tool Schema  
export const CodeAnalysisSchema = z.object({
  task: z.string().describe('What to analyze in the code'),
  files: z.array(z.string()).optional().describe('File paths to analyze (optional)'),
  focus: z.enum(['architecture', 'performance', 'security', 'quality', 'scalability', 'all']).default('all')
    .describe('Analysis focus area'),
  provider: z.enum(['openai', 'gemini', 'azure', 'grok', 'bailian']).optional()
    .describe('AI provider to use'),
  model: z.string().optional().describe('Specific model to use'),
  
  // Workflow fields
  stepNumber: z.number().min(1).default(1).describe('Current step in the analysis workflow'),
  totalSteps: z.number().min(1).default(3).describe('Estimated total steps needed'),
  findings: z.string().default('').describe('Accumulated findings from the analysis'),
  nextStepRequired: z.boolean().default(true).describe('Whether another step is needed'),
  confidence: z.enum(['exploring', 'low', 'medium', 'high', 'very_high', 'almost_certain', 'certain'])
    .optional().describe('Confidence level in findings'),
});

// Debug Tool Schema
export const DebugSchema = z.object({
  issue: z.string().describe('The issue or error to debug'),
  files: z.array(z.string()).optional().describe('Relevant file paths (optional)'),
  symptoms: z.string().optional().describe('Error symptoms or behavior observed'),
  provider: z.enum(['openai', 'gemini', 'azure', 'grok', 'bailian']).optional()
    .describe('AI provider to use'),
  model: z.string().optional().describe('Specific model to use'),
  
  // Workflow fields
  stepNumber: z.number().min(1).default(1).describe('Current step in the debug workflow'),
  totalSteps: z.number().min(1).default(4).describe('Estimated total steps needed'),
  findings: z.string().default('').describe('Accumulated findings from debugging'),
  nextStepRequired: z.boolean().default(true).describe('Whether another step is needed'),
  hypothesis: z.string().optional().describe('Current theory about the issue'),
  confidence: z.enum(['exploring', 'low', 'medium', 'high', 'very_high', 'almost_certain', 'certain'])
    .optional().describe('Confidence level in findings'),
});

// Plan Tool Schema
export const PlanSchema = z.object({
  task: z.string().describe('What to plan (e.g., "add user profiles", "implement payment system")'),
  requirements: z.string().optional().describe('Specific requirements or constraints'),
  scope: z.enum(['minimal', 'standard', 'comprehensive']).default('standard')
    .describe('Planning scope and depth'),
  provider: z.enum(['openai', 'gemini', 'azure', 'grok', 'bailian']).optional()
    .describe('AI provider to use'),
  model: z.string().optional().describe('Specific model to use'),
  
  // Workflow fields
  stepNumber: z.number().min(1).default(1).describe('Current step in the planning workflow'),
  totalSteps: z.number().min(1).default(5).describe('Estimated total steps needed'),
  currentStep: z.string().default('').describe('Current planning step content'),
  nextStepRequired: z.boolean().default(true).describe('Whether another step is needed'),
  
  // Planning-specific fields
  isRevision: z.boolean().default(false).describe('True if this step revises a previous step'),
  revisingStep: z.number().optional().describe('Which step number is being revised'),
  isBranching: z.boolean().default(false).describe('True if exploring alternative approach'),
  branchingFrom: z.number().optional().describe('Which step to branch from'),
  branchId: z.string().optional().describe('Identifier for this planning branch'),
});

// Documentation Tool Schema
export const DocsSchema = z.object({
  task: z.string().describe('What to document (e.g., "API endpoints", "setup instructions")'),
  files: z.array(z.string()).optional().describe('File paths to document (optional)'),
  format: z.enum(['markdown', 'comments', 'api-docs', 'readme', 'jsdoc']).default('markdown')
    .describe('Documentation format'),
  provider: z.enum(['openai', 'gemini', 'azure', 'grok', 'bailian']).optional()
    .describe('AI provider to use'),
  model: z.string().optional().describe('Specific model to use'),
  
  // Workflow fields
  stepNumber: z.number().min(1).default(1).describe('Current step in the documentation workflow'),
  totalSteps: z.number().min(1).default(2).describe('Estimated total steps needed'),
  findings: z.string().default('').describe('Accumulated documentation content'),
  nextStepRequired: z.boolean().default(true).describe('Whether another step is needed'),
  
  // Doc-specific fields
  includeExamples: z.boolean().default(true).describe('Include code examples in documentation'),
  includeTypes: z.boolean().default(true).describe('Include type information for TypeScript/Flow'),
});

export class AdvancedToolsHandler {
  private providerManager: ProviderManager;
  private configManager: ConfigManager;

  constructor() {
    this.configManager = new ConfigManager();
    this.providerManager = new ProviderManager(this.configManager);
  }

  async handleCodeReview(args: unknown): Promise<HandlerResponse> {
    const params = CodeReviewSchema.parse(args);
    const { provider: requestedProvider, model: requestedModel, stepNumber, totalSteps, nextStepRequired, confidence, findings, files, focus, task, filesChecked, issuesFound } = params;
    
    const config = await this.configManager.getConfig();
    const providerName = requestedProvider || await this.providerManager.getPreferredProvider();
    const provider = await this.providerManager.getProvider(providerName);
    
    if (!provider) {
      throw new Error('No AI provider configured. Please run: bunx ultra-mcp config');
    }

    try {
      // Build context based on step
      let context = '';
      let requiredActions: string[] = [];
      
      if (stepNumber === 1) {
        context = `You are performing a comprehensive code review focused on ${focus}.
        
Task: ${task}
${files ? `Files to review: ${files.join(', ')}` : 'Review all relevant files in the codebase'}

Please begin your systematic code review by:
1. Understanding the code structure and purpose
2. Identifying the main components and their interactions
3. Looking for ${focus === 'all' ? 'any issues including bugs, security vulnerabilities, performance problems, and code quality issues' : `${focus}-related issues`}
4. Documenting your initial findings

Remember to be thorough and consider:
- Obvious issues and bugs
- Security implications  
- Performance considerations
- Code maintainability and readability
- Architectural decisions
- Over-engineering or unnecessary complexity`;

        requiredActions = [
          'Read and analyze the specified files or codebase',
          'Understand the overall architecture and design patterns',
          'Identify main components and their responsibilities',
          'Note any immediate concerns or issues',
          'Document initial observations about code quality',
        ];
      } else if (confidence === 'exploring' || confidence === 'low') {
        context = `Continue your code review investigation. You've made initial observations:

${findings}

Files checked so far: ${filesChecked.join(', ')}
Issues found: ${issuesFound.length}

Now dive deeper into:
- Specific code sections that raised concerns
- ${focus === 'security' ? 'Security vulnerabilities like injection, XSS, authentication flaws' : ''}
- ${focus === 'performance' ? 'Performance bottlenecks, inefficient algorithms, resource usage' : ''}
- ${focus === 'architecture' ? 'Architectural issues, coupling, missing abstractions' : ''}
- Edge cases and error handling
- Code that could be simplified or refactored`;

        requiredActions = [
          'Examine problematic code sections in detail',
          'Verify security best practices are followed',
          'Check for performance optimization opportunities',
          'Analyze error handling and edge cases',
          'Look for code duplication and refactoring opportunities',
        ];
      } else {
        context = `Complete your code review. You've thoroughly analyzed the code:

${findings}

Files reviewed: ${filesChecked.join(', ')}
Total issues found: ${issuesFound.length}

Now finalize your review by:
- Summarizing all findings by severity
- Providing specific recommendations for each issue
- Highlighting any positive aspects of the code
- Suggesting priority order for fixes`;

        requiredActions = [
          'Verify all identified issues are documented',
          'Ensure recommendations are actionable and specific',
          'Double-check no critical issues were missed',
          'Prepare final summary with prioritized fixes',
        ];
      }

      const prompt = `${context}\n\nProvide your analysis for step ${stepNumber} of ${totalSteps}.`;
      
      const fullResponse = await provider.generateText({
        prompt,
        model: requestedModel,
        temperature: 0.3,
        systemPrompt: 'Provide detailed, actionable code review feedback.',
        useSearchGrounding: false,
      });


      // TODO: Implement tracking
      // await trackUsage({
      //   tool: 'ultra-review',
      //   model: provider.getActiveModel(),
      //   provider: provider.getName(),
      //   input_tokens: 0,
      //   output_tokens: 0,
      //   cache_tokens: 0,
      //   total_tokens: 0,
      //   has_credentials: true,
      // });

      const formattedResponse = formatWorkflowResponse(
        stepNumber,
        totalSteps,
        nextStepRequired && confidence !== 'certain',
        fullResponse.text,
        requiredActions
      );

      return {
        content: [{ type: 'text', text: formattedResponse }],
      };
    } catch (error) {
      logger.error('Code review failed:', error);
      throw error;
    }
  }

  async handleCodeAnalysis(args: unknown): Promise<HandlerResponse> {
    const params = CodeAnalysisSchema.parse(args);
    const { provider: requestedProvider, model: requestedModel, stepNumber, totalSteps, nextStepRequired, confidence, findings, files, focus, task } = params;
    
    const config = await this.configManager.getConfig();
    const providerName = requestedProvider || await this.providerManager.getPreferredProvider();
    const provider = await this.providerManager.getProvider(providerName);
    
    if (!provider) {
      throw new Error('No AI provider configured. Please run: bunx ultra-mcp config');
    }

    try {
      let context = '';
      let requiredActions: string[] = [];
      
      if (stepNumber === 1) {
        context = `You are performing a comprehensive code analysis focused on ${focus}.
        
Task: ${task}
${files ? `Files to analyze: ${files.join(', ')}` : 'Analyze the relevant parts of the codebase'}

Begin your analysis by understanding:
1. The overall architecture and design patterns
2. ${focus === 'performance' ? 'Performance characteristics and bottlenecks' : ''}
3. ${focus === 'security' ? 'Security posture and potential vulnerabilities' : ''}
4. ${focus === 'architecture' ? 'Architectural decisions and their implications' : ''}
5. ${focus === 'quality' ? 'Code quality, maintainability, and technical debt' : ''}
6. ${focus === 'scalability' ? 'Scalability considerations and limitations' : ''}`;

        requiredActions = [
          'Map out the codebase structure and architecture',
          'Identify key components and their relationships',
          'Understand data flow and dependencies',
          'Note design patterns and architectural decisions',
          'Document initial observations',
        ];
      } else {
        context = `Continue your analysis based on previous findings:

${findings}

Deepen your investigation into:
- Specific areas of concern identified
- Hidden complexities or technical debt
- Opportunities for improvement
- Best practices and patterns that could be applied`;

        requiredActions = [
          'Investigate specific concerns in detail',
          'Analyze impact of identified issues',
          'Research best practices for similar systems',
          'Evaluate alternative approaches',
          'Document detailed findings with evidence',
        ];
      }

      const prompt = `${context}\n\nProvide your analysis for step ${stepNumber} of ${totalSteps}.`;
      
      const fullResponse = await provider.generateText({
        prompt,
        model: requestedModel,
        temperature: 0.4,
        useSearchGrounding: false,
      });

      // TODO: Implement tracking
      // await trackUsage({
      //   tool: 'ultra-analyze',
      //   model: provider.getActiveModel(),
      //   provider: provider.getName(),
      //   input_tokens: 0,
      //   output_tokens: 0,
      //   cache_tokens: 0,
      //   total_tokens: 0,
      //   has_credentials: true,
      // });

      const formattedResponse = formatWorkflowResponse(
        stepNumber,
        totalSteps,
        nextStepRequired && confidence !== 'certain',
        fullResponse.text,
        requiredActions
      );

      return {
        content: [{ type: 'text', text: formattedResponse }],
      };
    } catch (error) {
      logger.error('Code analysis failed:', error);
      throw error;
    }
  }

  async handleDebug(args: unknown): Promise<HandlerResponse> {
    const params = DebugSchema.parse(args);
    const { provider: requestedProvider, model: requestedModel, stepNumber, totalSteps, nextStepRequired, confidence, findings, issue, files, symptoms, hypothesis } = params;
    
    const config = await this.configManager.getConfig();
    const providerName = requestedProvider || await this.providerManager.getPreferredProvider();
    const provider = await this.providerManager.getProvider(providerName);
    
    if (!provider) {
      throw new Error('No AI provider configured. Please run: bunx ultra-mcp config');
    }

    try {
      let context = '';
      let requiredActions: string[] = [];
      
      if (stepNumber === 1) {
        context = `You are debugging an issue in the codebase.
        
Issue: ${issue}
${symptoms ? `Symptoms: ${symptoms}` : ''}
${files ? `Relevant files: ${files.join(', ')}` : ''}

Begin your systematic debugging by:
1. Understanding the reported issue and symptoms
2. Identifying potential root causes
3. Forming initial hypotheses
4. Planning your investigation approach`;

        requiredActions = [
          'Reproduce or understand the issue',
          'Examine error logs and stack traces',
          'Identify the code paths involved',
          'Form initial hypotheses about root cause',
          'Plan systematic investigation steps',
        ];
      } else if (stepNumber === 2) {
        context = `Continue debugging based on initial investigation:

${findings}
${hypothesis ? `Current hypothesis: ${hypothesis}` : ''}

Now investigate deeper:
- Test your hypotheses
- Trace through the code execution
- Check for common pitfalls in this area
- Look for related issues`;

        requiredActions = [
          'Test current hypothesis with evidence',
          'Trace execution flow step by step',
          'Check for race conditions or timing issues',
          'Verify assumptions about data and state',
          'Look for similar patterns elsewhere',
        ];
      } else if (confidence === 'high' || confidence === 'very_high') {
        context = `You're close to identifying the root cause:

${findings}
${hypothesis ? `Working hypothesis: ${hypothesis}` : ''}

Verify your findings and prepare the solution:
- Confirm the root cause
- Identify the fix
- Consider side effects
- Plan testing approach`;

        requiredActions = [
          'Confirm root cause with concrete evidence',
          'Design the fix or workaround',
          'Consider potential side effects',
          'Plan how to test the fix',
          'Document the issue for future reference',
        ];
      } else {
        context = `Finalize your debugging investigation:

${findings}

Provide:
- Confirmed root cause
- Recommended fix with code examples
- Testing strategy
- Prevention recommendations`;

        requiredActions = [];
      }

      const prompt = `${context}\n\nProvide your debugging analysis for step ${stepNumber} of ${totalSteps}.`;
      
      const fullResponse = await provider.generateText({
        prompt,
        model: requestedModel,
        temperature: 0.2,
        systemPrompt: 'Focus on systematic debugging and root cause analysis.',
        useSearchGrounding: false,
      });

      // TODO: Implement tracking
      // await trackUsage({
      //   tool: 'ultra-debug',
      //   model: provider.getActiveModel(),
      //   provider: provider.getName(),
      //   input_tokens: 0,
      //   output_tokens: 0,
      //   cache_tokens: 0,
      //   total_tokens: 0,
      //   has_credentials: true,
      // });

      const formattedResponse = formatWorkflowResponse(
        stepNumber,
        totalSteps,
        nextStepRequired && confidence !== 'certain',
        fullResponse.text,
        requiredActions
      );

      return {
        content: [{ type: 'text', text: formattedResponse }],
      };
    } catch (error) {
      logger.error('Debug failed:', error);
      throw error;
    }
  }

  async handlePlan(args: unknown): Promise<HandlerResponse> {
    const params = PlanSchema.parse(args);
    const { provider: requestedProvider, model: requestedModel, stepNumber, totalSteps, nextStepRequired, task, requirements, scope, currentStep, isRevision, revisingStep, isBranching, branchingFrom, branchId } = params;
    
    const config = await this.configManager.getConfig();
    const providerName = requestedProvider || await this.providerManager.getPreferredProvider();
    const provider = await this.providerManager.getProvider(providerName);
    
    if (!provider) {
      throw new Error('No AI provider configured. Please run: bunx ultra-mcp config');
    }

    try {
      let context = '';
      let requiredActions: string[] = [];
      
      if (stepNumber === 1) {
        context = `You are creating a ${scope} implementation plan.
        
Task: ${task}
${requirements ? `Requirements: ${requirements}` : ''}

Create a structured plan by:
1. Understanding the full scope of the task
2. Breaking it down into logical phases
3. Identifying dependencies and prerequisites  
4. Considering potential challenges
5. Defining success criteria`;

        requiredActions = [
          'Analyze the task requirements thoroughly',
          'Identify all stakeholders and dependencies',
          'Break down into major phases or milestones',
          'Consider technical and resource constraints',
          'Define clear success metrics',
        ];
      } else if (isRevision && revisingStep) {
        context = `You are revising step ${revisingStep} of your plan based on new insights.

Previous step content: ${currentStep}

Revise this step considering:
- New information discovered
- Better approaches identified
- Feedback or constraints
- Improved clarity or detail`;

        requiredActions = [
          'Review the original step content',
          'Identify what needs revision and why',
          'Incorporate new insights or corrections',
          'Ensure consistency with other steps',
          'Update dependencies if needed',
        ];
      } else if (isBranching && branchingFrom) {
        context = `You are exploring an alternative approach branching from step ${branchingFrom}.

Branch: ${branchId || 'Alternative Approach'}

Explore a different path by:
- Taking a fundamentally different approach
- Using alternative technologies or methods
- Addressing the same goal differently`;

        requiredActions = [
          'Define the alternative approach clearly',
          'Explain why this branch is worth exploring',
          'Outline the different steps in this path',
          'Compare trade-offs with the main approach',
          'Identify unique benefits or risks',
        ];
      } else {
        const stepContext = stepNumber <= 3 && totalSteps >= 5
          ? '\n\nIMPORTANT: This is an early planning stage. Take time to think deeply about strategic decisions, architectural choices, and long-term implications before moving to tactical details.'
          : '';
          
        context = `Continue planning step ${stepNumber} of ${totalSteps}.

Previous planning: ${currentStep}

Develop the next aspect of your plan:
- Build on previous steps
- Add more detail and specificity
- Address dependencies and risks
- Include concrete actions${stepContext}`;

        requiredActions = [
          'Review previous planning steps',
          'Identify the next logical planning element',
          'Add specific implementation details',
          'Consider risks and mitigation strategies',
          'Ensure alignment with overall objectives',
        ];
      }

      const prompt = `${context}\n\nProvide your planning for step ${stepNumber} of ${totalSteps}.`;
      
      const fullResponse = await provider.generateText({
        prompt,
        model: requestedModel,
        temperature: 0.6,
        systemPrompt: scope === 'comprehensive' 
          ? 'Provide detailed, thorough planning with multiple alternatives considered.'
          : scope === 'minimal'
          ? 'Keep planning concise and focused on essential elements only.'
          : 'Balance detail with clarity in your planning.',
        useSearchGrounding: false,
      });

      // TODO: Implement tracking
      // await trackUsage({
      //   tool: 'ultra-plan',
      //   model: provider.getActiveModel(),
      //   provider: provider.getName(),
      //   input_tokens: 0,
      //   output_tokens: 0,
      //   cache_tokens: 0,
      //   total_tokens: 0,
      //   has_credentials: true,
      // });

      const formattedResponse = formatWorkflowResponse(
        stepNumber,
        totalSteps,
        nextStepRequired,
        fullResponse.text,
        requiredActions
      );

      return {
        content: [{ type: 'text', text: formattedResponse }],
      };
    } catch (error) {
      logger.error('Planning failed:', error);
      throw error;
    }
  }

  async handleDocs(args: unknown): Promise<HandlerResponse> {
    const params = DocsSchema.parse(args);
    const { provider: requestedProvider, model: requestedModel, stepNumber, totalSteps, nextStepRequired, task, files, format, findings, includeExamples, includeTypes } = params;
    
    const config = await this.configManager.getConfig();
    const providerName = requestedProvider || await this.providerManager.getPreferredProvider();
    const provider = await this.providerManager.getProvider(providerName);
    
    if (!provider) {
      throw new Error('No AI provider configured. Please run: bunx ultra-mcp config');
    }

    try {
      let context = '';
      let requiredActions: string[] = [];
      
      if (stepNumber === 1) {
        const formatInstructions = {
          markdown: 'Use clear Markdown formatting with headers, lists, and code blocks',
          comments: 'Generate inline code comments following language conventions',
          'api-docs': 'Create API documentation with endpoints, parameters, and responses',
          readme: 'Write a comprehensive README with setup, usage, and examples',
          jsdoc: 'Generate JSDoc comments for functions and classes',
        };
        
        context = `You are generating ${format} documentation.
        
Task: ${task}
${files ? `Files to document: ${files.join(', ')}` : ''}

Requirements:
- ${formatInstructions[format]}
- ${includeExamples ? 'Include practical code examples' : 'Focus on descriptions without examples'}
- ${includeTypes ? 'Include type information and signatures' : 'Omit type details'}

Begin by:
1. Understanding what needs to be documented
2. Analyzing the code structure and purpose
3. Planning the documentation structure`;

        requiredActions = [
          'Analyze the code or system to document',
          'Understand the target audience',
          'Plan documentation structure and sections',
          'Identify key concepts to explain',
          'Gather examples if needed',
        ];
      } else {
        context = `Complete the documentation based on your analysis:

${findings}

Finalize by:
- Ensuring completeness and accuracy
- Adding examples and use cases
- Checking formatting and readability
- Including any necessary warnings or notes`;

        requiredActions = [
          'Review documentation for completeness',
          'Add missing sections or details',
          'Ensure examples are working and clear',
          'Check for consistency in style',
          'Add helpful notes and tips',
        ];
      }

      const prompt = `${context}\n\nGenerate documentation for step ${stepNumber} of ${totalSteps}.`;
      
      const fullResponse = await provider.generateText({
        prompt,
        model: requestedModel,
        temperature: 0.3,
        systemPrompt: `Generate high-quality ${format} documentation that is clear, accurate, and helpful.`,
        useSearchGrounding: false,
      });

      // TODO: Implement tracking
      // await trackUsage({
      //   tool: 'ultra-docs',
      //   model: provider.getActiveModel(),
      //   provider: provider.getName(),
      //   input_tokens: 0,
      //   output_tokens: 0,
      //   cache_tokens: 0,
      //   total_tokens: 0,
      //   has_credentials: true,
      // });

      const formattedResponse = formatWorkflowResponse(
        stepNumber,
        totalSteps,
        nextStepRequired,
        fullResponse.text,
        requiredActions
      );

      return {
        content: [{ type: 'text', text: formattedResponse }],
      };
    } catch (error) {
      logger.error('Documentation generation failed:', error);
      throw error;
    }
  }

  async handle(request: { method: string; params: { arguments: unknown } }): Promise<CallToolResult> {
    const { method, params } = request;

    switch (method) {
      case 'ultra-review':
        return await this.handleCodeReview(params.arguments);
      case 'ultra-analyze':
        return await this.handleCodeAnalysis(params.arguments);
      case 'ultra-debug':
        return await this.handleDebug(params.arguments);
      case 'ultra-plan':
        return await this.handlePlan(params.arguments);
      case 'ultra-docs':
        return await this.handleDocs(params.arguments);
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }
}