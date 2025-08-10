import prompts from 'prompts';
import chalk from 'chalk';
import { ConfigManager } from './manager';
import { VectorConfigSchema } from './schema';
import { OpenAICompatibleProvider } from '../providers/openai-compatible';

export async function runInteractiveConfig(): Promise<void> {
  const configManager = new ConfigManager();
  const currentConfig = await configManager.getConfig();

  console.log(chalk.blue.bold('\n🛠️  Ultra MCP Configuration\n'));
  console.log(chalk.gray(`Config file location: ${await configManager.getConfigPath()}\n`));

  // Show current configuration status
  console.log(chalk.yellow('Current configuration:'));
  console.log(chalk.gray('- OpenAI API Key:'), currentConfig.openai?.apiKey ? chalk.green('✓ Set') : chalk.red('✗ Not set'));
  console.log(chalk.gray('- Google API Key:'), currentConfig.google?.apiKey ? chalk.green('✓ Set') : chalk.red('✗ Not set'));
  console.log(chalk.gray('- Azure API Key:'), currentConfig.azure?.apiKey ? chalk.green('✓ Set') : chalk.red('✗ Not set'));
  console.log(chalk.gray('- xAI API Key:'), currentConfig.xai?.apiKey ? chalk.green('✓ Set') : chalk.red('✗ Not set'));
  console.log(chalk.gray('- OpenAI-Compatible:'), currentConfig.openaiCompatible?.baseURL ? chalk.green('✓ Set') : chalk.red('✗ Not set'));
  console.log();

  const response = await prompts([
    {
      type: 'select',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { title: 'Configure OpenAI', value: 'openai' },
        { title: 'Configure Google Gemini', value: 'google' },
        { title: 'Configure Azure OpenAI', value: 'azure' },
        { title: 'Configure xAI Grok', value: 'xai' },
        { title: 'Configure OpenAI-Compatible (Ollama/OpenRouter)', value: 'openai-compatible' },
        { title: 'Configure Vector Indexing', value: 'vector' },
        { title: 'View Current Configuration', value: 'view' },
        { title: 'Reset Configuration', value: 'reset' },
        { title: 'Exit', value: 'exit' },
      ],
    },
  ]);

  if (response.action === 'openai') {
    await configureOpenAI(configManager);
    await runInteractiveConfig(); // Return to main menu
  } else if (response.action === 'google') {
    await configureGoogle(configManager);
    await runInteractiveConfig(); // Return to main menu
  } else if (response.action === 'azure') {
    await configureAzure(configManager);
    await runInteractiveConfig(); // Return to main menu
  } else if (response.action === 'xai') {
    await configureXai(configManager);
    await runInteractiveConfig(); // Return to main menu
  } else if (response.action === 'openai-compatible') {
    await configureOpenAICompatible(configManager);
    await runInteractiveConfig(); // Return to main menu
  } else if (response.action === 'vector') {
    await configureVectorIndexing(configManager);
  } else if (response.action === 'view') {
    await viewConfiguration(configManager, chalk);
  } else if (response.action === 'reset') {
    await resetConfiguration(configManager, chalk);
  }
}

async function configureApiKeys(configManager: ConfigManager): Promise<void> {
  const currentConfig = await configManager.getConfig();

  console.log(chalk.blue('\n📝 Configure API Keys'));
  console.log(chalk.gray('Press Enter to keep the current value, or enter a new value.'));
  console.log(chalk.gray('Enter "clear" to remove an API key.\n'));

  // OpenAI API Key
  const openaiResponse = await prompts([
    {
      type: 'text',
      name: 'apiKey',
      message: 'OpenAI API Key:',
      initial: currentConfig.openai?.apiKey ? '(current value hidden)' : '',
    },
    {
      type: 'text',
      name: 'baseURL',
      message: 'OpenAI Base URL (optional, leave empty for default):',
      initial: currentConfig.openai?.baseURL || '',
    },
  ]);

  if (openaiResponse.apiKey && openaiResponse.apiKey !== '(current value hidden)') {
    if (openaiResponse.apiKey.toLowerCase() === 'clear') {
      await configManager.setApiKey('openai', undefined);
      console.log(chalk.yellow('OpenAI API Key cleared'));
    } else {
      await configManager.setApiKey('openai', openaiResponse.apiKey);
      console.log(chalk.green('OpenAI API Key updated'));
    }
  }

  if (openaiResponse.baseURL !== undefined && openaiResponse.baseURL !== currentConfig.openai?.baseURL) {
    await configManager.setBaseURL('openai', openaiResponse.baseURL || undefined);
    console.log(chalk.green('OpenAI Base URL updated'));
  }

  // Google API Key
  const googleResponse = await prompts([
    {
      type: 'text',
      name: 'apiKey',
      message: 'Google Gemini API Key:',
      initial: currentConfig.google?.apiKey ? '(current value hidden)' : '',
    },
    {
      type: 'text',
      name: 'baseURL',
      message: 'Google Base URL (optional, leave empty for default):',
      initial: currentConfig.google?.baseURL || '',
    },
  ]);

  if (googleResponse.apiKey && googleResponse.apiKey !== '(current value hidden)') {
    if (googleResponse.apiKey.toLowerCase() === 'clear') {
      await configManager.setApiKey('google', undefined);
      console.log(chalk.yellow('Google API Key cleared'));
    } else {
      await configManager.setApiKey('google', googleResponse.apiKey);
      console.log(chalk.green('Google API Key updated'));
    }
  }

  if (googleResponse.baseURL !== undefined && googleResponse.baseURL !== currentConfig.google?.baseURL) {
    await configManager.setBaseURL('google', googleResponse.baseURL || undefined);
    console.log(chalk.green('Google Base URL updated'));
  }

  // Azure configuration (optional)
  const azurePrompt = await prompts({
    type: 'confirm',
    name: 'configureAzure',
    message: 'Would you like to configure Azure AI?',
    initial: false,
  });

  if (azurePrompt.configureAzure) {
    const azureResponse = await prompts([
      {
        type: 'text',
        name: 'apiKey',
        message: 'Azure API Key:',
        initial: currentConfig.azure?.apiKey ? '(current value hidden)' : '',
      },
      {
        type: 'text',
        name: 'baseURL',
        message: 'Azure Base URL (optional):',
        initial: currentConfig.azure?.baseURL || '',
      },
    ]);

    if (azureResponse.apiKey && azureResponse.apiKey !== '(current value hidden)') {
      if (azureResponse.apiKey.toLowerCase() === 'clear') {
        await configManager.setApiKey('azure', undefined);
        console.log(chalk.yellow('Azure API Key cleared'));
      } else {
        await configManager.setApiKey('azure', azureResponse.apiKey);
        console.log(chalk.green('Azure API Key updated'));
      }
    }

    if (azureResponse.baseURL !== undefined && azureResponse.baseURL !== currentConfig.azure?.baseURL) {
      await configManager.setBaseURL('azure', azureResponse.baseURL || undefined);
      console.log(chalk.green('Azure Base URL updated'));
    }
  }

  // xAI API Key (optional)
  const xaiPrompt = await prompts({
    type: 'confirm',
    name: 'configureXai',
    message: 'Would you like to configure xAI Grok?',
    initial: false,
  });

  if (xaiPrompt.configureXai) {
    const xaiResponse = await prompts([
      {
        type: 'text',
        name: 'apiKey',
        message: 'xAI Grok API Key:',
        initial: currentConfig.xai?.apiKey ? '(current value hidden)' : '',
      },
      {
        type: 'text',
        name: 'baseURL',
        message: 'xAI Base URL (optional, leave empty for default):',
        initial: currentConfig.xai?.baseURL || '',
      },
    ]);

    if (xaiResponse.apiKey && xaiResponse.apiKey !== '(current value hidden)') {
      if (xaiResponse.apiKey.toLowerCase() === 'clear') {
        await configManager.setApiKey('xai', undefined);
        console.log(chalk.yellow('xAI API Key cleared'));
      } else {
        await configManager.setApiKey('xai', xaiResponse.apiKey);
        console.log(chalk.green('xAI API Key updated'));
      }
    }

    if (xaiResponse.baseURL !== undefined && xaiResponse.baseURL !== currentConfig.xai?.baseURL) {
      await configManager.setBaseURL('xai', xaiResponse.baseURL || undefined);
      console.log(chalk.green('xAI Base URL updated'));
    }
  }

  // OpenAI-Compatible configuration (optional)
  const compatiblePrompt = await prompts({
    type: 'confirm',
    name: 'configureCompatible',
    message: 'Would you like to configure OpenAI-Compatible provider (Ollama/OpenRouter)?',
    initial: false,
  });

  if (compatiblePrompt.configureCompatible) {
    const providerTypeResponse = await prompts({
      type: 'select',
      name: 'providerName',
      message: 'Select provider type:',
      choices: [
        { title: 'Ollama (Local models)', value: 'ollama' },
        { title: 'OpenRouter (Cloud proxy)', value: 'openrouter' },
      ],
    });

    let baseURL = '';
    let requiresApiKey = false;
    
    if (providerTypeResponse.providerName === 'ollama') {
      baseURL = 'http://localhost:11434/v1';
      requiresApiKey = false;
    } else if (providerTypeResponse.providerName === 'openrouter') {
      baseURL = 'https://openrouter.ai/api/v1';
      requiresApiKey = true;
    }

    const compatibleResponse = await prompts([
      {
        type: 'text',
        name: 'baseURL',
        message: 'Base URL:',
        initial: currentConfig.openaiCompatible?.baseURL || baseURL,
      },
      {
        type: requiresApiKey ? 'text' : 'text',
        name: 'apiKey',
        message: requiresApiKey ? 'API Key (required for OpenRouter):' : 'API Key (optional for Ollama, can use "fake-key"):',
        initial: currentConfig.openaiCompatible?.apiKey ? '(current value hidden)' : (requiresApiKey ? '' : 'fake-key'),
      },
    ]);

    // Update the complete openai-compatible configuration
    await configManager.updateConfig({
      ...currentConfig,
      openaiCompatible: {
        baseURL: compatibleResponse.baseURL,
        providerName: providerTypeResponse.providerName,
        apiKey: compatibleResponse.apiKey && compatibleResponse.apiKey !== '(current value hidden)' 
          ? (compatibleResponse.apiKey.toLowerCase() === 'clear' ? undefined : compatibleResponse.apiKey)
          : currentConfig.openaiCompatible?.apiKey,
        models: currentConfig.openaiCompatible?.models,
      }
    });
    
    console.log(chalk.green('OpenAI-Compatible configuration updated'));
    
    console.log(chalk.green(`✅ ${providerTypeResponse.providerName} configuration saved!`));
  }

  console.log(chalk.green('\n✅ Configuration updated successfully!'));
  
  // Run the main menu again
  await runInteractiveConfig();
}

async function viewConfiguration(configManager: ConfigManager, chalk: any): Promise<void> {
  const config = await configManager.getConfig();
  
  console.log(chalk.blue('\n📋 Current Configuration\n'));
  
  console.log(chalk.bold('OpenAI:'));
  console.log(chalk.gray('  API Key:'), config.openai?.apiKey ? chalk.green(maskApiKey(config.openai.apiKey)) : chalk.red('Not set'));
  console.log(chalk.gray('  Base URL:'), config.openai?.baseURL || chalk.gray('Default'));

  console.log(chalk.bold('\nGoogle:'));
  console.log(chalk.gray('  API Key:'), config.google?.apiKey ? chalk.green(maskApiKey(config.google.apiKey)) : chalk.red('Not set'));
  console.log(chalk.gray('  Base URL:'), config.google?.baseURL || chalk.gray('Default'));

  console.log(chalk.bold('\nAzure:'));
  console.log(chalk.gray('  API Key:'), config.azure?.apiKey ? chalk.green(maskApiKey(config.azure.apiKey)) : chalk.red('Not set'));
  console.log(chalk.gray('  Base URL:'), config.azure?.baseURL || chalk.red('Not set'));

  console.log(chalk.bold('\nxAI:'));
  console.log(chalk.gray('  API Key:'), config.xai?.apiKey ? chalk.green(maskApiKey(config.xai.apiKey)) : chalk.red('Not set'));
  console.log(chalk.gray('  Base URL:'), config.xai?.baseURL || chalk.gray('Default'));

  console.log(chalk.bold('\nOpenAI-Compatible:'));
  console.log(chalk.gray('  Provider:'), config.openaiCompatible?.providerName || chalk.gray('ollama'));
  console.log(chalk.gray('  Base URL:'), config.openaiCompatible?.baseURL || chalk.gray('http://localhost:11434/v1'));
  console.log(chalk.gray('  API Key:'), config.openaiCompatible?.apiKey ? chalk.green(maskApiKey(config.openaiCompatible.apiKey)) : chalk.red('Not set'));

  console.log(chalk.bold('\nVector Indexing:'));
  console.log(chalk.gray('  Default Provider:'), config.vectorConfig?.defaultProvider || chalk.gray('openai'));
  console.log(chalk.gray('  Chunk Size:'), config.vectorConfig?.chunkSize || 1500);
  console.log(chalk.gray('  Chunk Overlap:'), config.vectorConfig?.chunkOverlap || 200);
  console.log(chalk.gray('  Batch Size:'), config.vectorConfig?.batchSize || 10);
  console.log(chalk.gray('  File Patterns:'), (config.vectorConfig?.filePatterns || ['default patterns']).length + ' patterns');
  
  console.log(chalk.gray(`\nConfig file: ${await configManager.getConfigPath()}`));
  
  await prompts({
    type: 'text',
    name: 'continue',
    message: 'Press Enter to continue...',
  });
  
  await runInteractiveConfig();
}

async function resetConfiguration(configManager: ConfigManager, chalk: any): Promise<void> {
  const confirmResponse = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: 'Are you sure you want to reset all configuration? This cannot be undone.',
    initial: false,
  });

  if (confirmResponse.confirm) {
    await configManager.reset();
    console.log(chalk.green('\n✅ Configuration reset successfully!'));
  } else {
    console.log(chalk.yellow('\n❌ Reset cancelled.'));
  }
  
  await runInteractiveConfig();
}

async function configureVectorIndexing(configManager: ConfigManager): Promise<void> {
  const currentConfig = await configManager.getConfig();
  const vectorConfig = currentConfig.vectorConfig || VectorConfigSchema.parse({});

  console.log(chalk.blue('\n🔍 Configure Vector Indexing'));
  console.log(chalk.gray('Press Enter to keep the current value.\n'));

  const response = await prompts([
    {
      type: 'select',
      name: 'defaultProvider',
      message: 'Default embedding provider:',
      choices: [
        { title: 'OpenAI', value: 'openai' },
        { title: 'Azure', value: 'azure' },
        { title: 'Google Gemini', value: 'gemini' },
      ],
      initial: vectorConfig.defaultProvider === 'azure' ? 1 : 
               vectorConfig.defaultProvider === 'gemini' ? 2 : 0,
    },
    {
      type: 'number',
      name: 'chunkSize',
      message: 'Chunk size (500-4000):',
      initial: vectorConfig.chunkSize || 1500,
      min: 500,
      max: 4000,
    },
    {
      type: 'number',
      name: 'chunkOverlap',
      message: 'Chunk overlap (0-500):',
      initial: vectorConfig.chunkOverlap || 200,
      min: 0,
      max: 500,
    },
    {
      type: 'number',
      name: 'batchSize',
      message: 'Batch size for embeddings (1-50):',
      initial: vectorConfig.batchSize || 10,
      min: 1,
      max: 50,
    },
    {
      type: 'text',
      name: 'filePatterns',
      message: 'File patterns (comma-separated):',
      initial: (vectorConfig.filePatterns || [
        '**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx',
        '**/*.md', '**/*.mdx', '**/*.txt', '**/*.json',
        '**/*.yaml', '**/*.yml'
      ]).join(', '),
    },
  ]);

  if (response.defaultProvider) {
    await configManager.setVectorConfig({
      ...vectorConfig,
      defaultProvider: response.defaultProvider,
      chunkSize: response.chunkSize,
      chunkOverlap: response.chunkOverlap,
      batchSize: response.batchSize,
      filePatterns: response.filePatterns.split(',').map((p: string) => p.trim()).filter(Boolean),
    });
    console.log(chalk.green('\n✅ Vector indexing configuration updated!'));
  }

  await runInteractiveConfig();
}

async function configureOpenAICompatible(configManager: ConfigManager): Promise<void> {
  const currentConfig = await configManager.getConfig();
  
  console.log(chalk.blue('\\n🔗 Configure OpenAI-Compatible Provider (Ollama/OpenRouter)'));
  console.log(chalk.gray('Press Enter to keep the current value, or enter a new value.\\n'));

  // Step 1: Select provider type
  const providerTypeResponse = await prompts({
    type: 'select',
    name: 'providerName',
    message: 'Select provider type:',
    choices: [
      { title: 'Ollama (Local models)', value: 'ollama' },
      { title: 'OpenRouter (Cloud proxy)', value: 'openrouter' },
    ],
    initial: currentConfig.openaiCompatible?.providerName === 'openrouter' ? 1 : 0,
  });

  if (!providerTypeResponse.providerName) return;

  const providerType = providerTypeResponse.providerName as 'ollama' | 'openrouter';
  let baseURL = '';
  let requiresApiKey = false;
  
  if (providerType === 'ollama') {
    baseURL = 'http://localhost:11434/v1';
    requiresApiKey = false;
  } else if (providerType === 'openrouter') {
    baseURL = 'https://openrouter.ai/api/v1';
    requiresApiKey = true;
  }

  // Step 2: Configure base URL and API key
  const credentialsResponse = await prompts([
    {
      type: 'text',
      name: 'baseURL',
      message: 'Base URL:',
      initial: currentConfig.openaiCompatible?.baseURL || baseURL,
    },
    {
      type: 'text',
      name: 'apiKey',
      message: requiresApiKey ? 'API Key (required for OpenRouter):' : 'API Key (optional for Ollama, can use "fake-key"):',
      initial: currentConfig.openaiCompatible?.apiKey ? '(current value hidden)' : (requiresApiKey ? '' : 'fake-key'),
    },
  ]);

  if (!credentialsResponse.baseURL) return;

  // Step 3: Model selection - Show models by category
  console.log(chalk.blue('\\n📋 Select Preferred Model'));
  console.log(chalk.gray('Choose your preferred model or select "Other" to enter a custom model name.\\n'));
  
  const modelCategories = OpenAICompatibleProvider.getPopularModelsByCategory(providerType);
  const modelChoices: Array<{title: string, value: string, description?: string}> = [];
  
  // Add categorized models
  Object.entries(modelCategories).forEach(([category, models]) => {
    modelChoices.push({ title: chalk.bold.underline(`--- ${category} ---`), value: '', description: '' });
    models.forEach(model => {
      modelChoices.push({ title: `  ${model}`, value: model });
    });
  });
  
  // Add "Other" option
  modelChoices.push({ title: chalk.italic('Other (enter custom model name)'), value: 'custom' });

  const modelResponse = await prompts({
    type: 'select',
    name: 'preferredModel',
    message: 'Select your preferred model:',
    choices: modelChoices.filter(choice => choice.value !== ''), // Remove category headers from choices
    initial: 0,
  });

  let selectedModel = '';
  if (modelResponse.preferredModel === 'custom') {
    const customModelResponse = await prompts({
      type: 'text',
      name: 'customModel',
      message: 'Enter custom model name:',
      initial: currentConfig.openaiCompatible?.preferredModel || '',
    });
    selectedModel = customModelResponse.customModel;
  } else {
    selectedModel = modelResponse.preferredModel;
  }

  // Step 4: Save configuration
  await configManager.updateConfig({
    ...currentConfig,
    openaiCompatible: {
      baseURL: credentialsResponse.baseURL,
      providerName: providerType,
      apiKey: credentialsResponse.apiKey && credentialsResponse.apiKey !== '(current value hidden)' 
        ? (credentialsResponse.apiKey.toLowerCase() === 'clear' ? undefined : credentialsResponse.apiKey)
        : currentConfig.openaiCompatible?.apiKey,
      models: currentConfig.openaiCompatible?.models,
      preferredModel: selectedModel,
    }
  });
  
  console.log(chalk.green(`\\n✅ OpenAI-Compatible (${providerType}) configuration saved!`));
  if (selectedModel) {
    console.log(chalk.green(`   Preferred model: ${selectedModel}`));
  }
}

async function configureOpenAI(configManager: ConfigManager): Promise<void> {
  const currentConfig = await configManager.getConfig();
  
  console.log(chalk.blue('\\n🤖 Configure OpenAI'));
  console.log(chalk.gray('Press Enter to keep the current value, or enter a new value.\\n'));

  const response = await prompts([
    {
      type: 'text',
      name: 'apiKey',
      message: 'OpenAI API Key:',
      initial: currentConfig.openai?.apiKey ? '(current value hidden)' : '',
    },
    {
      type: 'text',
      name: 'baseURL',
      message: 'OpenAI Base URL (optional, leave empty for default):',
      initial: currentConfig.openai?.baseURL || '',
    },
    {
      type: 'text',
      name: 'preferredModel',
      message: 'Preferred model (default: gpt-5):',
      initial: currentConfig.openai?.preferredModel || 'gpt-5',
    },
  ]);

  if (response.apiKey && response.apiKey !== '(current value hidden)') {
    if (response.apiKey.toLowerCase() === 'clear') {
      await configManager.setApiKey('openai', undefined);
      console.log(chalk.yellow('OpenAI API Key cleared'));
    } else {
      await configManager.setApiKey('openai', response.apiKey);
      console.log(chalk.green('OpenAI API Key updated'));
    }
  }

  if (response.baseURL !== undefined && response.baseURL !== currentConfig.openai?.baseURL) {
    await configManager.setBaseURL('openai', response.baseURL || undefined);
    console.log(chalk.green('OpenAI Base URL updated'));
  }

  // Save preferred model
  if (response.preferredModel !== undefined && response.preferredModel !== currentConfig.openai?.preferredModel) {
    await configManager.updateConfig({
      ...currentConfig,
      openai: {
        apiKey: currentConfig.openai?.apiKey,
        baseURL: currentConfig.openai?.baseURL,
        preferredModel: response.preferredModel || 'gpt-5',
      }
    });
    console.log(chalk.green('OpenAI preferred model updated'));
  }
  
  console.log(chalk.green('\\n✅ OpenAI configuration saved!'));
}

async function configureGoogle(configManager: ConfigManager): Promise<void> {
  const currentConfig = await configManager.getConfig();
  
  console.log(chalk.blue('\\n🔍 Configure Google Gemini'));
  console.log(chalk.gray('Press Enter to keep the current value, or enter a new value.\\n'));

  const response = await prompts([
    {
      type: 'text',
      name: 'apiKey',
      message: 'Google Gemini API Key:',
      initial: currentConfig.google?.apiKey ? '(current value hidden)' : '',
    },
    {
      type: 'text',
      name: 'baseURL',
      message: 'Google Base URL (optional, leave empty for default):',
      initial: currentConfig.google?.baseURL || '',
    },
  ]);

  if (response.apiKey && response.apiKey !== '(current value hidden)') {
    if (response.apiKey.toLowerCase() === 'clear') {
      await configManager.setApiKey('google', undefined);
      console.log(chalk.yellow('Google API Key cleared'));
    } else {
      await configManager.setApiKey('google', response.apiKey);
      console.log(chalk.green('Google API Key updated'));
    }
  }

  if (response.baseURL !== undefined && response.baseURL !== currentConfig.google?.baseURL) {
    await configManager.setBaseURL('google', response.baseURL || undefined);
    console.log(chalk.green('Google Base URL updated'));
  }
  
  console.log(chalk.green('\\n✅ Google Gemini configuration saved!'));
}

async function configureAzure(configManager: ConfigManager): Promise<void> {
  const currentConfig = await configManager.getConfig();
  
  console.log(chalk.blue('\\n☁️ Configure Azure OpenAI'));
  console.log(chalk.gray('Press Enter to keep the current value, or enter a new value.\\n'));

  const response = await prompts([
    {
      type: 'text',
      name: 'apiKey',
      message: 'Azure API Key:',
      initial: currentConfig.azure?.apiKey ? '(current value hidden)' : '',
    },
    {
      type: 'text',
      name: 'baseURL',
      message: 'Azure Base URL (optional):',
      initial: currentConfig.azure?.baseURL || '',
    },
    {
      type: 'text',
      name: 'resourceName',
      message: 'Azure Resource Name (optional):',
      initial: currentConfig.azure?.resourceName || '',
    },
    {
      type: 'text',
      name: 'preferredModel',
      message: 'Preferred model (default: gpt-5):',
      initial: currentConfig.azure?.preferredModel || 'gpt-5',
    },
  ]);

  if (response.apiKey && response.apiKey !== '(current value hidden)') {
    if (response.apiKey.toLowerCase() === 'clear') {
      await configManager.setApiKey('azure', undefined);
      console.log(chalk.yellow('Azure API Key cleared'));
    } else {
      await configManager.setApiKey('azure', response.apiKey);
      console.log(chalk.green('Azure API Key updated'));
    }
  }

  if (response.baseURL !== undefined && response.baseURL !== currentConfig.azure?.baseURL) {
    await configManager.setBaseURL('azure', response.baseURL || undefined);
    console.log(chalk.green('Azure Base URL updated'));
  }
  
  if (response.resourceName !== undefined && response.resourceName !== currentConfig.azure?.resourceName) {
    await configManager.setAzureResourceName(response.resourceName || undefined);
    console.log(chalk.green('Azure Resource Name updated'));
  }
  
  // Save preferred model
  if (response.preferredModel !== undefined && response.preferredModel !== currentConfig.azure?.preferredModel) {
    await configManager.updateConfig({
      ...currentConfig,
      azure: {
        apiKey: currentConfig.azure?.apiKey,
        baseURL: currentConfig.azure?.baseURL,
        resourceName: currentConfig.azure?.resourceName,
        preferredModel: response.preferredModel || 'gpt-5',
      }
    });
    console.log(chalk.green('Azure preferred model updated'));
  }
  
  console.log(chalk.green('\\n✅ Azure OpenAI configuration saved!'));
}

async function configureXai(configManager: ConfigManager): Promise<void> {
  const currentConfig = await configManager.getConfig();
  
  console.log(chalk.blue('\\n🚀 Configure xAI Grok'));
  console.log(chalk.gray('Press Enter to keep the current value, or enter a new value.\\n'));

  const response = await prompts([
    {
      type: 'text',
      name: 'apiKey',
      message: 'xAI Grok API Key:',
      initial: currentConfig.xai?.apiKey ? '(current value hidden)' : '',
    },
    {
      type: 'text',
      name: 'baseURL',
      message: 'xAI Base URL (optional, leave empty for default):',
      initial: currentConfig.xai?.baseURL || '',
    },
  ]);

  if (response.apiKey && response.apiKey !== '(current value hidden)') {
    if (response.apiKey.toLowerCase() === 'clear') {
      await configManager.setApiKey('xai', undefined);
      console.log(chalk.yellow('xAI API Key cleared'));
    } else {
      await configManager.setApiKey('xai', response.apiKey);
      console.log(chalk.green('xAI API Key updated'));
    }
  }

  if (response.baseURL !== undefined && response.baseURL !== currentConfig.xai?.baseURL) {
    await configManager.setBaseURL('xai', response.baseURL || undefined);
    console.log(chalk.green('xAI Base URL updated'));
  }
  
  console.log(chalk.green('\\n✅ xAI Grok configuration saved!'));
}

function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return '****';
  }
  return apiKey.substring(0, 4) + '****' + apiKey.substring(apiKey.length - 4);
}
