import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Send, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AskAnalyticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    from?: string;
    to?: string;
    tenantId?: string;
    status?: string;
  };
}

interface AskResponse {
  answer_md: string;
  sources: Array<{ type: string; ref: string }>;
  table?: {
    columns: string[];
    rows: string[][];
  };
}

export function AskAnalyticsDrawer({ isOpen, onClose, filters }: AskAnalyticsDrawerProps) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<AskResponse | null>(null);

  const askMutation = useMutation({
    mutationFn: async (q: string) => {
      const res = await fetch('/api/super-admin/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          filters,
        }),
      });
      if (!res.ok) throw new Error('Failed to get answer');
      return res.json();
    },
    onSuccess: (data) => {
      setResponse(data);
      setQuestion('');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to process your question. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      askMutation.mutate(question);
    }
  };

  const quickQuestions = [
    "Why did revenue change this week?",
    "Which tenants drive growth?",
    "What's the 30-day forecast?",
    "Show me churn risks",
  ];

  // Parse markdown text with bold support
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Handle headers
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h4 key={i} className="font-semibold mt-3 mb-1">{line.slice(2, -2)}</h4>;
      }
      
      // Handle list items
      if (line.match(/^\d+\.\s/)) {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <li key={i} className="ml-4 mb-1">
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j}>{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </li>
        );
      }
      
      // Handle regular text with bold
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className="mb-2">
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Ask Analytics
          </SheetTitle>
          <SheetDescription>
            Ask questions about your data in plain language
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Quick Questions */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((q, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => setQuestion(q)}
                >
                  {q}
                </Badge>
              ))}
            </div>
          </div>

          {/* Question Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Ask about revenue changes, tenant performance, forecasts..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              className="resize-none bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
            <Button
              type="submit"
              disabled={!question.trim() || askMutation.isPending}
              className="w-full gap-2"
            >
              <Send className="h-4 w-4" />
              {askMutation.isPending ? 'Analyzing...' : 'Ask'}
            </Button>
          </form>

          {/* Loading State */}
          {askMutation.isPending && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {/* Response */}
          {response && !askMutation.isPending && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {renderMarkdown(response.answer_md)}
                </div>
              </div>

              {/* Data Table */}
              {response.table && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {response.table.columns.map((col, i) => (
                          <TableHead key={i}>{col}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {response.table.rows.map((row, i) => (
                        <TableRow key={i}>
                          {row.map((cell, j) => (
                            <TableCell key={j}>{cell}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Sources */}
              {response.sources.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  Sources: {response.sources.map(s => s.ref).join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}