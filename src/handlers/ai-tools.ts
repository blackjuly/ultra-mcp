import { z } from "zod";
import { ProviderManager } from "../providers/manager";

// Schema for the deep-reasoning tool
const DeepReasoningSchema = z.object({
  provider: z.enum(["openai", "gemini", "azure", "grok", "bailian"]).optional().describe("AI provider to use (defaults to Azure if configured, otherwise OpenAI)"),
  prompt: z.string().describe("The complex question or problem requiring deep reasoning"),
  model: z.string().optional().describe("Specific model to use (optional, will use provider default)"),
  temperature: z.number().min(0).max(2).optional().default(0.7).describe("Temperature for response generation"),
  maxOutputTokens: z.number().positive().optional().describe("Maximum tokens in response"),
  systemPrompt: z.string().optional().describe("System prompt to set context for reasoning"),
  reasoningEffort: z.enum(["low", "medium", "high"]).optional().default("high").describe("Reasoning effort level (for certain reasoning models)"),
  enableSearch: z.boolean().optional().default(true).describe("Enable Google Search for Gemini models"),
});

// Schema for the investigation tool
const InvestigationSchema = z.object({
  provider: z.enum(["openai", "gemini", "azure", "grok", "bailian"]).optional().describe("AI provider to use (defaults to Azure if configured, otherwise best available)"),
  topic: z.string().describe("The topic or question to investigate"),
  depth: z.enum(["shallow", "medium", "deep"]).default("deep").describe("Investigation depth"),
  model: z.string().optional().describe("Specific model to use"),
  enableSearch: z.boolean().optional().default(true).describe("Enable web search for investigation (Gemini only)"),
});

// Schema for the research tool
const ResearchSchema = z.object({
  provider: z.enum(["openai", "gemini", "azure", "grok", "bailian"]).optional().describe("AI provider to use (defaults to Azure if configured, otherwise best available)"),
  query: z.string().describe("Research query or topic"),
  sources: z.array(z.string()).optional().describe("Specific sources or contexts to consider"),
  model: z.string().optional().describe("Specific model to use"),
  outputFormat: z.enum(["summary", "detailed", "academic"]).default("detailed").describe("Output format for research"),
});

// Zen-inspired simplified tool schemas
const AnalyzeCodeSchema = z.object({
  task: z.string().describe("What to analyze (e.g., 'analyze performance of user authentication', 'review database queries')"),
  files: z.array(z.string()).optional().describe("File paths to analyze (optional)"),
  focus: z.enum(["architecture", "performance", "security", "quality", "all"]).default("all").describe("Analysis focus area"),
  provider: z.enum(["openai", "gemini", "azure", "grok", "bailian"]).optional().default("gemini").describe("AI provider to use"),
});

const ReviewCodeSchema = z.object({
  task: z.string().describe("What to review (e.g., 'review pull request changes', 'check for security issues')"),
  files: z.array(z.string()).optional().describe("File paths to review (optional)"),
  focus: z.enum(["bugs", "security", "performance", "style", "all"]).default("all").describe("Review focus area"),
  provider: z.enum(["openai", "gemini", "azure", "grok", "bailian"]).optional().default("gemini").describe("AI provider to use"),
});

const DebugIssueSchema = z.object({
  task: z.string().describe("What to debug (e.g., 'fix login error', 'investigate memory leak')"),
  files: z.array(z.string()).optional().describe("Relevant file paths (optional)"),
  symptoms: z.string().optional().describe("Error symptoms or behavior observed"),
  provider: z.enum(["openai", "gemini", "azure", "grok", "bailian"]).optional().default("gemini").describe("AI provider to use"),
});

const PlanFeatureSchema = z.object({
  task: z.string().describe("What to plan (e.g., 'add user profiles', 'implement payment system')"),
  requirements: z.string().optional().describe("Specific requirements or constraints"),
  scope: z.enum(["minimal", "standard", "comprehensive"]).default("standard").describe("Planning scope"),
  provider: z.enum(["openai", "gemini", "azure", "grok", "bailian"]).optional().default("gemini").describe("AI provider to use"),
});

const GenerateDocsSchema = z.object({
  task: z.string().describe("What to document (e.g., 'API endpoints', 'setup instructions', 'code comments')"),
  files: z.array(z.string()).optional().describe("File paths to document (optional)"),
  format: z.enum(["markdown", "comments", "api-docs", "readme"]).default("markdown").describe("Documentation format"),
  provider: z.enum(["openai", "gemini", "azure", "grok", "bailian"]).optional().default("gemini").describe("AI provider to use"),
});

// Challenge tool schema
const ChallengeSchema = z.object({
  prompt: z.string().describe("The user's message or statement to analyze critically. When manually invoked with 'challenge', exclude that prefix - just pass the actual content. For automatic invocations, pass the user's complete message unchanged."),
});

// Consensus tool schema
const ConsensusSchema = z.object({
  proposal: z.string().describe("The proposal, idea, or decision to analyze from multiple perspectives"),
  models: z.array(z.object({
    model: z.string().describe("Model name to consult (e.g., 'gemini-pro', 'gpt-4', 'gpt-5')"),
    stance: z.enum(["for", "against", "neutral"]).default("neutral").describe("Perspective stance for this model"),
    provider: z.enum(["openai", "gemini", "azure", "grok", "bailian"]).optional().describe("AI provider for this model")
  })).min(1).describe("List of models to consult with their stances"),
  files: z.array(z.string()).optional().describe("Relevant file paths for context (optional)"),
});

// Planner tool schema
const PlannerSchema = z.object({
  task: z.string().describe("The task or problem to plan. For the first step, describe the complete planning challenge in detail. For subsequent steps, provide the specific planning step content, revisions, or branch explorations."),
  stepNumber: z.number().min(1).describe("Current step number in the planning sequence (starts at 1)"),
  totalSteps: z.number().min(1).describe("Current estimate of total steps needed (can be adjusted as planning progresses)"),
  scope: z.enum(["minimal", "standard", "comprehensive"]).default("standard").describe("Planning scope and depth"),
  requirements: z.string().optional().describe("Specific requirements, constraints, or success criteria"),
  isRevision: z.boolean().optional().default(false).describe("True if this step revises a previous step"),
  revisingStep: z.number().optional().describe("If isRevision is true, which step number is being revised"),
  isBranching: z.boolean().optional().default(false).describe("True if exploring an alternative approach from a previous step"),
  branchingFrom: z.number().optional().describe("If isBranching is true, which step number to branch from"),
  branchId: z.string().optional().describe("Identifier for this planning branch (e.g., 'approach-A', 'microservices-path')"),
  provider: z.enum(["openai", "gemini", "azure", "grok", "bailian"]).optional().default("gemini").describe("AI provider to use for planning assistance"),
});

// Precommit tool schema
const PrecommitSchema = z.object({
  task: z.string().describe("What to validate for pre-commit (e.g., 'review changes before commit', 'validate security implications', 'check for breaking changes')"),
  files: z.array(z.string()).optional().describe("Specific files to validate (optional - will analyze git changes if not provided)"),
  focus: z.enum(["security", "performance", "quality", "tests", "breaking-changes", "all"]).default("all").describe("Validation focus area"),
  includeStaged: z.boolean().optional().default(true).describe("Include staged changes in validation"),
  includeUnstaged: z.boolean().optional().default(false).describe("Include unstaged changes in validation"),
  compareTo: z.string().optional().describe("Git ref to compare against (e.g., 'main', 'HEAD~1'). If not provided, analyzes current changes"),
  severity: z.enum(["critical", "high", "medium", "low", "all"]).default("medium").describe("Minimum severity level to report"),
  provider: z.enum(["openai", "gemini", "azure", "grok", "bailian"]).optional().default("gemini").describe("AI provider to use"),
});

// Security audit tool schema
const SecauditSchema = z.object({
  task: z.string().describe("What to audit for security (e.g., 'comprehensive security audit', 'OWASP Top 10 review', 'authentication security analysis')"),
  files: z.array(z.string()).optional().describe("Specific files to audit (optional - will analyze all relevant security files)"),
  focus: z.enum(["owasp", "compliance", "infrastructure", "dependencies", "comprehensive"]).default("comprehensive").describe("Security audit focus area"),
  threatLevel: z.enum(["low", "medium", "high", "critical"]).default("medium").describe("Threat level assessment based on application context"),
  complianceRequirements: z.array(z.string()).optional().describe("Compliance frameworks to check (e.g., SOC2, PCI DSS, HIPAA, GDPR)"),
  securityScope: z.string().optional().describe("Application context (web app, mobile app, API, enterprise system)"),
  severity: z.enum(["critical", "high", "medium", "low", "all"]).default("all").describe("Minimum severity level to report"),
  provider: z.enum(["openai", "gemini", "azure", "grok", "bailian"]).optional().default("gemini").describe("AI provider to use"),
});

// Tracer tool schema
const TracerSchema = z.object({
  task: z.string().describe("What to trace and WHY you need this analysis (e.g., 'trace User.login() execution flow', 'map UserService dependencies', 'understand payment processing call chain')"),
  traceMode: z.enum(["precision", "dependencies", "ask"]).default("ask").describe("Type of tracing: 'ask' (prompts user to choose), 'precision' (execution flow), 'dependencies' (structural relationships)"),
  targetDescription: z.string().optional().describe("Detailed description of what to trace - method, function, class, or module name and context"),
  files: z.array(z.string()).optional().describe("Relevant files to focus tracing on (optional)"),
  provider: z.enum(["openai", "gemini", "azure", "grok", "bailian"]).optional().default("gemini").describe("AI provider to use"),
});

export class AIToolHandlers {
  private providerManager: ProviderManager;

  constructor(providerManager: ProviderManager) {
    this.providerManager = providerManager;
  }

  async handleDeepReasoning(params: z.infer<typeof DeepReasoningSchema>) {
    // Use provided provider or get the preferred one (Azure if configured)
    const providerName = params.provider || (await this.providerManager.getPreferredProvider(['openai', 'azure']));
    const provider = await this.providerManager.getProvider(providerName);
    
    // Build a comprehensive system prompt for deep reasoning
    const systemPrompt = params.systemPrompt || `You are an expert AI assistant specializing in deep reasoning and complex problem-solving. 
    Approach problems systematically, consider multiple perspectives, and provide thorough, well-reasoned responses.
    Break down complex problems into components, analyze each thoroughly, and synthesize insights.`;

    const response = await provider.generateText({
      prompt: params.prompt,
      model: params.model,
      temperature: params.temperature,
      maxOutputTokens: params.maxOutputTokens,
      systemPrompt,
      reasoningEffort: params.reasoningEffort,
      useSearchGrounding: providerName === "gemini" ? (params.enableSearch !== false) : false,
      toolName: 'deep-reasoning',
    });

    return {
      content: [
        {
          type: "text",
          text: response.text,
        },
      ],
      metadata: {
        provider: params.provider,
        model: response.model,
        usage: response.usage,
        ...response.metadata,
      },
    };
  }

  async handleInvestigation(params: z.infer<typeof InvestigationSchema>) {
    // Use provided provider or get the preferred one (Azure if configured)
    const providerName = params.provider || (await this.providerManager.getPreferredProvider(['openai', 'gemini', 'azure', 'grok']));
    const provider = await this.providerManager.getProvider(providerName);
    
    // Build investigation prompts based on depth
    const depthPrompts = {
      shallow: "Provide a brief overview and key points about",
      medium: "Investigate and analyze the following topic, covering main aspects and implications",
      deep: "Conduct a thorough investigation of the following topic, exploring all relevant angles, implications, evidence, and potential conclusions. Be comprehensive and systematic",
    };

    const systemPrompt = `You are an expert investigator and analyst. Your task is to thoroughly investigate topics, 
    gather relevant information, analyze patterns, and provide comprehensive insights. 
    ${params.provider === "gemini" && params.enableSearch ? "Use web search to find current and relevant information." : ""}`;

    const prompt = `${depthPrompts[params.depth]}: ${params.topic}`;

    const response = await provider.generateText({
      prompt,
      model: params.model,
      systemPrompt,
      reasoningEffort: (providerName === "openai" || providerName === "azure" || providerName === "grok") ? "high" : undefined,
      useSearchGrounding: providerName === "gemini" ? (params.enableSearch !== false) : false,
      temperature: 0.5, // Lower temperature for investigation
    });

    return {
      content: [
        {
          type: "text",
          text: response.text,
        },
      ],
      metadata: {
        provider: providerName,
        model: response.model,
        investigationDepth: params.depth,
        usage: response.usage,
        ...response.metadata,
      },
    };
  }

  async handleResearch(params: z.infer<typeof ResearchSchema>) {
    // Use provided provider or get the preferred one (Azure if configured)
    const providerName = params.provider || (await this.providerManager.getPreferredProvider(['openai', 'gemini', 'azure', 'grok']));
    const provider = await this.providerManager.getProvider(providerName);
    
    // Build research prompts based on output format
    const formatInstructions = {
      summary: "Provide a concise summary of key findings and insights.",
      detailed: "Provide a comprehensive analysis with detailed findings, evidence, and conclusions.",
      academic: "Present findings in an academic format with clear structure, citations where possible, and scholarly analysis.",
    };

    const systemPrompt = `You are an expert researcher with deep knowledge across multiple domains. 
    Your task is to conduct thorough research, analyze information critically, and present findings clearly.
    ${params.sources ? `Consider these specific sources or contexts: ${params.sources.join(", ")}` : ""}
    ${formatInstructions[params.outputFormat]}`;

    const response = await provider.generateText({
      prompt: `Research the following: ${params.query}`,
      model: params.model,
      systemPrompt,
      reasoningEffort: (providerName === "openai" || providerName === "azure" || providerName === "grok") ? "high" : undefined,
      useSearchGrounding: providerName === "gemini", // Always enable search for research with Gemini
      temperature: 0.4, // Lower temperature for research accuracy
    });

    return {
      content: [
        {
          type: "text",
          text: response.text,
        },
      ],
      metadata: {
        provider: providerName,
        model: response.model,
        outputFormat: params.outputFormat,
        usage: response.usage,
        ...response.metadata,
      },
    };
  }

  async handleListModels() {
    const availableModels = this.providerManager.getAvailableModels();
    const configuredProviders = await this.providerManager.getConfiguredProviders();

    let response = "## Available AI Models\n\n";
    
    for (const [provider, models] of Object.entries(availableModels)) {
      const isConfigured = configuredProviders.includes(provider);
      response += `### ${provider.charAt(0).toUpperCase() + provider.slice(1)} ${isConfigured ? "✅" : "❌"}\n`;
      
      if (models.length > 0) {
        response += models.map(model => `- ${model}`).join("\n");
      } else {
        response += "- Not configured";
      }
      response += "\n\n";
    }

    response += `\n## Default Models\n`;
    response += `- OpenAI/Azure: gpt-5 (optimized for reasoning)\n`;
    response += `- Gemini: gemini-2.5-pro (with Google Search enabled)\n`;
    response += `- Grok: grok-4 (latest xAI model with reasoning support)\n`;

    return {
      content: [
        {
          type: "text",
          text: response,
        },
      ],
    };
  }

  // Zen-inspired simplified tool handlers
  async handleAnalyzeCode(params: z.infer<typeof AnalyzeCodeSchema>) {
    // Use provided provider or get the preferred one (Azure if configured)
    const providerName = params.provider || (await this.providerManager.getPreferredProvider(['openai', 'gemini', 'azure', 'grok']));
    const provider = await this.providerManager.getProvider(providerName);
    
    const focusPrompts = {
      architecture: "Focus on architectural patterns, design decisions, modularity, and code organization",
      performance: "Focus on performance implications, optimization opportunities, and efficiency concerns",
      security: "Focus on security vulnerabilities, authentication, authorization, and data protection",
      quality: "Focus on code quality, maintainability, readability, and best practices",
      all: "Provide comprehensive analysis covering architecture, performance, security, and quality aspects"
    };

    const systemPrompt = `You are an expert code analyst. Analyze the provided code or task systematically.
    ${focusPrompts[params.focus]}
    
    Provide insights on:
    - Key findings and patterns identified
    - Areas of concern or improvement opportunities  
    - Recommendations for enhancement
    - Technical assessment and conclusions
    
    Be specific and actionable in your analysis.`;

    const prompt = `Analyze the following: ${params.task}${params.files ? `\n\nFiles to consider: ${params.files.join(", ")}` : ""}`;

    const response = await provider.generateText({
      prompt,
      systemPrompt,
      temperature: 0.3, // Lower temperature for analytical tasks
      reasoningEffort: (providerName === "openai" || providerName === "azure" || providerName === "grok") ? "high" : undefined,
      useSearchGrounding: providerName === "gemini",
    });

    return {
      content: [
        {
          type: "text",
          text: response.text,
        },
      ],
      metadata: {
        provider: providerName,
        model: response.model,
        focus: params.focus,
        usage: response.usage,
        ...response.metadata,
      },
    };
  }

  async handleReviewCode(params: z.infer<typeof ReviewCodeSchema>) {
    // Use provided provider or get the preferred one (Azure if configured)
    const providerName = params.provider || (await this.providerManager.getPreferredProvider(['openai', 'gemini', 'azure', 'grok']));
    const provider = await this.providerManager.getProvider(providerName);
    
    const focusPrompts = {
      bugs: "Focus on identifying potential bugs, logic errors, and runtime issues",
      security: "Focus on security vulnerabilities, input validation, and secure coding practices",
      performance: "Focus on performance bottlenecks, inefficient algorithms, and optimization opportunities",
      style: "Focus on code style, formatting, naming conventions, and readability",
      all: "Provide comprehensive code review covering bugs, security, performance, and style"
    };

    const systemPrompt = `You are an expert code reviewer. Review the provided code thoroughly.
    ${focusPrompts[params.focus]}
    
    Provide detailed feedback on:
    - Issues found and their severity
    - Specific recommendations for improvement
    - Code quality assessment
    - Best practices and standards compliance
    
    Be constructive and specific in your review comments.`;

    const prompt = `Review the following: ${params.task}${params.files ? `\n\nFiles to review: ${params.files.join(", ")}` : ""}`;

    const response = await provider.generateText({
      prompt,
      systemPrompt,
      temperature: 0.2, // Very low temperature for code review accuracy
      reasoningEffort: (providerName === "openai" || providerName === "azure" || providerName === "grok") ? "high" : undefined,
      useSearchGrounding: false, // No search needed for code review
    });

    return {
      content: [
        {
          type: "text",
          text: response.text,
        },
      ],
      metadata: {
        provider: providerName,
        model: response.model,
        focus: params.focus,
        usage: response.usage,
        ...response.metadata,
      },
    };
  }

  async handleDebugIssue(params: z.infer<typeof DebugIssueSchema>) {
    // Use provided provider or get the preferred one (Azure if configured)
    const providerName = params.provider || (await this.providerManager.getPreferredProvider(['openai', 'gemini', 'azure']));
    const provider = await this.providerManager.getProvider(providerName);
    
    const systemPrompt = `You are an expert debugger and problem solver. Help identify and solve technical issues.
    
    Approach debugging systematically:
    - Analyze the problem description and symptoms
    - Identify potential root causes
    - Suggest specific debugging steps
    - Provide solution recommendations
    - Consider edge cases and related issues
    
    Be methodical and provide actionable debugging guidance.`;

    let prompt = `Debug the following issue: ${params.task}`;
    if (params.symptoms) {
      prompt += `\n\nSymptoms observed: ${params.symptoms}`;
    }
    if (params.files) {
      prompt += `\n\nRelevant files: ${params.files.join(", ")}`;
    }

    const response = await provider.generateText({
      prompt,
      systemPrompt,
      temperature: 0.4, // Balanced temperature for debugging creativity
      reasoningEffort: (providerName === "openai" || providerName === "azure" || providerName === "grok") ? "high" : undefined,
      useSearchGrounding: false, // No search needed for debugging
    });

    return {
      content: [
        {
          type: "text",
          text: response.text,
        },
      ],
      metadata: {
        provider: providerName,
        model: response.model,
        symptoms: params.symptoms,
        usage: response.usage,
        ...response.metadata,
      },
    };
  }

  async handlePlanFeature(params: z.infer<typeof PlanFeatureSchema>) {
    // Use provided provider or get the preferred one (Azure if configured)
    const providerName = params.provider || (await this.providerManager.getPreferredProvider(['openai', 'gemini', 'azure', 'grok']));
    const provider = await this.providerManager.getProvider(providerName);
    
    const scopePrompts = {
      minimal: "Provide a basic implementation plan with essential components only",
      standard: "Provide a detailed implementation plan with proper architecture and considerations",
      comprehensive: "Provide an extensive implementation plan with full architecture, testing, documentation, and deployment considerations"
    };

    const systemPrompt = `You are an expert software architect and project planner. Create detailed implementation plans for features.
    ${scopePrompts[params.scope]}
    
    Include in your plan:
    - Feature breakdown and components
    - Implementation steps and timeline
    - Technical considerations and dependencies
    - Testing and validation approach
    - Potential challenges and mitigation strategies
    
    Be practical and actionable in your planning.`;

    let prompt = `Plan the following feature: ${params.task}`;
    if (params.requirements) {
      prompt += `\n\nRequirements: ${params.requirements}`;
    }

    const response = await provider.generateText({
      prompt,
      systemPrompt,
      temperature: 0.6, // Moderate temperature for creative planning
      reasoningEffort: providerName === "openai" || providerName === "azure" ? "medium" : undefined,
      useSearchGrounding: providerName === "gemini",
    });

    return {
      content: [
        {
          type: "text",
          text: response.text,
        },
      ],
      metadata: {
        provider: providerName,
        model: response.model,
        scope: params.scope,
        usage: response.usage,
        ...response.metadata,
      },
    };
  }

  async handleGenerateDocs(params: z.infer<typeof GenerateDocsSchema>) {
    // Use provided provider or get the preferred one (Azure if configured)
    const providerName = params.provider || (await this.providerManager.getPreferredProvider(['openai', 'gemini', 'azure', 'grok']));
    const provider = await this.providerManager.getProvider(providerName);
    
    const formatPrompts = {
      markdown: "Generate documentation in markdown format with proper structure and formatting",
      comments: "Generate inline code comments and docstrings for the specified code",
      "api-docs": "Generate API documentation with endpoints, parameters, responses, and examples",
      readme: "Generate README documentation with setup, usage, and project information"
    };

    const systemPrompt = `You are an expert technical writer and documentation specialist.
    ${formatPrompts[params.format]}
    
    Create comprehensive documentation that:
    - Is clear and easy to understand
    - Follows proper formatting and structure
    - Includes relevant examples and usage
    - Covers all important aspects
    - Is practical and actionable
    
    Ensure documentation is professional and user-friendly.`;

    let prompt = `Generate documentation for: ${params.task}`;
    if (params.files) {
      prompt += `\n\nFiles to document: ${params.files.join(", ")}`;
    }

    const response = await provider.generateText({
      prompt,
      systemPrompt,
      temperature: 0.5, // Balanced temperature for documentation clarity
      useSearchGrounding: providerName === "gemini",
    });

    return {
      content: [
        {
          type: "text",
          text: response.text,
        },
      ],
      metadata: {
        provider: providerName,
        model: response.model,
        format: params.format,
        usage: response.usage,
        ...response.metadata,
      },
    };
  }

  async handleChallenge(params: z.infer<typeof ChallengeSchema>) {
    // Challenge tool doesn't use AI - it just wraps the prompt in critical thinking instructions
    const wrappedPrompt = this.wrapPromptForChallenge(params.prompt);
    
    const responseData = {
      status: "challenge_created",
      original_statement: params.prompt,
      challenge_prompt: wrappedPrompt,
      instructions: (
        "Present the challenge_prompt to yourself and follow its instructions. " +
        "Reassess the statement carefully and critically before responding. " +
        "If, after reflection, you find reasons to disagree or qualify it, explain your reasoning. " +
        "Likewise, if you find reasons to agree, articulate them clearly and justify your agreement."
      ),
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(responseData, null, 2),
        },
      ],
    };
  }

  private wrapPromptForChallenge(prompt: string): string {
    return (
      `CRITICAL REASSESSMENT – Do not automatically agree:\n\n` +
      `"${prompt}"\n\n` +
      `Carefully evaluate the statement above. Is it accurate, complete, and well-reasoned? ` +
      `Investigate if needed before replying, and stay focused. If you identify flaws, gaps, or misleading ` +
      `points, explain them clearly. Likewise, if you find the reasoning sound, explain why it holds up. ` +
      `Respond with thoughtful analysis—stay to the point and avoid reflexive agreement.`
    );
  }

  async handleConsensus(params: z.infer<typeof ConsensusSchema>) {
    const responses: any[] = [];
    
    // Consult each model with their specified stance
    for (const modelConfig of params.models) {
      const providerName = modelConfig.provider || (await this.providerManager.getPreferredProvider(['openai', 'gemini', 'azure', 'grok']));
      const provider = await this.providerManager.getProvider(providerName);
      
      // Build stance-specific system prompt
      let stancePrompt = "";
      switch (modelConfig.stance) {
        case "for":
          stancePrompt = "You are analyzing this proposal from a supportive perspective. Focus on benefits, opportunities, and positive aspects while being realistic about implementation.";
          break;
        case "against":
          stancePrompt = "You are analyzing this proposal from a critical perspective. Focus on risks, challenges, drawbacks, and potential issues while being fair and constructive.";
          break;
        case "neutral":
        default:
          stancePrompt = "You are analyzing this proposal from a balanced, neutral perspective. Consider both benefits and risks, opportunities and challenges equally.";
          break;
      }

      const systemPrompt = `${stancePrompt}
      
      Provide a thorough analysis of the proposal considering:
      - Technical feasibility and implementation complexity
      - Benefits and value proposition
      - Risks and potential challenges
      - Resource requirements and timeline considerations
      - Alternative approaches or modifications
      
      Be specific and actionable in your analysis.`;

      let prompt = `Analyze this proposal: ${params.proposal}`;
      if (params.files) {
        prompt += `\n\nRelevant files for context: ${params.files.join(", ")}`;
      }

      try {
        const response = await provider.generateText({
          prompt,
          model: modelConfig.model,
          systemPrompt,
          temperature: 0.3, // Lower temperature for more consistent analysis
          useSearchGrounding: providerName === "gemini",
          toolName: 'consensus',
        });

        responses.push({
          model: modelConfig.model,
          provider: providerName,
          stance: modelConfig.stance,
          analysis: response.text,
          usage: response.usage,
        });
      } catch (error) {
        responses.push({
          model: modelConfig.model,
          provider: providerName,
          stance: modelConfig.stance,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Generate synthesis
    const synthesisPrompt = `Based on the following analyses from different perspectives, provide a comprehensive consensus summary:

${responses.map((r, i) => 
  r.error 
    ? `${i + 1}. ${r.model} (${r.stance}, ERROR): ${r.error}`
    : `${i + 1}. ${r.model} (${r.stance}): ${r.analysis}`
).join('\n\n')}

Please synthesize these perspectives into:
1. **Key Points of Agreement**: What do most analyses agree on?
2. **Major Concerns and Disagreements**: Where do the analyses differ?
3. **Balanced Recommendation**: Based on all perspectives, what would you recommend?
4. **Next Steps**: What additional considerations or actions might be needed?

Be objective and highlight both the strongest arguments for and against the proposal.`;

    const synthesisProvider = await this.providerManager.getProvider(await this.providerManager.getPreferredProvider(['openai', 'gemini', 'azure', 'grok']));
    const synthesis = await synthesisProvider.generateText({
      prompt: synthesisPrompt,
      systemPrompt: "You are an expert facilitator synthesizing multiple expert opinions. Provide balanced, objective analysis that captures the full spectrum of perspectives.",
      temperature: 0.4,
      useSearchGrounding: false,
      toolName: 'consensus',
    });

    const result = {
      proposal: params.proposal,
      individual_analyses: responses,
      synthesis: synthesis.text,
      total_models_consulted: responses.length,
      successful_consultations: responses.filter(r => !r.error).length,
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
      metadata: {
        toolName: "consensus",
        modelsConsulted: responses.length,
        synthesisModel: synthesis.model,
        totalUsage: responses.reduce((acc, r) => {
          if (r.usage) {
            return {
              inputTokens: (acc.inputTokens || 0) + (r.usage.inputTokens || 0),
              outputTokens: (acc.outputTokens || 0) + (r.usage.outputTokens || 0),
              totalTokens: (acc.totalTokens || 0) + (r.usage.totalTokens || 0),
            };
          }
          return acc;
        }, {}),
      },
    };
  }

  async handlePlanner(params: z.infer<typeof PlannerSchema>) {
    const providerName = params.provider || (await this.providerManager.getPreferredProvider(['openai', 'gemini', 'azure']));
    const provider = await this.providerManager.getProvider(providerName);
    
    // Track planning state for step-by-step guidance
    const isFirstStep = params.stepNumber === 1;
    const isComplexPlan = params.totalSteps >= 5;
    const needsDeepThinking = isComplexPlan && params.stepNumber <= 3;
    
    // Build planning-specific system prompt based on step and complexity
    let systemPrompt = `You are an expert planner and strategic thinker. Your role is to break down complex tasks into manageable, sequential steps while considering dependencies, risks, and alternatives.

CURRENT PLANNING CONTEXT:
- Step ${params.stepNumber} of ${params.totalSteps} (${params.scope} scope)
- ${isFirstStep ? "INITIAL PLANNING" : isComplexPlan && params.stepNumber <= 3 ? "STRATEGIC PHASE" : "TACTICAL PHASE"}
- ${params.isRevision ? `REVISING previous step ${params.revisingStep}` : ""}
- ${params.isBranching ? `EXPLORING alternative from step ${params.branchingFrom} (${params.branchId})` : ""}

PLANNING GUIDELINES:`;

    if (isFirstStep) {
      systemPrompt += `
STEP 1 - FOUNDATION SETTING:
- Thoroughly understand the complete scope and complexity
- Consider multiple high-level approaches and their trade-offs
- Identify key stakeholders, constraints, and success criteria
- Think about resource requirements and potential challenges
- Establish the overall strategy before diving into tactics`;
    } else if (needsDeepThinking) {
      systemPrompt += `
STRATEGIC PLANNING PHASE (Complex Plan):
- Build upon previous steps with deeper analysis
- Consider interdependencies and critical decision points
- Evaluate risks, assumptions, and validation needs
- Think through resource allocation and timeline implications
- Focus on strategic decisions before tactical implementation`;
    } else {
      systemPrompt += `
TACTICAL PLANNING PHASE:
- Develop specific, actionable steps
- Consider implementation details and practical constraints
- Sequence activities logically with clear dependencies
- Think about coordination, communication, and progress tracking
- Prepare for execution with concrete next steps`;
    }

    systemPrompt += `

RESPONSE FORMAT:
Provide a structured planning response that includes:
1. **Current Step Analysis**: ${isFirstStep ? "Complete scope understanding" : "Step-specific planning focus"}
2. **Key Considerations**: Important factors, constraints, or dependencies
3. **Planning Decision**: Specific step content or strategic direction
4. **Next Steps Guidance**: What should be planned in subsequent steps
${needsDeepThinking ? "5. **Deep Thinking Required**: Areas requiring further reflection" : ""}

${params.requirements ? `\nREQUIREMENTS TO CONSIDER:\n${params.requirements}` : ""}`;

    // Build the planning prompt
    let prompt = `Planning Task: ${params.task}`;
    
    if (!isFirstStep) {
      prompt += `\n\nThis is step ${params.stepNumber} in a ${params.totalSteps}-step planning process.`;
      if (params.isRevision) {
        prompt += ` I'm revising step ${params.revisingStep} based on new insights.`;
      }
      if (params.isBranching) {
        prompt += ` I'm exploring an alternative approach (${params.branchId}) branching from step ${params.branchingFrom}.`;
      }
    }

    prompt += `\n\nProvide the planning analysis for this step with specific, actionable guidance.`;

    try {
      const response = await provider.generateText({
        prompt,
        systemPrompt,
        temperature: 0.6, // Balanced temperature for creative yet structured planning
        reasoningEffort: (providerName === "openai" || providerName === "azure" || providerName === "grok") ? "high" : undefined,
        useSearchGrounding: providerName === "gemini" && params.scope === "comprehensive",
        toolName: 'planner',
      });

      // Build structured response
      const planningStep = {
        stepNumber: params.stepNumber,
        totalSteps: params.totalSteps,
        stepContent: response.text,
        scope: params.scope,
        isRevision: params.isRevision || false,
        revisingStep: params.revisingStep,
        isBranching: params.isBranching || false,
        branchingFrom: params.branchingFrom,
        branchId: params.branchId,
        requirements: params.requirements,
      };

      // Determine if more steps are needed and provide guidance
      const isLastStep = params.stepNumber >= params.totalSteps;
      const nextStepGuidance = isLastStep 
        ? "Planning complete. Present the final plan with clear implementation guidance."
        : needsDeepThinking 
        ? `MANDATORY PAUSE: This is a complex plan requiring deep thinking. Before step ${params.stepNumber + 1}, reflect on strategic decisions, alternatives, and critical dependencies.`
        : `Continue with step ${params.stepNumber + 1}. Focus on ${params.stepNumber >= params.totalSteps - 2 ? "implementation details and concrete actions" : "detailed planning and dependencies"}.`;

      const result = {
        currentStep: planningStep,
        planningComplete: isLastStep,
        nextStepRequired: !isLastStep,
        nextStepNumber: isLastStep ? null : params.stepNumber + 1,
        planningGuidance: nextStepGuidance,
        deepThinkingRequired: needsDeepThinking && !isLastStep,
        plannerStatus: {
          phase: isFirstStep ? "foundation" : needsDeepThinking ? "strategic" : "tactical",
          complexity: isComplexPlan ? "complex" : "standard",
          totalSteps: params.totalSteps,
          currentStep: params.stepNumber,
          remainingSteps: params.totalSteps - params.stepNumber,
        },
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        metadata: {
          toolName: "planner",
          stepNumber: params.stepNumber,
          totalSteps: params.totalSteps,
          scope: params.scope,
          provider: providerName,
          model: response.model,
          planningPhase: result.plannerStatus.phase,
          usage: response.usage,
          ...response.metadata,
        },
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: "Planning step failed",
              message: error instanceof Error ? error.message : "Unknown error",
              stepNumber: params.stepNumber,
              totalSteps: params.totalSteps,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  async handlePrecommit(params: z.infer<typeof PrecommitSchema>) {
    const providerName = params.provider || (await this.providerManager.getPreferredProvider(['openai', 'gemini', 'azure', 'grok']));
    const provider = await this.providerManager.getProvider(providerName);
    
    // Build focus-specific system prompt
    const focusPrompts = {
      security: "Focus on security implications, potential vulnerabilities, authentication issues, data exposure risks, and security best practices.",
      performance: "Focus on performance impact, efficiency concerns, resource usage, scalability implications, and optimization opportunities.",
      quality: "Focus on code quality, maintainability, readability, design patterns, architecture concerns, and technical debt.",
      tests: "Focus on test coverage, test quality, edge cases, testing strategies, and verification completeness.",
      "breaking-changes": "Focus on breaking changes, API compatibility, backward compatibility, and impact on existing functionality.",
      all: "Provide comprehensive validation covering security, performance, quality, tests, and breaking changes.",
    };

    const systemPrompt = `You are an expert code reviewer specializing in pre-commit validation and change analysis. Your role is to thoroughly examine code changes and provide comprehensive feedback before commits.

VALIDATION FOCUS: ${focusPrompts[params.focus]}

ANALYSIS AREAS:
1. **Change Impact**: Understand what's being modified and why
2. **Risk Assessment**: Identify potential issues and their severity
3. **Quality Validation**: Check code quality, patterns, and maintainability
4. **Security Review**: Look for security implications and vulnerabilities
5. **Performance Considerations**: Evaluate performance impact
6. **Test Coverage**: Assess testing adequacy for changes
7. **Breaking Changes**: Identify potential compatibility issues

RESPONSE FORMAT:
Provide a structured pre-commit validation report that includes:
- **Summary**: Brief overview of changes and overall assessment
- **Critical Issues**: High-severity problems that must be addressed
- **Concerns**: Medium-severity issues worth reviewing
- **Recommendations**: Suggestions for improvement
- **Approval Status**: Ready to commit, needs fixes, or requires further review

Severity levels: Critical (blocks commit), High (should fix), Medium (consider fixing), Low (minor improvements)`;

    // Build the validation prompt
    let prompt = `Pre-commit Validation Task: ${params.task}`;
    
    // Add file context if provided
    if (params.files && params.files.length > 0) {
      prompt += `\n\nFiles to validate: ${params.files.join(", ")}`;
    } else {
      prompt += `\n\nPlease analyze git changes (staged: ${params.includeStaged}, unstaged: ${params.includeUnstaged})`;
      if (params.compareTo) {
        prompt += ` compared to: ${params.compareTo}`;
      }
    }

    prompt += `\n\nValidation focus: ${params.focus}
Minimum severity to report: ${params.severity}

Please provide a comprehensive pre-commit validation analysis with specific findings and recommendations.`;

    try {
      const response = await provider.generateText({
        prompt,
        systemPrompt,
        temperature: 0.3, // Lower temperature for consistent validation
        reasoningEffort: (providerName === "openai" || providerName === "azure" || providerName === "grok") ? "high" : undefined,
        useSearchGrounding: false, // Pre-commit validation doesn't need web search
        toolName: 'precommit',
      });

      // Build structured response
      const validation = {
        task: params.task,
        focus: params.focus,
        severity: params.severity,
        files_analyzed: params.files || "git changes",
        validation_config: {
          include_staged: params.includeStaged,
          include_unstaged: params.includeUnstaged,
          compare_to: params.compareTo,
        },
        validation_report: response.text,
        provider_used: providerName,
        model_used: response.model,
      };

      // Parse validation report to extract key sections (simplified extraction)
      const reportText = response.text.toLowerCase();
      const hasCriticalIssues = reportText.includes("critical") || reportText.includes("blocks commit") || reportText.includes("must fix");
      const hasHighIssues = reportText.includes("high") || reportText.includes("should fix");
      const hasMediumIssues = reportText.includes("medium") || reportText.includes("consider fixing");
      
      let approvalStatus = "approved";
      if (hasCriticalIssues) {
        approvalStatus = "blocked";
      } else if (hasHighIssues) {
        approvalStatus = "needs_review";
      } else if (hasMediumIssues) {
        approvalStatus = "approved_with_suggestions";
      }

      const result = {
        validation,
        approval_status: approvalStatus,
        has_critical_issues: hasCriticalIssues,
        has_high_issues: hasHighIssues,
        has_medium_issues: hasMediumIssues,
        commit_recommendation: approvalStatus === "approved" 
          ? "Changes look good and are ready to commit."
          : approvalStatus === "blocked"
          ? "Critical issues found. Do not commit until resolved."
          : approvalStatus === "needs_review"
          ? "High-priority issues found. Consider fixing before commit."
          : "Changes are acceptable but have suggestions for improvement.",
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        metadata: {
          toolName: "precommit",
          focus: params.focus,
          approvalStatus: approvalStatus,
          provider: providerName,
          model: response.model,
          severity: params.severity,
          usage: response.usage,
          ...response.metadata,
        },
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: "Pre-commit validation failed",
              message: error instanceof Error ? error.message : "Unknown error",
              task: params.task,
              focus: params.focus,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  async handleSecaudit(params: z.infer<typeof SecauditSchema>) {
    const providerName = params.provider || (await this.providerManager.getPreferredProvider(['openai', 'gemini', 'azure']));
    const provider = await this.providerManager.getProvider(providerName);
    
    // Build focus-specific system prompt
    const focusPrompts = {
      owasp: "Focus on OWASP Top 10 vulnerabilities: injection attacks, broken authentication, sensitive data exposure, XXE, broken access control, security misconfigurations, XSS, insecure deserialization, known vulnerabilities, and insufficient logging.",
      compliance: "Focus on compliance requirements and regulatory standards. Assess controls, data protection measures, audit trails, and regulatory adherence.",
      infrastructure: "Focus on infrastructure security, deployment configurations, network security, container security, cloud security settings, and operational security.",
      dependencies: "Focus on third-party dependencies, library vulnerabilities, supply chain security, outdated packages, and dependency management.",
      comprehensive: "Provide comprehensive security audit covering OWASP Top 10, authentication/authorization, input validation, cryptography, configuration security, dependency analysis, and compliance considerations.",
    };

    // Build threat level context
    const threatLevelContext = {
      low: "Low-risk internal application with limited sensitive data access",
      medium: "Business application with customer data and moderate security requirements",
      high: "High-risk application handling sensitive data, financial information, or regulated industry requirements",
      critical: "Critical application with payment processing, healthcare data, or other highly sensitive information"
    };

    const systemPrompt = `You are an expert security auditor specializing in comprehensive security assessment and vulnerability identification. Your role is to conduct thorough security audits following industry best practices and security frameworks.

SECURITY AUDIT FOCUS: ${focusPrompts[params.focus]}

THREAT LEVEL: ${threatLevelContext[params.threatLevel]}
${params.securityScope ? `APPLICATION CONTEXT: ${params.securityScope}` : ""}
${params.complianceRequirements && params.complianceRequirements.length > 0 ? `COMPLIANCE REQUIREMENTS: ${params.complianceRequirements.join(", ")}` : ""}

AUDIT METHODOLOGY:
1. **Attack Surface Analysis**: Identify entry points, user inputs, and potential attack vectors
2. **Authentication & Authorization**: Review identity management, session handling, and access controls
3. **Input Validation & Output Encoding**: Check for injection vulnerabilities and XSS prevention
4. **Data Protection**: Analyze encryption, sensitive data handling, and privacy protection
5. **Configuration Security**: Review security configurations, default settings, and hardening
6. **Dependency Security**: Assess third-party libraries and supply chain security
7. **Error Handling & Logging**: Evaluate information disclosure and monitoring capabilities
8. **Business Logic Security**: Review workflow security and authorization bypass opportunities

VULNERABILITY ASSESSMENT:
- **Critical**: Immediate security risk requiring urgent remediation
- **High**: Significant security vulnerability that should be fixed promptly
- **Medium**: Moderate security concern that should be addressed
- **Low**: Minor security improvement or hardening opportunity

RESPONSE FORMAT:
Provide a structured security audit report including:
- **Executive Summary**: Overall security posture and key findings
- **Critical Vulnerabilities**: Immediate security risks with specific remediation steps
- **Security Findings**: Organized by severity with detailed descriptions and locations
- **Compliance Assessment**: Gaps relative to specified compliance requirements
- **Recommendations**: Prioritized security improvements with implementation guidance
- **Security Score**: Overall security rating and risk assessment`;

    // Build the audit prompt
    let prompt = `Security Audit Task: ${params.task}`;
    
    // Add file context if provided
    if (params.files && params.files.length > 0) {
      prompt += `\n\nFiles to audit: ${params.files.join(", ")}`;
    } else {
      prompt += `\n\nPlease conduct comprehensive security analysis of all relevant application files.`;
    }

    prompt += `\n\nAudit focus: ${params.focus}
Threat level: ${params.threatLevel}
Minimum severity to report: ${params.severity}`;

    if (params.securityScope) {
      prompt += `\nApplication context: ${params.securityScope}`;
    }

    if (params.complianceRequirements && params.complianceRequirements.length > 0) {
      prompt += `\nCompliance requirements: ${params.complianceRequirements.join(", ")}`;
    }

    prompt += `\n\nPlease provide a comprehensive security audit with specific findings, vulnerability assessments, and actionable recommendations for improving the security posture.`;

    try {
      const response = await provider.generateText({
        prompt,
        systemPrompt,
        temperature: 0.3, // Lower temperature for consistent security analysis
        reasoningEffort: (providerName === "openai" || providerName === "azure" || providerName === "grok") ? "high" : undefined,
        useSearchGrounding: providerName === "gemini", // Enable search for latest security intelligence
        toolName: 'secaudit',
      });

      // Build structured response
      const audit = {
        task: params.task,
        focus: params.focus,
        threat_level: params.threatLevel,
        security_scope: params.securityScope,
        compliance_requirements: params.complianceRequirements || [],
        severity_filter: params.severity,
        files_audited: params.files || "comprehensive analysis",
        audit_report: response.text,
        provider_used: providerName,
        model_used: response.model,
      };

      // Parse audit report to extract security findings (simplified extraction)
      const reportText = response.text.toLowerCase();
      const hasCriticalVulns = reportText.includes("critical") || reportText.includes("urgent") || reportText.includes("immediate risk");
      const hasHighVulns = reportText.includes("high") || reportText.includes("significant") || reportText.includes("major vulnerability");
      const hasMediumVulns = reportText.includes("medium") || reportText.includes("moderate") || reportText.includes("should be addressed");
      const hasLowVulns = reportText.includes("low") || reportText.includes("minor") || reportText.includes("improvement");
      
      let securityRating = "excellent";
      if (hasCriticalVulns) {
        securityRating = "critical";
      } else if (hasHighVulns) {
        securityRating = "poor";
      } else if (hasMediumVulns) {
        securityRating = "fair";
      } else if (hasLowVulns) {
        securityRating = "good";
      }

      const result = {
        audit,
        security_rating: securityRating,
        has_critical_vulnerabilities: hasCriticalVulns,
        has_high_vulnerabilities: hasHighVulns,
        has_medium_vulnerabilities: hasMediumVulns,
        has_low_vulnerabilities: hasLowVulns,
        security_recommendation: hasCriticalVulns 
          ? "URGENT: Critical security vulnerabilities found. Immediate remediation required."
          : hasHighVulns
          ? "HIGH PRIORITY: Significant security issues found. Prompt remediation recommended."
          : hasMediumVulns
          ? "MODERATE PRIORITY: Security improvements needed. Plan remediation in next sprint."
          : hasLowVulns
          ? "LOW PRIORITY: Minor security enhancements identified for future improvement."
          : "Security audit complete. No significant vulnerabilities identified.",
        remediation_priority: hasCriticalVulns ? "immediate" : hasHighVulns ? "high" : hasMediumVulns ? "medium" : "low",
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        metadata: {
          toolName: "secaudit",
          focus: params.focus,
          securityRating: securityRating,
          threatLevel: params.threatLevel,
          provider: providerName,
          model: response.model,
          severity: params.severity,
          usage: response.usage,
          ...response.metadata,
        },
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: "Security audit failed",
              message: error instanceof Error ? error.message : "Unknown error",
              task: params.task,
              focus: params.focus,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  async handleTracer(params: z.infer<typeof TracerSchema>) {
    const providerName = params.provider || (await this.providerManager.getPreferredProvider(['openai', 'gemini', 'azure', 'grok']));
    const provider = await this.providerManager.getProvider(providerName);
    
    // Build trace mode specific system prompt
    const traceModePrompts = {
      ask: "STEP 1: Ask the user to choose between 'precision' or 'dependencies' tracing mode. Explain: PRECISION MODE traces execution flow, call chains, and usage patterns (best for methods/functions). DEPENDENCIES MODE maps structural relationships and bidirectional dependencies (best for classes/modules). Wait for user selection before proceeding.",
      precision: "Focus on execution flow analysis: trace method calls, function invocations, call chains, usage patterns, execution paths, conditional branches, and data flow through the system. Best for understanding how specific methods or functions work.",
      dependencies: "Focus on structural relationship analysis: map class dependencies, module relationships, inheritance hierarchies, interface implementations, import/export chains, and bidirectional dependencies. Best for understanding how components relate to each other.",
    };

    const systemPrompt = `You are an expert code tracer specializing in systematic code analysis and relationship mapping. Your role is to conduct thorough code tracing using structured investigation workflows.

TRACING MODE: ${traceModePrompts[params.traceMode]}

TRACE ANALYSIS METHODOLOGY:
1. **Target Identification**: Locate and understand the target method/function/class/module
2. **Context Analysis**: Understand the purpose, signature, and implementation details
3. **Relationship Mapping**: ${params.traceMode === 'precision' ? 'Trace execution flow and call chains' : 'Map structural dependencies and relationships'}
4. **Pattern Recognition**: Identify architectural patterns and design decisions
5. **Comprehensive Documentation**: Document findings with precise file references and line numbers

${params.traceMode === 'precision' ? `
PRECISION TRACING FOCUS:
- Execution flow and call sequence
- Method invocation patterns
- Conditional execution paths
- Data flow and transformations
- Side effects and state changes
- Entry points and usage scenarios
` : params.traceMode === 'dependencies' ? `
DEPENDENCIES TRACING FOCUS:
- Incoming dependencies (what depends on this)
- Outgoing dependencies (what this depends on)
- Type relationships (inheritance, implementation)
- Structural patterns and architecture
- Bidirectional relationship mapping
- Module and package relationships
` : ''}

INVESTIGATION WORKFLOW:
This is a step-by-step analysis tool. You will:
1. Start with systematic code investigation
2. Gather evidence from actual code examination
3. Build comprehensive understanding through multiple investigation steps
4. Present findings in structured format with precise code references

RESPONSE FORMAT:
Provide detailed tracing analysis including:
- **Target Analysis**: Complete understanding of what is being traced
- **${params.traceMode === 'precision' ? 'Execution Flow' : 'Dependency Map'}**: ${params.traceMode === 'precision' ? 'Call chains and execution paths' : 'Structural relationships and dependencies'}
- **Code References**: Specific file paths and line numbers
- **Patterns and Insights**: Architectural observations and design patterns
- **Usage Context**: How the traced element is used in the broader system`;

    // Build the tracing prompt
    let prompt = `Code Tracing Task: ${params.task}`;
    
    if (params.targetDescription) {
      prompt += `\n\nTarget Description: ${params.targetDescription}`;
    }
    
    prompt += `\n\nTracing Mode: ${params.traceMode}`;
    
    // Add file context if provided
    if (params.files && params.files.length > 0) {
      prompt += `\n\nFiles to focus on: ${params.files.join(", ")}`;
    } else {
      prompt += `\n\nPlease analyze all relevant files in the codebase to understand the target.`;
    }

    if (params.traceMode === 'ask') {
      prompt += `\n\nPLEASE START BY ASKING THE USER TO CHOOSE A TRACING MODE:
- **PRECISION MODE**: Traces execution flow, call chains, and usage patterns (best for methods/functions)
- **DEPENDENCIES MODE**: Maps structural relationships and bidirectional dependencies (best for classes/modules)

Explain these options clearly and wait for the user to specify which mode to use before proceeding with the actual tracing analysis.`;
    } else {
      prompt += `\n\nPlease conduct systematic ${params.traceMode} tracing analysis. Examine the code thoroughly, trace all relevant relationships, and provide comprehensive findings with specific file references and line numbers.`;
    }

    try {
      const response = await provider.generateText({
        prompt,
        systemPrompt,
        temperature: 0.2, // Lower temperature for systematic analysis
        reasoningEffort: (providerName === "openai" || providerName === "azure" || providerName === "grok") ? "high" : undefined,
        useSearchGrounding: false, // Tracing focuses on local code analysis
        toolName: 'tracer',
      });

      // Build structured response
      const trace = {
        task: params.task,
        trace_mode: params.traceMode,
        target_description: params.targetDescription,
        files_analyzed: params.files || "comprehensive codebase analysis",
        trace_analysis: response.text,
        provider_used: providerName,
        model_used: response.model,
      };

      // Analyze response to determine trace completion status
      const analysisText = response.text.toLowerCase();
      const isAskingForMode = params.traceMode === 'ask' || analysisText.includes("choose") || analysisText.includes("which mode") || analysisText.includes("precision or dependencies");
      const hasCodeReferences = analysisText.includes("line") || analysisText.includes("file") || analysisText.includes(".js") || analysisText.includes(".ts") || analysisText.includes(".py");
      const hasTraceFindings = analysisText.includes("trace") || analysisText.includes("calls") || analysisText.includes("dependencies") || analysisText.includes("flow");

      let traceStatus = "in_progress";
      if (isAskingForMode) {
        traceStatus = "awaiting_mode_selection";
      } else if (hasCodeReferences && hasTraceFindings) {
        traceStatus = "analysis_complete";
      } else {
        traceStatus = "needs_more_investigation";
      }

      const result = {
        trace,
        trace_status: traceStatus,
        mode_selection_required: isAskingForMode,
        has_code_references: hasCodeReferences,
        has_trace_findings: hasTraceFindings,
        next_steps: isAskingForMode 
          ? "User must select tracing mode (precision or dependencies) before proceeding with analysis"
          : traceStatus === "needs_more_investigation"
          ? "Continue systematic code investigation to gather more tracing evidence"
          : "Tracing analysis complete with comprehensive findings",
        analysis_quality: hasCodeReferences && hasTraceFindings ? "comprehensive" : hasTraceFindings ? "moderate" : "preliminary",
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        metadata: {
          toolName: "tracer",
          traceMode: params.traceMode,
          traceStatus: traceStatus,
          provider: providerName,
          model: response.model,
          usage: response.usage,
          ...response.metadata,
        },
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: "Code tracing failed",
              message: error instanceof Error ? error.message : "Unknown error",
              task: params.task,
              traceMode: params.traceMode,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  getToolDefinitions() {
    return [
      {
        name: "deep-reasoning",
        description: "Use advanced AI models for deep reasoning and complex problem-solving. Supports GPT-5 for OpenAI/Azure and Gemini 2.5 Pro with Google Search.",
        inputSchema: {
          type: "object",
          properties: {
            provider: {
              type: "string",
              enum: ["openai", "gemini", "azure", "grok"],
              description: "AI provider to use (defaults to Azure if configured, otherwise best available)",
            },
            prompt: {
              type: "string",
              description: "The complex question or problem requiring deep reasoning",
            },
            model: {
              type: "string",
              description: "Specific model to use (optional, will use provider default)",
            },
            temperature: {
              type: "number",
              minimum: 0,
              maximum: 2,
              default: 0.7,
              description: "Temperature for response generation",
            },
            maxOutputTokens: {
              type: "number",
              description: "Maximum tokens in response",
            },
            systemPrompt: {
              type: "string",
              description: "System prompt to set context for reasoning",
            },
            reasoningEffort: {
              type: "string",
              enum: ["low", "medium", "high"],
              default: "high",
              description: "Reasoning effort level (for certain reasoning models)",
            },
            enableSearch: {
              type: "boolean",
              default: true,
              description: "Enable Google Search for Gemini models",
            },
          },
          required: ["prompt"],
        },
      },
      {
        name: "investigate",
        description: "Investigate topics thoroughly using AI models with configurable depth. Ideal for exploring subjects, gathering insights, and understanding complex topics.",
        inputSchema: {
          type: "object",
          properties: {
            provider: {
              type: "string",
              enum: ["openai", "gemini", "azure", "grok"],
              description: "AI provider to use (defaults to Azure if configured, otherwise best available)",
            },
            topic: {
              type: "string",
              description: "The topic or question to investigate",
            },
            depth: {
              type: "string",
              enum: ["shallow", "medium", "deep"],
              default: "deep",
              description: "Investigation depth",
            },
            model: {
              type: "string",
              description: "Specific model to use",
            },
            enableSearch: {
              type: "boolean",
              default: true,
              description: "Enable web search for investigation (Gemini only)",
            },
          },
          required: ["topic"],
        },
      },
      {
        name: "research",
        description: "Conduct comprehensive research using AI models. Supports multiple output formats and can consider specific sources or contexts.",
        inputSchema: {
          type: "object",
          properties: {
            provider: {
              type: "string",
              enum: ["openai", "gemini", "azure", "grok"],
              description: "AI provider to use (defaults to Azure if configured, otherwise best available)",
            },
            query: {
              type: "string",
              description: "Research query or topic",
            },
            sources: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Specific sources or contexts to consider",
            },
            model: {
              type: "string",
              description: "Specific model to use",
            },
            outputFormat: {
              type: "string",
              enum: ["summary", "detailed", "academic"],
              default: "detailed",
              description: "Output format for research",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "list-ai-models",
        description: "List all available AI models and their configuration status",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      // Zen-inspired simplified tools
      {
        name: "analyze-code",
        description: "Analyze code for architecture, performance, security, or quality issues. Simplified zen-inspired tool for systematic code analysis.",
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "What to analyze (e.g., 'analyze performance of user authentication', 'review database queries')",
            },
            files: {
              type: "array",
              items: { type: "string" },
              description: "File paths to analyze (optional)",
            },
            focus: {
              type: "string",
              enum: ["architecture", "performance", "security", "quality", "all"],
              default: "all",
              description: "Analysis focus area",
            },
            provider: {
              type: "string",
              enum: ["openai", "gemini", "azure", "grok"],
              default: "gemini",
              description: "AI provider to use",
            },
          },
          required: ["task"],
        },
      },
      {
        name: "review-code",
        description: "Review code for bugs, security issues, performance, or style problems. Simplified zen-inspired tool for systematic code review.",
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "What to review (e.g., 'review pull request changes', 'check for security issues')",
            },
            files: {
              type: "array",
              items: { type: "string" },
              description: "File paths to review (optional)",
            },
            focus: {
              type: "string",
              enum: ["bugs", "security", "performance", "style", "all"],
              default: "all",
              description: "Review focus area",
            },
            provider: {
              type: "string",
              enum: ["openai", "gemini", "azure", "grok"],
              default: "gemini",
              description: "AI provider to use",
            },
          },
          required: ["task"],
        },
      },
      {
        name: "debug-issue",
        description: "Debug technical issues with systematic problem-solving approach. Simplified zen-inspired tool for guided debugging.",
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "What to debug (e.g., 'fix login error', 'investigate memory leak')",
            },
            files: {
              type: "array",
              items: { type: "string" },
              description: "Relevant file paths (optional)",
            },
            symptoms: {
              type: "string",
              description: "Error symptoms or behavior observed",
            },
            provider: {
              type: "string",
              enum: ["openai", "gemini", "azure", "grok"],
              default: "gemini",
              description: "AI provider to use",
            },
          },
          required: ["task"],
        },
      },
      {
        name: "plan-feature",
        description: "Plan feature implementation with step-by-step approach. Simplified zen-inspired tool for systematic feature planning.",
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "What to plan (e.g., 'add user profiles', 'implement payment system')",
            },
            requirements: {
              type: "string",
              description: "Specific requirements or constraints",
            },
            scope: {
              type: "string",
              enum: ["minimal", "standard", "comprehensive"],
              default: "standard",
              description: "Planning scope",
            },
            provider: {
              type: "string",
              enum: ["openai", "gemini", "azure", "grok"],
              default: "gemini",
              description: "AI provider to use",
            },
          },
          required: ["task"],
        },
      },
      {
        name: "generate-docs",
        description: "Generate documentation in various formats (markdown, comments, API docs, README). Simplified zen-inspired tool for documentation creation.",
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "What to document (e.g., 'API endpoints', 'setup instructions', 'code comments')",
            },
            files: {
              type: "array",
              items: { type: "string" },
              description: "File paths to document (optional)",
            },
            format: {
              type: "string",
              enum: ["markdown", "comments", "api-docs", "readme"],
              default: "markdown",
              description: "Documentation format",
            },
            provider: {
              type: "string",
              enum: ["openai", "gemini", "azure", "grok"],
              default: "gemini",
              description: "AI provider to use",
            },
          },
          required: ["task"],
        },
      },
      {
        name: "challenge",
        description: "This tool helps prevent reflexive agreement when users challenge your responses. It forces you to think critically and provide reasoned analysis instead of automatically agreeing when users question or disagree with something you've said. Use this tool to ensure thoughtful evaluation rather than compliance. The tool should be invoked in two conditions: 1) when the user requests this tool with the word 'challenge', 2) automatically when the following conditions are met: MANDATORY AUTOMATIC INVOCATION: You MUST automatically use this tool when the following conditions are met: The user is questioning, disagreeing with, or challenging something you previously said or a task you performed AND there is an existing conversation context AND this is not a new/initial question AND specifically, when their message expresses any of these patterns IN RESPONSE to your prior statements: • Disagreement with your assessment ('But I don't think...', 'I disagree...') • Challenging your assumptions or countering your proposal ('But ...', 'You're assuming...') • Questioning your evaluation ('But isn't it actually...', 'But consider...') • Confusion about your reasoning ('I'm confused why...', 'I don't understand...') • Belief you made an error ('That doesn't seem right...', 'Are you sure...') • Seeking justification ('Why did you...', 'Shouldn't we...') • Surprise at your conclusion ('But I thought...', 'Wait, why...') Common patterns include messages starting with: 'But ...', 'Why did you...', 'I thought...', 'Shouldn't we...', 'That seems wrong...', 'Are you sure...', 'I'm confused...', etc. DO NOT AUTO trigger for new feature requests or INITIAL questions when context is ambiguous or referring to a new topic altogether. This tool helps with seeking truth through critical analysis. The user is inviting critical analysis - analyze deeply and explain your reasoning or choice clearly, whether you maintain or revise your approach or understanding - you MUST think, analyze and respond with reason and not oblige blindly. Truth and correctness matter more than agreement.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The user's message or statement to analyze critically. When manually invoked with 'challenge', exclude that prefix - just pass the actual content. For automatic invocations, pass the user's complete message unchanged.",
            },
          },
          required: ["prompt"],
        },
      },
      {
        name: "consensus",
        description: "Gather perspectives from multiple AI models and synthesize a comprehensive consensus analysis. Use this to get different viewpoints on proposals, decisions, or complex topics by consulting multiple models with different stances (for/against/neutral).",
        inputSchema: {
          type: "object",
          properties: {
            proposal: {
              type: "string",
              description: "The proposal, idea, or decision to analyze from multiple perspectives",
            },
            models: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  model: {
                    type: "string",
                    description: "Model name to consult (e.g., 'gemini-pro', 'gpt-4', 'gpt-5')",
                  },
                  stance: {
                    type: "string",
                    enum: ["for", "against", "neutral"],
                    default: "neutral",
                    description: "Perspective stance for this model",
                  },
                  provider: {
                    type: "string",
                    enum: ["openai", "gemini", "azure", "grok"],
                    description: "AI provider for this model (optional)",
                  },
                },
                required: ["model"],
              },
              minItems: 1,
              description: "List of models to consult with their stances",
            },
            files: {
              type: "array",
              items: { type: "string" },
              description: "Relevant file paths for context (optional)",
            },
          },
          required: ["proposal", "models"],
        },
      },
      {
        name: "planner",
        description: "Interactive step-by-step planner for breaking down complex tasks and projects. This tool guides you through sequential planning with the ability to revise, branch, and adapt as understanding deepens. Features include forced deep thinking pauses for complex plans (≥5 steps), branching for alternative approaches, and dynamic step adjustment. Perfect for complex project planning, system design, migration strategies, and architectural decisions.",
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "The task or problem to plan. For the first step, describe the complete planning challenge in detail. For subsequent steps, provide the specific planning step content, revisions, or branch explorations.",
            },
            stepNumber: {
              type: "number",
              minimum: 1,
              description: "Current step number in the planning sequence (starts at 1)",
            },
            totalSteps: {
              type: "number",
              minimum: 1,
              description: "Current estimate of total steps needed (can be adjusted as planning progresses)",
            },
            scope: {
              type: "string",
              enum: ["minimal", "standard", "comprehensive"],
              default: "standard",
              description: "Planning scope and depth",
            },
            requirements: {
              type: "string",
              description: "Specific requirements, constraints, or success criteria (optional)",
            },
            isRevision: {
              type: "boolean",
              default: false,
              description: "True if this step revises a previous step",
            },
            revisingStep: {
              type: "number",
              description: "If isRevision is true, which step number is being revised",
            },
            isBranching: {
              type: "boolean",
              default: false,
              description: "True if exploring an alternative approach from a previous step",
            },
            branchingFrom: {
              type: "number",
              description: "If isBranching is true, which step number to branch from",
            },
            branchId: {
              type: "string",
              description: "Identifier for this planning branch (e.g., 'approach-A', 'microservices-path')",
            },
            provider: {
              type: "string",
              enum: ["openai", "gemini", "azure", "grok"],
              default: "gemini",
              description: "AI provider to use for planning assistance",
            },
          },
          required: ["task", "stepNumber", "totalSteps"],
        },
      },
      {
        name: "precommit",
        description: "Pre-commit validation tool for analyzing code changes before committing. Validates changes for security, performance, quality, test coverage, and breaking changes. Provides structured feedback and commit recommendations.",
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "What to validate for pre-commit (e.g., 'review changes before commit', 'validate security implications', 'check for breaking changes')",
            },
            files: {
              type: "array",
              items: { type: "string" },
              description: "Specific files to validate (optional - will analyze git changes if not provided)",
            },
            focus: {
              type: "string",
              enum: ["security", "performance", "quality", "tests", "breaking-changes", "all"],
              default: "all",
              description: "Validation focus area",
            },
            includeStaged: {
              type: "boolean",
              default: true,
              description: "Include staged changes in validation",
            },
            includeUnstaged: {
              type: "boolean",
              default: false,
              description: "Include unstaged changes in validation",
            },
            compareTo: {
              type: "string",
              description: "Git ref to compare against (e.g., 'main', 'HEAD~1'). If not provided, analyzes current changes",
            },
            severity: {
              type: "string",
              enum: ["critical", "high", "medium", "low", "all"],
              default: "medium",
              description: "Minimum severity level to report",
            },
            provider: {
              type: "string",
              enum: ["openai", "gemini", "azure", "grok"],
              default: "gemini",
              description: "AI provider to use",
            },
          },
          required: ["task"],
        },
      },
      {
        name: "secaudit",
        description: "Comprehensive security audit tool for analyzing code, infrastructure, and configurations. Provides OWASP Top 10 analysis, compliance assessment, vulnerability identification, and security recommendations with severity-based findings.",
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "What to audit for security (e.g., 'comprehensive security audit', 'OWASP Top 10 review', 'authentication security analysis')",
            },
            files: {
              type: "array",
              items: { type: "string" },
              description: "Specific files to audit (optional - will analyze all relevant security files)",
            },
            focus: {
              type: "string",
              enum: ["owasp", "compliance", "infrastructure", "dependencies", "comprehensive"],
              default: "comprehensive",
              description: "Security audit focus area",
            },
            threatLevel: {
              type: "string",
              enum: ["low", "medium", "high", "critical"],
              default: "medium",
              description: "Threat level assessment based on application context",
            },
            complianceRequirements: {
              type: "array",
              items: { type: "string" },
              description: "Compliance frameworks to check (e.g., SOC2, PCI DSS, HIPAA, GDPR)",
            },
            securityScope: {
              type: "string",
              description: "Application context (web app, mobile app, API, enterprise system)",
            },
            severity: {
              type: "string",
              enum: ["critical", "high", "medium", "low", "all"],
              default: "all",
              description: "Minimum severity level to report",
            },
            provider: {
              type: "string",
              enum: ["openai", "gemini", "azure", "grok"],
              default: "gemini",
              description: "AI provider to use",
            },
          },
          required: ["task"],
        },
      },
      {
        name: "tracer",
        description: "Step-by-step code tracing and dependency analysis tool. Supports precision tracing (execution flow analysis) and dependencies tracing (structural relationship mapping). Perfect for understanding method execution paths, call chains, and architectural relationships.",
        inputSchema: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "What to trace and WHY you need this analysis (e.g., 'trace User.login() execution flow', 'map UserService dependencies', 'understand payment processing call chain')",
            },
            traceMode: {
              type: "string",
              enum: ["precision", "dependencies", "ask"],
              default: "ask",
              description: "Type of tracing: 'ask' (prompts user to choose), 'precision' (execution flow), 'dependencies' (structural relationships)",
            },
            targetDescription: {
              type: "string",
              description: "Detailed description of what to trace - method, function, class, or module name and context (optional)",
            },
            files: {
              type: "array",
              items: { type: "string" },
              description: "Relevant files to focus tracing on (optional)",
            },
            provider: {
              type: "string",
              enum: ["openai", "gemini", "azure", "grok"],
              default: "gemini",
              description: "AI provider to use",
            },
          },
          required: ["task"],
        },
      },
    ];
  }
}
