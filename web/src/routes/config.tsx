import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { CheckCircle, XCircle } from 'lucide-react';

export const Route = createFileRoute('/config')({
  component: Configuration,
});

function Configuration() {
  const { data: config } = trpc.config.get.useQuery();

  const providers = [
    {
      name: 'OpenAI',
      key: 'openai' as const,
      configured: config?.openai?.configured,
      apiKey: config?.openai?.apiKey,
      baseURL: config?.openai?.baseURL,
    },
    {
      name: 'Google Gemini',
      key: 'google' as const,
      configured: config?.google?.configured,
      apiKey: config?.google?.apiKey,
      baseURL: config?.google?.baseURL,
    },
    {
      name: 'Azure OpenAI',
      key: 'azure' as const,
      configured: config?.azure?.configured,
      apiKey: config?.azure?.apiKey,
      baseURL: config?.azure?.baseURL,
    },
    {
      name: 'xAI Grok',
      key: 'xai' as const,
      configured: config?.xai?.configured,
      apiKey: config?.xai?.apiKey,
      baseURL: config?.xai?.baseURL,
    },
    {
      name: 'Alibaba Bailian',
      key: 'bailian' as const,
      configured: config?.bailian?.configured,
      apiKey: config?.bailian?.apiKey,
      baseURL: config?.bailian?.baseURL,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Configuration</h2>
        <p className="text-muted-foreground">
          Manage your API keys and provider settings
        </p>
      </div>

      <div className="grid gap-4">
        {providers.map((provider) => (
          <Card key={provider.key}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{provider.name}</CardTitle>
                {provider.configured ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <CardDescription>
                {provider.configured ? 'Configured' : 'Not configured'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {provider.apiKey && (
                  <div>
                    <span className="text-sm text-muted-foreground">API Key: </span>
                    <code className="text-sm bg-muted px-1 py-0.5 rounded">
                      {provider.apiKey}
                    </code>
                  </div>
                )}
                {provider.baseURL && (
                  <div>
                    <span className="text-sm text-muted-foreground">Base URL: </span>
                    <code className="text-sm bg-muted px-1 py-0.5 rounded">
                      {provider.baseURL}
                    </code>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vector Indexing Configuration */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Vector Indexing Configuration</h3>
        <Card>
          <CardHeader>
            <CardTitle>Semantic Code Search</CardTitle>
            <CardDescription>
              Configuration for vector-based semantic code search and indexing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Default Provider: </span>
                  <code className="text-sm bg-muted px-1 py-0.5 rounded">
                    {config?.vectorConfig?.defaultProvider || 'openai'}
                  </code>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Chunk Size: </span>
                  <code className="text-sm bg-muted px-1 py-0.5 rounded">
                    {config?.vectorConfig?.chunkSize || 1500} tokens
                  </code>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Chunk Overlap: </span>
                  <code className="text-sm bg-muted px-1 py-0.5 rounded">
                    {config?.vectorConfig?.chunkOverlap || 200} tokens
                  </code>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Batch Size: </span>
                  <code className="text-sm bg-muted px-1 py-0.5 rounded">
                    {config?.vectorConfig?.batchSize || 10} files
                  </code>
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">File Patterns: </span>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(config?.vectorConfig?.filePatterns || [
                    '**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx',
                    '**/*.md', '**/*.mdx', '**/*.txt', '**/*.json',
                    '**/*.yaml', '**/*.yml'
                  ]).map((pattern: string, index: number) => (
                    <code key={index} className="text-xs bg-muted px-1 py-0.5 rounded">
                      {pattern}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          To update your API keys and vector settings, run <code className="bg-background px-1 py-0.5 rounded">npx ultra-mcp config</code> in your terminal.
        </p>
      </div>
    </div>
  );
}