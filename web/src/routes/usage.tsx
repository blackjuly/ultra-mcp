import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Hash, 
  AlertCircle, 
  CheckCircle,
  ChevronRight,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  X
} from 'lucide-react';

export const Route = createFileRoute('/usage')({
  component: Usage,
});

function Usage() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'error'>('all');
  const [page, setPage] = useState(0);
  const limit = 20;

  // Fetch chat list
  const { data: chatList, isLoading, refetch } = trpc.chats.list.useQuery({
    searchQuery: searchQuery || undefined,
    provider: filterProvider || undefined,
    status: filterStatus,
    limit,
    offset: page * limit,
    sortBy: 'timestamp',
    sortOrder: 'desc',
  });

  // Fetch chat detail when selected
  const { data: chatDetail } = trpc.chats.detail.useQuery(
    { id: selectedChat! },
    { enabled: !!selectedChat }
  );

  // Delete mutation
  const deleteMutation = trpc.chats.delete.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedChat(null);
    },
  });

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCost = (cost: number | null) => {
    if (!cost) return '$0.00';
    return `$${cost.toFixed(4)}`;
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '0ms';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      openai: 'bg-green-500',
      gemini: 'bg-blue-500',
      azure: 'bg-purple-500',
      grok: 'bg-orange-500',
      'openai-compatible': 'bg-gray-500',
    };
    return colors[provider] || 'bg-gray-400';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Chat History</h2>
        <p className="text-muted-foreground">
          Detailed history of all AI interactions
        </p>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search prompts, responses, models..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <select
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
            >
              <option value="">All Providers</option>
              <option value="openai">OpenAI</option>
              <option value="gemini">Gemini</option>
              <option value="azure">Azure</option>
              <option value="grok">Grok</option>
              <option value="openai-compatible">OpenAI Compatible</option>
            </select>

            <select
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>

            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Chat List */}
      <Card>
        <CardHeader>
          <CardTitle>Chat Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading chat history...
            </div>
          ) : chatList?.data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No chats found
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {chatList?.data.map((chat) => (
                  <div
                    key={chat.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedChat(chat.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`${getProviderColor(chat.provider)} text-white text-xs px-2 py-1 rounded`}>
                            {chat.provider}
                          </span>
                          <span className="text-sm font-medium">{chat.model}</span>
                          {chat.toolName && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {chat.toolName}
                            </span>
                          )}
                          {chat.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {chat.preview}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(chat.timestamp)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {chat.totalTokens || 0} tokens
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatCost(chat.estimatedCost)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(chat.durationMs)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedChat(chat.id);
                          }}
                          className="p-2 hover:bg-gray-100 rounded"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this chat?')) {
                              deleteMutation.mutate({ id: chat.id });
                            }
                          }}
                          className="p-2 hover:bg-red-50 text-red-500 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {chatList?.pagination && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {page * limit + 1} to {Math.min((page + 1) * limit, chatList.pagination.total)} of {chatList.pagination.total} chats
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={!chatList.pagination.hasMore}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Chat Detail Modal */}
      {selectedChat && chatDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold">Chat Details</h3>
              <button
                onClick={() => setSelectedChat(null)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <div className="text-sm text-muted-foreground">Provider</div>
                  <div className="font-medium">{chatDetail.provider}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Model</div>
                  <div className="font-medium">{chatDetail.model}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Tool</div>
                  <div className="font-medium">{chatDetail.toolName || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="font-medium">
                    {chatDetail.status === 'success' ? (
                      <span className="text-green-600">Success</span>
                    ) : (
                      <span className="text-red-600">Error</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Timestamp</div>
                  <div className="font-medium">{new Date(chatDetail.timestamp).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Duration</div>
                  <div className="font-medium">{formatDuration(chatDetail.durationMs)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Tokens</div>
                  <div className="font-medium">
                    {chatDetail.totalTokens || 0}
                    {chatDetail.inputTokens && chatDetail.outputTokens && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({chatDetail.inputTokens} in / {chatDetail.outputTokens} out)
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Cost</div>
                  <div className="font-medium">{formatCost(chatDetail.estimatedCost)}</div>
                </div>
              </div>

              {/* Error Message */}
              {chatDetail.errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="font-medium text-red-800 mb-1">Error</div>
                  <div className="text-sm text-red-700">{chatDetail.errorMessage}</div>
                </div>
              )}

              {/* Request Data */}
              {chatDetail.requestData && (
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Request</h4>
                  <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm whitespace-pre-wrap">
                      {typeof chatDetail.requestData === 'string' 
                        ? chatDetail.requestData 
                        : JSON.stringify(chatDetail.requestData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Response Data */}
              {chatDetail.responseData && (
                <div>
                  <h4 className="font-medium mb-2">Response</h4>
                  <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm whitespace-pre-wrap">
                      {typeof chatDetail.responseData === 'string' 
                        ? chatDetail.responseData 
                        : JSON.stringify(chatDetail.responseData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}