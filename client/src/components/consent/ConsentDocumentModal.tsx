import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  FileText, 
  PenTool, 
  Download, 
  Shield, 
  Clock, 
  User, 
  CheckCircle, 
  AlertTriangle,
  Loader2 
} from 'lucide-react';

interface ConsentTemplate {
  id: string;
  templateType: string;
  title: string;
  content: string;
  version: number;
  isRequired: boolean;
}

interface ConsentDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (signedDocuments: any[]) => void;
  playerData: {
    id?: string;
    firstName: string;
    lastName: string;
    birthDate: string;
  };
  parentData?: {
    id?: string;
    firstName: string;
    lastName: string;
  };
  isParentSigning: boolean;
  skipApiSubmit?: boolean; // When true, just collect signatures and return them without API call
  templateEndpoint?: string; // Custom endpoint for fetching templates (for unauthenticated flows)
}

interface SignatureData {
  signedName: string;
  signatureMethod: 'typed' | 'drawn';
  drawnSignature?: string;
}

export default function ConsentDocumentModal({
  isOpen,
  onClose,
  onComplete,
  playerData,
  parentData,
  isParentSigning,
  skipApiSubmit = false,
  templateEndpoint
}: ConsentDocumentModalProps) {
  const [templates, setTemplates] = useState<ConsentTemplate[]>([]);
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);
  const [signatureData, setSignatureData] = useState<SignatureData>({
    signedName: '',
    signatureMethod: 'typed'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [signedDocuments, setSignedDocuments] = useState<string[]>([]);
  const [collectedSignatures, setCollectedSignatures] = useState<any[]>([]); // For skipApiSubmit mode
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const { toast } = useToast();

  // Fetch consent templates on open
  useEffect(() => {
    if (isOpen) {
      fetchConsentTemplates();
    }
  }, [isOpen]);

  // Initialize signature name
  useEffect(() => {
    if (isParentSigning && parentData) {
      setSignatureData(prev => ({
        ...prev,
        signedName: `${parentData.firstName} ${parentData.lastName}`
      }));
    } else if (playerData) {
      setSignatureData(prev => ({
        ...prev,
        signedName: `${playerData.firstName} ${playerData.lastName}`
      }));
    }
  }, [isParentSigning, parentData, playerData]);

  const fetchConsentTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use custom endpoint if provided (for unauthenticated flows like parent2 invite)
      const endpoint = templateEndpoint || '/api/admin/consent-templates';
      const response = await apiRequest('GET', endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch consent templates');
      }
      const data = await response.json();
      
      // Filter for active templates - the custom endpoint already filters, but double-check
      const activeTemplates = data.filter((template: any) => 
        template.isActive === true || template.isRequired === true
      );
      
      if (activeTemplates.length === 0) {
        // If no consent forms are configured, just complete without signatures
        onComplete([]);
        return;
      }
      
      // Map to expected interface format
      const mappedTemplates = activeTemplates.map((t: any) => ({
        id: t.id,
        templateType: t.templateType,
        title: t.title,
        content: t.content,
        version: t.version || 1,
        isRequired: t.isActive || t.isRequired || true
      }));
      
      setTemplates(mappedTemplates);
    } catch (error) {
      console.error('Error fetching consent templates:', error);
      setError('Failed to load consent documents. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    // Set drawing style
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  useEffect(() => {
    if (signatureData.signatureMethod === 'drawn') {
      setTimeout(setupCanvas, 100);
    }
  }, [signatureData.signatureMethod]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Save signature as base64
    const signatureBase64 = canvas.toDataURL();
    setSignatureData(prev => ({
      ...prev,
      drawnSignature: signatureBase64
    }));
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(prev => ({
      ...prev,
      drawnSignature: undefined
    }));
  };

  const signCurrentDocument = async () => {
    const currentTemplate = templates[currentTemplateIndex];
    if (!currentTemplate) return;

    // Validate signature
    if (!signatureData.signedName.trim()) {
      toast({
        title: 'Signature required',
        description: 'Please enter your full name to sign the document.',
        variant: 'destructive'
      });
      return;
    }

    if (signatureData.signatureMethod === 'drawn' && !signatureData.drawnSignature) {
      toast({
        title: 'Signature required',
        description: 'Please draw your signature in the box provided.',
        variant: 'destructive'
      });
      return;
    }

    setIsSigning(true);
    try {
      // Capture the exact timestamp when the user completes the signing
      const completionTimestamp = new Date().toISOString();
      
      const signaturePayload = {
        playerId: playerData.id,
        parentId: isParentSigning ? parentData?.id : undefined,
        templateType: currentTemplate.templateType,
        templateId: currentTemplate.id,
        templateTitle: currentTemplate.title,
        signatureData: {
          signedName: signatureData.signedName,
          signatureMethod: signatureData.signatureMethod,
          drawnSignature: signatureData.drawnSignature
        },
        consentGiven: true,
        signedAt: completionTimestamp
      };

      // In skipApiSubmit mode, just collect the signature without API call
      if (skipApiSubmit) {
        const newCollectedSignatures = [...collectedSignatures, signaturePayload];
        setCollectedSignatures(newCollectedSignatures);
        setSignedDocuments(prev => [...prev, currentTemplate.id]);
        
        toast({
          title: 'Document signed',
          description: `${currentTemplate.title} has been successfully signed.`
        });

        // Move to next document or complete
        if (currentTemplateIndex < templates.length - 1) {
          setCurrentTemplateIndex(prev => prev + 1);
          setSignatureData(prev => ({
            ...prev,
            drawnSignature: undefined
          }));
          if (canvasRef.current) {
            clearSignature();
          }
        } else {
          // All documents signed - return collected signatures
          onComplete(newCollectedSignatures);
        }
      } else {
        // Normal mode - submit to API
        const response = await apiRequest('POST', '/api/consent/sign', {
          ...signaturePayload,
          templateTypes: [currentTemplate.templateType]
        });

        if (!response.ok) {
          throw new Error('Failed to sign document');
        }
        const responseData = await response.json();

        setSignedDocuments(prev => [...prev, currentTemplate.id]);
        
        toast({
          title: 'Document signed',
          description: `${currentTemplate.title} has been successfully signed.`
        });

        // Move to next document or complete
        if (currentTemplateIndex < templates.length - 1) {
          setCurrentTemplateIndex(prev => prev + 1);
          setSignatureData(prev => ({
            ...prev,
            drawnSignature: undefined
          }));
          if (canvasRef.current) {
            clearSignature();
          }
        } else {
          // All documents signed
          onComplete(responseData || []);
        }
      }
    } catch (error) {
      console.error('Error signing document:', error);
      toast({
        title: 'Signing failed',
        description: 'Failed to sign document. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSigning(false);
    }
  };

  const currentTemplate = templates[currentTemplateIndex];
  const progress = templates.length > 0 ? ((currentTemplateIndex + 1) / templates.length) * 100 : 0;
  const signerName = isParentSigning && parentData 
    ? `${parentData.firstName} ${parentData.lastName}` 
    : `${playerData.firstName} ${playerData.lastName}`;

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Consent Documents Error
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={fetchConsentTemplates}>
                Try Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Consent Documents
            {templates.length > 1 && (
              <Badge variant="secondary">
                {currentTemplateIndex + 1} of {templates.length}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress */}
            {templates.length > 1 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(progress)}% complete</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Document Content */}
            {currentTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {currentTemplate.title}
                    <Badge variant={currentTemplate.isRequired ? 'destructive' : 'secondary'}>
                      {currentTemplate.isRequired ? 'Required' : 'Optional'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none bg-gray-50 dark:bg-gray-900 p-4 rounded-lg max-h-64 overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: currentTemplate.content || 
                      `<p>This is a ${currentTemplate.templateType} consent form. By signing below, you acknowledge that you have read, understood, and agree to the terms outlined in this document.</p>` 
                    }} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Signature Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="h-5 w-5" />
                  Digital Signature
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Signing as: <strong>{signerName}</strong></span>
                  {isParentSigning && (
                    <Badge variant="outline">Parent/Guardian</Badge>
                  )}
                </div>

                {/* Signature Method Selection */}
                <div className="space-y-2">
                  <Label>Signature Method</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="signatureMethod"
                        value="typed"
                        checked={signatureData.signatureMethod === 'typed'}
                        onChange={(e) => setSignatureData(prev => ({ 
                          ...prev, 
                          signatureMethod: e.target.value as 'typed' | 'drawn',
                          drawnSignature: undefined
                        }))}
                      />
                      <span>Type Name</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="signatureMethod"
                        value="drawn"
                        checked={signatureData.signatureMethod === 'drawn'}
                        onChange={(e) => setSignatureData(prev => ({ 
                          ...prev, 
                          signatureMethod: e.target.value as 'typed' | 'drawn'
                        }))}
                      />
                      <span>Draw Signature</span>
                    </label>
                  </div>
                </div>

                {/* Typed Signature */}
                {signatureData.signatureMethod === 'typed' && (
                  <div className="space-y-2">
                    <Label htmlFor="signedName">Full Legal Name</Label>
                    <Input
                      id="signedName"
                      value={signatureData.signedName}
                      onChange={(e) => setSignatureData(prev => ({ 
                        ...prev, 
                        signedName: e.target.value 
                      }))}
                      placeholder="Enter your full legal name"
                      className="font-serif text-lg"
                    />
                  </div>
                )}

                {/* Drawn Signature */}
                {signatureData.signatureMethod === 'drawn' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Draw Your Signature</Label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearSignature}
                        type="button"
                      >
                        Clear
                      </Button>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg">
                      <canvas
                        ref={canvasRef}
                        className="w-full h-32 cursor-crosshair rounded-lg"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signedNameDrawn">Full Legal Name (for verification)</Label>
                      <Input
                        id="signedNameDrawn"
                        value={signatureData.signedName}
                        onChange={(e) => setSignatureData(prev => ({ 
                          ...prev, 
                          signedName: e.target.value 
                        }))}
                        placeholder="Enter your full legal name"
                      />
                    </div>
                  </div>
                )}

                {/* Timestamp and Verification */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">Legal Notice</span>
                  </div>
                  <p className="text-blue-600 dark:text-blue-400 mt-1">
                    By signing this document electronically, you agree that your electronic signature 
                    has the same legal effect as a handwritten signature. The document will be 
                    timestamped and stored securely for legal compliance.
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-blue-600 dark:text-blue-400">
                    <Clock className="h-4 w-4" />
                    <span>Timestamp: {new Date().toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={onClose} disabled={isSigning}>
                Cancel
              </Button>
              
              <div className="flex gap-2">
                {currentTemplateIndex > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentTemplateIndex(prev => prev - 1)}
                    disabled={isSigning}
                  >
                    Previous
                  </Button>
                )}
                
                <Button 
                  onClick={signCurrentDocument}
                  disabled={isSigning || !signatureData.signedName.trim()}
                  className="min-w-32"
                >
                  {isSigning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {currentTemplateIndex === templates.length - 1 ? 'Complete Signup' : 'Sign & Continue'}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Signed Documents Progress */}
            {signedDocuments.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">
                    {signedDocuments.length} of {templates.length} documents signed
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}