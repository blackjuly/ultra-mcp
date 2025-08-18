import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { ProviderManager } from '../providers/manager';
import { ConfigManager } from '../config/manager';
import { AIToolHandlers } from '../handlers/ai-tools';
// Removed import for non-existent stream-utils
// import { trackUsage } from '../db/tracking'; // TODO: Implement tracking
import { promptForModel } from './chat-injectable';
import { getConfigManager } from '../config/manager';

// Helper to format tool responses for CLI display
function formatCliResponse(response: string): string {
  // Convert markdown headers to chalk formatting
  return response
    .replace(/^## (.+)$/gm, chalk.bold.cyan('\n$1'))
    .replace(/^### (.+)$/gm, chalk.bold('$1'))
    .replace(/\*\*Status\*\*: (.+)$/gm, chalk.yellow('Status: $1'))
    .replace(/\*\*Next Step\*\*: (.+)$/gm, chalk.green('Next Step: $1'))
    .replace(/^- (.+)$/gm, chalk.gray('• $1'));
}

// Base workflow executor
async function executeWorkflow(
  toolName: string,
  initialPrompt: string,
  options: {
    provider?: string;
    model?: string;
    focus?: string;
    scope?: string;
    format?: string;
  }
) {
  const configManager = new ConfigManager();
  const config = await configManager.getConfig();
  const providerManager = new ProviderManager(configManager);
  
  // Get provider and model
  const { provider: selectedProvider, model: selectedModel } = await promptForModel(
    options.provider,
    options.model,
    config,
    providerManager
  );
  
  const provider = await providerManager.getProvider(selectedProvider);
  if (!provider) {
    console.error(chalk.red('Error: No AI provider configured. Please run: bunx ultra-mcp config'));
    process.exit(1);
  }

  // Note: model will be passed directly to generateText calls

  const spinner = ora(`Starting ${toolName} workflow...`).start();
  
  try {
    let step = 1;
    let totalSteps = 3;
    let findings = '';
    let nextStepRequired = true;
    let confidence = 'exploring';
    
    // Tool-specific initial parameters
    const baseParams: any = {
      provider: selectedProvider,
      model: selectedModel,
      stepNumber: step,
      totalSteps,
      findings,
      nextStepRequired,
      confidence,
    };
    
    // Add tool-specific parameters
    switch (toolName) {
      case 'review':
        baseParams.task = initialPrompt;
        baseParams.focus = options.focus || 'all';
        baseParams.filesChecked = [];
        baseParams.issuesFound = [];
        break;
      case 'analyze':
        baseParams.task = initialPrompt;
        baseParams.focus = options.focus || 'all';
        break;
      case 'debug':
        baseParams.issue = initialPrompt;
        baseParams.hypothesis = '';
        totalSteps = 4;
        baseParams.totalSteps = totalSteps;
        break;
      case 'plan':
        baseParams.task = initialPrompt;
        baseParams.scope = options.scope || 'standard';
        baseParams.currentStep = '';
        totalSteps = 5;
        baseParams.totalSteps = totalSteps;
        break;
      case 'docs':
        baseParams.task = initialPrompt;
        baseParams.format = options.format || 'markdown';
        totalSteps = 2;
        baseParams.totalSteps = totalSteps;
        break;
    }
    
    // Execute workflow steps
    while (nextStepRequired && step <= totalSteps + 2) { // Allow some extra steps
      spinner.text = `Executing step ${step} of ${totalSteps}...`;
      
      // Import and execute the handler
      const { AdvancedToolsHandler } = await import('../handlers/advanced-tools');
      const handler = new AdvancedToolsHandler();
      
      let response;
      switch (toolName) {
        case 'review':
          response = await handler.handleCodeReview(baseParams);
          break;
        case 'analyze':
          response = await handler.handleCodeAnalysis(baseParams);
          break;
        case 'debug':
          response = await handler.handleDebug(baseParams);
          break;
        case 'plan':
          response = await handler.handlePlan(baseParams);
          break;
        case 'docs':
          response = await handler.handleDocs(baseParams);
          break;
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
      
      spinner.stop();
      
      // Display the response
      const content = response.content[0];
      if (content.type === 'text') {
        console.log(formatCliResponse(content.text));
      }
      
      // Check if we need to continue
      const responseText = content.type === 'text' ? content.text : '';
      nextStepRequired = responseText.includes('Call this tool again with step_number=');
      
      if (nextStepRequired) {
        // Extract findings and update parameters
        const findingsMatch = responseText.match(/## Step \d+ of \d+[\s\S]*?\n\n([\s\S]+?)(?=\n\n### Required Actions|$)/);
        if (findingsMatch) {
          findings += '\n\n' + findingsMatch[1];
          baseParams.findings = findings.trim();
        }
        
        // Update step number
        step++;
        baseParams.stepNumber = step;
        
        // Update confidence based on step progress
        if (step === 2) {
          confidence = 'low';
        } else if (step === 3) {
          confidence = 'medium';
        } else if (step >= totalSteps - 1) {
          confidence = 'high';
        }
        baseParams.confidence = confidence;
        
        // Tool-specific updates
        if (toolName === 'plan' && responseText.includes('Previous planning:')) {
          baseParams.currentStep = findings;
        }
        
        console.log(chalk.gray('\n---\n'));
        spinner.start(`Continuing to step ${step}...`);
      }
    }
    
    spinner.succeed(chalk.green(`${toolName} workflow completed!`));
    
    // TODO: Implement tracking
    // await trackUsage({
    //   tool: `ultra-${toolName}-cli`,
    //   model: provider.getActiveModel(),
    //   provider: provider.getName(),
    //   input_tokens: 0,
    //   output_tokens: 0,
    //   cache_tokens: 0,
    //   total_tokens: 0,
    //   has_credentials: true,
    // });
    
  } catch (error) {
    spinner.fail(chalk.red('Workflow failed'));
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

// Create review command
export function createReviewCommand() {
  const command = new Command('review')
    .description('Perform comprehensive code review with step-by-step analysis')
    .argument('<task>', 'What to review (e.g., "review the authentication module")')
    .option('-p, --provider <provider>', 'AI provider (openai, gemini, azure, grok)')
    .option('-m, --model <model>', 'Specific model to use')
    .option('-f, --focus <focus>', 'Review focus: bugs, security, performance, style, architecture, all', 'all')
    .action(async (task, options) => {
      await executeWorkflow('review', task, options);
    });
  
  return command;
}

// Create analyze command
export function createAnalyzeCommand() {
  const command = new Command('analyze')
    .description('Perform comprehensive code analysis with step-by-step workflow')
    .argument('<task>', 'What to analyze (e.g., "analyze the database schema design")')
    .option('-p, --provider <provider>', 'AI provider (openai, gemini, azure, grok)')
    .option('-m, --model <model>', 'Specific model to use')
    .option('-f, --focus <focus>', 'Analysis focus: architecture, performance, security, quality, scalability, all', 'all')
    .action(async (task, options) => {
      await executeWorkflow('analyze', task, options);
    });
  
  return command;
}

// Create debug command
export function createDebugCommand() {
  const command = new Command('debug')
    .description('Debug issues with systematic root cause analysis')
    .argument('<issue>', 'The issue to debug (e.g., "users cannot login after deployment")')
    .option('-p, --provider <provider>', 'AI provider (openai, gemini, azure, grok)')
    .option('-m, --model <model>', 'Specific model to use')
    .action(async (issue, options) => {
      await executeWorkflow('debug', issue, options);
    });
  
  return command;
}

// Create plan command
export function createPlanCommand() {
  const command = new Command('plan')
    .description('Create multi-step feature implementation plans')
    .argument('<task>', 'What to plan (e.g., "implement user authentication system")')
    .option('-p, --provider <provider>', 'AI provider (openai, gemini, azure, grok)')
    .option('-m, --model <model>', 'Specific model to use')
    .option('-s, --scope <scope>', 'Planning scope: minimal, standard, comprehensive', 'standard')
    .action(async (task, options) => {
      await executeWorkflow('plan', task, options);
    });
  
  return command;
}

// Create docs command
export function createDocsCommand() {
  const command = new Command('docs')
    .description('Generate comprehensive documentation')
    .argument('<task>', 'What to document (e.g., "document the REST API endpoints")')
    .option('-p, --provider <provider>', 'AI provider (openai, gemini, azure, grok)')
    .option('-m, --model <model>', 'Specific model to use')
    .option('-f, --format <format>', 'Documentation format: markdown, comments, api-docs, readme, jsdoc', 'markdown')
    .action(async (task, options) => {
      await executeWorkflow('docs', task, options);
    });
  
  return command;
}

// Create consensus command
export function createConsensusCommand(): Command {
  const command = new Command('consensus')
    .description('Get consensus from multiple AI models on a proposal')
    .argument('<proposal>', 'The proposal to analyze')
    .option('--models <models>', 'JSON array of model configurations')
    .action(async (proposal, options) => {
      try {
        const configManager = await getConfigManager();
        const providerManager = new ProviderManager(configManager);
        const handler = new AIToolHandlers(providerManager);
    
        let models;
        if (options.models) {
          try {
            models = JSON.parse(options.models);
          } catch (e) {
            console.error('Error parsing models JSON:', e.message);
            return;
          }
        } else {
          models = [
            { model: 'deepseek-r1', stance: 'neutral', provider: 'deepseek-r1' },
            { model: 'qwen3-coder', stance: 'neutral', provider: 'qwen3-coder' }
          ];
        }
    
        const result = await handler.handleConsensus({
          proposal,
          models
        });
        
        // Output the result to console
        console.log(result.content[0].text);
      } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
      }
    });

  return command;
}