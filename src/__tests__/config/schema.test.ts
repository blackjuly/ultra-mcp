import { describe, it, expect } from 'vitest';
import { ConfigSchema, defaultConfig } from '../../config/schema';

describe('ConfigSchema', () => {
  it('should validate a valid configuration', () => {
    const validConfig = {
      openai: {
        apiKey: 'sk-test123',
      },
      google: {
        apiKey: 'test-google-key',
      },
      azure: {
        apiKey: 'test-azure-key',
        resourceName: 'test-resource',
      },
      xai: {
        apiKey: 'xai-test-key',
      },
    };

    const result = ConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validConfig);
    }
  });

  it('should validate a partial configuration', () => {
    const partialConfig = {
      openai: {
        apiKey: 'sk-test123',
      },
    };

    const result = ConfigSchema.safeParse(partialConfig);
    expect(result.success).toBe(true);
  });

  it('should validate an empty configuration', () => {
    const emptyConfig = {};
    const result = ConfigSchema.safeParse(emptyConfig);
    expect(result.success).toBe(true);
  });

  it('should accept undefined API keys', () => {
    const configWithUndefined = {
      openai: {
        apiKey: undefined,
      },
      google: {
        apiKey: undefined,
      },
    };

    const result = ConfigSchema.safeParse(configWithUndefined);
    expect(result.success).toBe(true);
  });

  it('should accept valid Azure resourceName', () => {
    const validConfig = {
      azure: {
        apiKey: 'test-key',
        resourceName: 'my-resource',
      },
    };

    const result = ConfigSchema.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  it('should have correct default configuration', () => {
    expect(defaultConfig).toEqual({
      openai: {
        apiKey: undefined,
        baseURL: undefined,
        preferredModel: 'gpt-5',
      },
      google: {
        apiKey: undefined,
        baseURL: undefined,
      },
      azure: {
        apiKey: undefined,
        resourceName: undefined,
        baseURL: undefined,
        preferredModel: 'gpt-5',
      },
      xai: {
        apiKey: undefined,
        baseURL: undefined,
      },
      openaiCompatible: {
        apiKey: undefined,
        baseURL: 'http://localhost:11434/v1',
        providerName: 'ollama',
        models: undefined,
        preferredModel: undefined,
      },
      vectorConfig: {
        defaultProvider: 'openai',
        chunkSize: 1500,
        chunkOverlap: 200,
        batchSize: 10,
        filePatterns: [
          '**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx',
          '**/*.md', '**/*.mdx', '**/*.txt', '**/*.json',
          '**/*.yaml', '**/*.yml'
        ],
      },
    });
  });

  it('should accept empty string as API key', () => {
    const configWithEmptyString = {
      openai: {
        apiKey: '',
      },
    };

    const result = ConfigSchema.safeParse(configWithEmptyString);
    expect(result.success).toBe(false); // min(1) validation should fail
  });
});
