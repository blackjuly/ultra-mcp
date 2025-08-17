import { z } from 'zod';
import { logger } from '../utils/logger';
import { ConfigManager } from '../config/manager';
import { VectorConfigSchema } from '../config/schema';
import { getDefaultEmbeddingProvider, EmbeddingProvider } from '../providers/embeddings';
import { indexProject } from '../vector/indexer';
import { searchVectors, getRelatedFiles } from '../vector/search';
import { getVectorCount, clearVectorDB } from '../vector/db';

// Input schema for index-vectors tool
export const IndexVectorsSchema = z.object({
  path: z.string().default(process.cwd()),
  provider: z.enum(['openai', 'azure', 'gemini', 'qwen3-coder', 'deepseek-r1']).optional(),
  force: z.boolean().default(false),
});

// Input schema for search-vectors tool
export const SearchVectorsSchema = z.object({
  query: z.string(),
  path: z.string().default(process.cwd()),
  provider: z.enum(['openai', 'azure', 'gemini', 'qwen3-coder', 'deepseek-r1']).optional(),
  limit: z.number().min(1).max(50).default(10),
  similarityThreshold: z.number().min(0).max(1).default(0.7),
  filesOnly: z.boolean().default(false),
});

// Input schema for clear-vectors tool
export const ClearVectorsSchema = z.object({
  path: z.string().default(process.cwd()),
});

export type IndexVectorsInput = z.infer<typeof IndexVectorsSchema>;
export type SearchVectorsInput = z.infer<typeof SearchVectorsSchema>;
export type ClearVectorsInput = z.infer<typeof ClearVectorsSchema>;

export async function handleIndexVectors(args: IndexVectorsInput): Promise<string> {
  const configManager = new ConfigManager();
  const config = await configManager.getConfig();

  logger.log('Starting vector indexing...');

  try {
    // Get embedding provider
    let provider: EmbeddingProvider;
    if (args.provider) {
      provider = new EmbeddingProvider({ provider: args.provider }, configManager);
    } else {
      provider = await getDefaultEmbeddingProvider(configManager);
    }

    // Get current vector count
    const currentCount = await getVectorCount(args.path);
    if (currentCount > 0 && !args.force) {
      return `Found ${currentCount} existing vectors. Use force=true to re-index.`;
    }

    // Index the project
    const messages: string[] = [];
    const result = await indexProject({
      projectPath: args.path,
      provider,
      config: config.vectorConfig || VectorConfigSchema.parse({}),
      force: args.force,
      onProgress: (message) => {
        messages.push(message);
        logger.log(message);
      },
    });

    const totalCount = await getVectorCount(args.path);
    
    return `Indexing complete!
Files indexed: ${result.filesIndexed}
Chunks created: ${result.chunksCreated}
Time: ${(result.timeMs / 1000).toFixed(1)}s
Total vectors: ${totalCount}

Progress:
${messages.join('\n')}`;
  } catch (error) {
    logger.error('Vector indexing failed:', error);
    throw new Error(`Indexing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function handleSearchVectors(args: SearchVectorsInput): Promise<string> {
  const configManager = new ConfigManager();

  logger.log('Searching vectors...');

  try {
    // Check if project is indexed
    const vectorCount = await getVectorCount(args.path);
    if (vectorCount === 0) {
      return 'No vectors found. Please run index-vectors first.';
    }

    // Get embedding provider
    let provider: EmbeddingProvider;
    if (args.provider) {
      provider = new EmbeddingProvider({ provider: args.provider }, configManager);
    } else {
      provider = await getDefaultEmbeddingProvider(configManager);
    }

    if (args.filesOnly) {
      // Get related files only
      const files = await getRelatedFiles({
        projectPath: args.path,
        query: args.query,
        provider,
        limit: args.limit,
        similarityThreshold: args.similarityThreshold,
      });

      if (files.length === 0) {
        return 'No matching files found.';
      }

      return `Found ${files.length} related files:\n\n${files.map(f => `- ${f}`).join('\n')}`;
    } else {
      // Get full search results with chunks
      const results = await searchVectors({
        projectPath: args.path,
        query: args.query,
        provider,
        limit: args.limit,
        similarityThreshold: args.similarityThreshold,
      });

      if (results.length === 0) {
        return 'No matching results found.';
      }

      const formatted = results.map((result, index) => {
        const preview = result.chunk.slice(0, 200).replace(/\n/g, ' ');
        return `${index + 1}. ${result.relpath}
   Similarity: ${(result.similarity * 100).toFixed(1)}%
   Chunk ID: ${result.chunkId}
   Preview: ${preview}${result.chunk.length > 200 ? '...' : ''}`;
      }).join('\n\n');

      return `Found ${results.length} matches:\n\n${formatted}`;
    }
  } catch (error) {
    logger.error('Vector search failed:', error);
    throw new Error(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function handleClearVectors(args: ClearVectorsInput): Promise<string> {
  logger.log('Clearing vector database...');

  try {
    const countBefore = await getVectorCount(args.path);
    await clearVectorDB(args.path);
    
    return `Vector database cleared. Removed ${countBefore} vectors.`;
  } catch (error) {
    logger.error('Failed to clear vectors:', error);
    throw new Error(`Clear failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}