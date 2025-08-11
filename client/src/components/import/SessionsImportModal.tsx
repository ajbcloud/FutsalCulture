import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUp, Download, AlertCircle, CheckCircle, Info, ExternalLink } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { HowToGuide } from './HowToGuide';

interface ImportError {
  row: number;
  column: string;
  value: string;
  code: string;
  message: string;
  hint?: string;
}

interface ImportWarning {
  row: number;
  column: string;
  message: string;
}

interface ImportResult {
  summary: {
    rows: number;
    errors: number;
    warnings: number;
    imported?: number;
    newLocations?: number;
    recurring?: number;
  };
  errors: ImportError[];
  warnings: ImportWarning[];
  validRows?: any[];
  preview?: boolean;
  message?: string;
}

interface SessionsImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export function SessionsImportModal({ isOpen, onClose, onImportComplete }: SessionsImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string>('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvData(content);
      };
      reader.readAsText(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const validateAndPreview = async () => {
    if (!csvData) {
      toast({
        title: "No data",
        description: "Please upload a CSV file first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiRequest('POST', '/api/admin/imports/sessions', {
        csvData,
        dryRun: true
      });

      if (response.ok) {
        const result = await response.json();
        setImportResult(result);
        setStep('preview');
      } else {
        const errorResult = await response.json();
        setImportResult(errorResult);
        showErrorToast(errorResult);
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: "Preview failed",
        description: "Failed to validate CSV data",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const performImport = async () => {
    if (!csvData) return;

    setStep('importing');
    setIsProcessing(true);

    try {
      const response = await apiRequest('POST', '/api/admin/imports/sessions', {
        csvData,
        dryRun: false
      });

      if (response.ok) {
        const result = await response.json();
        setImportResult(result);
        setStep('complete');
        onImportComplete();
        toast({
          title: "Import successful",
          description: result.message || `Imported ${result.summary?.imported || 0} sessions`,
        });
      } else {
        const errorResult = await response.json();
        setImportResult(errorResult);
        showErrorToast(errorResult);
        setStep('preview');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: "Failed to import sessions",
        variant: "destructive",
      });
      setStep('preview');
    } finally {
      setIsProcessing(false);
    }
  };

  const showErrorToast = (errorResult: ImportResult) => {
    const { summary, errors } = errorResult;
    
    // Create 20-second sticky toast with detailed errors
    toast({
      title: "Import failed",
      description: (
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            {summary.errors} errors{summary.warnings ? `, ${summary.warnings} warnings` : ''}
          </div>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {errors.slice(0, 3).map((error, idx) => (
              <li key={idx}>
                Row {error.row} • <span className="font-mono text-xs">{error.column}</span> — {error.message}
              </li>
            ))}
            {errors.length > 3 && (
              <li className="text-muted-foreground">...and {errors.length - 3} more errors</li>
            )}
          </ul>
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="outline" onClick={() => downloadErrors(errors)}>
              Download errors CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowGuide(true)}>
              How to format CSV
            </Button>
          </div>
        </div>
      ),
      variant: "destructive",
      duration: 20000, // 20 seconds
    });

    // Store errors for later access
    sessionStorage.setItem('sessionsImport:lastErrors', JSON.stringify(errorResult));
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/downloads/sessions-template');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sessions_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download template:', error);
      toast({
        title: "Download failed",
        description: "Failed to download template",
        variant: "destructive",
      });
    }
  };

  const downloadSample = async () => {
    try {
      const response = await fetch('/api/admin/downloads/sessions-sample');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sessions_sample.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download sample:', error);
      toast({
        title: "Download failed",
        description: "Failed to download sample",
        variant: "destructive",
      });
    }
  };

  const downloadErrors = async (errors: ImportError[]) => {
    try {
      const response = await apiRequest('POST', '/api/admin/imports/sessions/errors', { errors });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sessions_import_errors.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download errors:', error);
      toast({
        title: "Download failed",
        description: "Failed to download errors CSV",
        variant: "destructive",
      });
    }
  };

  const reset = () => {
    setStep('upload');
    setCsvFile(null);
    setCsvData('');
    setImportResult(null);
    setIsProcessing(false);
  };

  const getStepProgress = () => {
    switch (step) {
      case 'upload': return 25;
      case 'preview': return 50;
      case 'importing': return 75;
      case 'complete': return 100;
      default: return 0;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Sessions from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {step === 'upload' ? 1 : step === 'preview' ? 2 : step === 'importing' ? 3 : 4} of 4</span>
              <span>{getStepProgress()}%</span>
            </div>
            <Progress value={getStepProgress()} className="w-full" />
          </div>

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
                <Button onClick={downloadSample} variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download Sample
                </Button>
                <Button onClick={() => setShowGuide(true)} variant="outline" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  How to format CSV
                </Button>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                      <FileUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium">Upload CSV File</h3>
                        <p className="text-muted-foreground">Select a CSV file to import sessions</p>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="csv-upload"
                          data-testid="input-csv-file"
                        />
                        <label htmlFor="csv-upload">
                          <Button variant="outline" asChild>
                            <span>Choose File</span>
                          </Button>
                        </label>
                      </div>
                    </div>
                    
                    {csvFile && (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          File loaded: {csvFile.name} ({Math.round(csvFile.size / 1024)}KB)
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button 
                  onClick={validateAndPreview} 
                  disabled={!csvFile || isProcessing}
                  data-testid="button-preview-csv"
                >
                  {isProcessing ? 'Validating...' : 'Preview Import'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && importResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant={importResult.errors.length > 0 ? 'destructive' : 'secondary'}>
                  {importResult.summary.rows} rows
                </Badge>
                {importResult.errors.length > 0 && (
                  <Badge variant="destructive">
                    {importResult.errors.length} errors
                  </Badge>
                )}
                {importResult.warnings.length > 0 && (
                  <Badge variant="outline">
                    {importResult.warnings.length} warnings
                  </Badge>
                )}
                {importResult.errors.length === 0 && (
                  <Badge variant="default">
                    Ready to import
                  </Badge>
                )}
              </div>

              {importResult.errors.length > 0 && (
                <Card className="border-red-200 dark:border-red-800">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div className="space-y-3 flex-1">
                        <h4 className="font-medium text-red-900 dark:text-red-100">
                          Import blocked due to errors
                        </h4>
                        <div className="space-y-2">
                          {importResult.errors.slice(0, 5).map((error, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-mono bg-red-100 dark:bg-red-900/20 px-1 rounded">
                                Row {error.row}, {error.column}
                              </span>
                              : {error.message}
                              {error.hint && (
                                <div className="text-muted-foreground mt-1">
                                  💡 {error.hint}
                                </div>
                              )}
                            </div>
                          ))}
                          {importResult.errors.length > 5 && (
                            <div className="text-sm text-muted-foreground">
                              ...and {importResult.errors.length - 5} more errors
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => downloadErrors(importResult.errors)}>
                            Download errors CSV
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setShowGuide(true)}>
                            How to format CSV
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {importResult.warnings.length > 0 && (
                <Card className="border-yellow-200 dark:border-yellow-800">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div className="space-y-2">
                        <h4 className="font-medium">Warnings (import will proceed)</h4>
                        {importResult.warnings.slice(0, 3).map((warning, idx) => (
                          <div key={idx} className="text-sm text-muted-foreground">
                            Row {warning.row}: {warning.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={reset}>
                  Start Over
                </Button>
                <Button 
                  onClick={performImport} 
                  disabled={importResult.errors.length > 0}
                  data-testid="button-confirm-import"
                >
                  Import {importResult.validRows?.length || 0} Sessions
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Importing */}
          {step === 'importing' && (
            <div className="text-center space-y-4">
              <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <div>
                <h3 className="text-lg font-medium">Importing sessions...</h3>
                <p className="text-muted-foreground">Please wait while we create your sessions</p>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && importResult && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-medium">Import Complete!</h3>
                <p className="text-muted-foreground">
                  {importResult.message || `Successfully imported ${importResult.summary.imported} sessions`}
                </p>
                {importResult.summary.newLocations && importResult.summary.newLocations > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Added {importResult.summary.newLocations} new location(s)
                  </p>
                )}
              </div>
              <Button onClick={onClose} data-testid="button-close-import">
                Close
              </Button>
            </div>
          )}
        </div>

        {/* How To Guide */}
        <HowToGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />
      </DialogContent>
    </Dialog>
  );
}