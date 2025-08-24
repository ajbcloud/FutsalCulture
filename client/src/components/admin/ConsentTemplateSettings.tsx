import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FileText, Upload, Download, Trash2, Eye } from "lucide-react";
import { ObjectUploader } from "../ObjectUploader";
import type { UploadResult } from '@uppy/core';

interface ConsentTemplate {
  id: string;
  tenantId: string;
  templateType: string;
  title: string;
  content?: string;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  isCustom: boolean;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const TEMPLATE_TYPES = [
  { key: 'medical', label: 'Medical Information Release', description: 'Consent to share medical information in emergencies' },
  { key: 'liability', label: 'Liability Waiver', description: 'Release from liability for sports activities' },
  { key: 'photo', label: 'Photo/Video Release', description: 'Permission to use player photos in marketing materials' },
  { key: 'privacy', label: 'Privacy Policy', description: 'Data collection and usage policies' }
];

const DEFAULT_TEMPLATES = {
  medical: {
    title: "Medical Information Release Form",
    content: `<h3>Medical Information Release and Emergency Treatment Authorization</h3>
<p>I hereby authorize the coaching staff and administration to obtain emergency medical treatment for my child/ward in the event that I cannot be reached. I understand that every effort will be made to contact me before any treatment is administered.</p>
<p>I consent to the release of my child's medical information to emergency medical personnel and healthcare providers as necessary for treatment.</p>
<p>Emergency Contact Information:</p>
<ul>
<li>Primary Contact: [To be filled by parent]</li>
<li>Secondary Contact: [To be filled by parent]</li>
<li>Family Doctor: [To be filled by parent]</li>
<li>Medical Insurance Provider: [To be filled by parent]</li>
</ul>
<p>Known Allergies or Medical Conditions: [To be filled by parent]</p>
<p>Current Medications: [To be filled by parent]</p>`
  },
  liability: {
    title: "Liability Waiver and Release Form",
    content: `<h3>Assumption of Risk, Waiver of Claims, and Release Agreement</h3>
<p>I acknowledge that participation in futsal activities involves inherent risks of injury. I understand these risks and voluntarily assume them on behalf of my child/ward.</p>
<p>In consideration for allowing my child to participate, I hereby:</p>
<ul>
<li>Release and hold harmless the organization, its coaches, staff, and volunteers from any liability for injuries</li>
<li>Waive any claims for damages arising from participation in futsal activities</li>
<li>Agree to indemnify the organization against any claims made by others arising from my child's participation</li>
</ul>
<p>I understand this release covers all activities including training, games, tournaments, and related events.</p>
<p>I have read and understand this agreement and sign it voluntarily.</p>`
  },
  photo: {
    title: "Photo and Video Release Form",
    content: `<h3>Photo and Video Release Authorization</h3>
<p>I grant permission for my child's image, likeness, and voice to be used in photographs, videos, and other media produced by the organization.</p>
<p>This includes but is not limited to:</p>
<ul>
<li>Website content and social media posts</li>
<li>Promotional materials and brochures</li>
<li>Training videos and educational content</li>
<li>News articles and press releases</li>
</ul>
<p>I understand that:</p>
<ul>
<li>No compensation will be provided for use of these materials</li>
<li>The organization owns all rights to the media containing my child's image</li>
<li>I may withdraw this consent at any time by providing written notice</li>
</ul>
<p>I consent to the use of my child's image as described above.</p>`
  },
  privacy: {
    title: "Privacy Policy and Data Protection Notice",
    content: `<h3>Privacy Policy and Data Collection Notice</h3>
<p>This notice explains how we collect, use, and protect your family's personal information.</p>
<h4>Information We Collect:</h4>
<ul>
<li>Player registration information (name, age, contact details)</li>
<li>Parent/guardian contact information</li>
<li>Emergency contact details</li>
<li>Medical information necessary for safe participation</li>
<li>Payment information for session fees</li>
</ul>
<h4>How We Use Your Information:</h4>
<ul>
<li>Session scheduling and communication</li>
<li>Emergency contact purposes</li>
<li>Payment processing</li>
<li>Program improvement and safety measures</li>
</ul>
<h4>Data Protection:</h4>
<ul>
<li>Information is stored securely and access is limited to authorized staff</li>
<li>We do not sell or share personal information with third parties</li>
<li>You may request access to or deletion of your data at any time</li>
</ul>
<p>By providing this information, you consent to its use as described in this privacy policy.</p>`
  }
};

export default function ConsentTemplateSettings() {
  const { toast } = useToast();
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [customContent, setCustomContent] = useState<Record<string, string>>({});

  // Fetch current templates
  const { data: templates, isLoading } = useQuery<ConsentTemplate[]>({
    queryKey: ["/api/admin/consent-templates"],
    queryFn: () => fetch("/api/admin/consent-templates").then(res => res.json()),
  });

  // Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ templateType, fileUrl }: { templateType: string; fileUrl: string }) => {
      return apiRequest("/api/admin/consent-templates", "POST", {
        templateType,
        filePath: fileUrl,
        isCustom: true,
      });
    },
    onSuccess: () => {
      toast({
        title: "Template uploaded",
        description: "Custom consent template has been uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/consent-templates"] });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload consent template",
        variant: "destructive",
      });
    },
  });

  // Save custom content mutation
  const saveContentMutation = useMutation({
    mutationFn: async ({ templateType, content }: { templateType: string; content: string }) => {
      return apiRequest("/api/admin/consent-templates", "POST", {
        templateType,
        content,
        isCustom: true,
      });
    },
    onSuccess: () => {
      toast({
        title: "Template saved",
        description: "Custom consent template content has been saved",
      });
      setEditingTemplate(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/consent-templates"] });
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save consent template",
        variant: "destructive",
      });
    },
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return apiRequest(`/api/admin/consent-templates/${templateId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Template deleted",
        description: "Custom consent template has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/consent-templates"] });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete consent template",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (templateType: string) => async () => {
    const response = await fetch("/api/admin/consent-templates/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const { uploadURL } = await response.json();
    return { method: 'PUT' as const, url: uploadURL };
  };

  const handleUploadComplete = (templateType: string) => (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful[0]) {
      const fileUrl = result.successful[0].uploadURL as string;
      uploadMutation.mutate({ templateType, fileUrl });
    }
  };

  const getActiveTemplate = (templateType: string) => {
    return templates?.find(t => t.templateType === templateType && t.isActive);
  };

  const handleEditContent = (templateType: string) => {
    const activeTemplate = getActiveTemplate(templateType);
    const content = activeTemplate?.content || DEFAULT_TEMPLATES[templateType as keyof typeof DEFAULT_TEMPLATES]?.content || '';
    setCustomContent({ ...customContent, [templateType]: content });
    setEditingTemplate(templateType);
  };

  const handleSaveContent = (templateType: string) => {
    const content = customContent[templateType];
    if (!content) return;
    
    saveContentMutation.mutate({ templateType, content });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Consent Form Templates</CardTitle>
          </div>
          <CardDescription>
            Upload custom consent forms or edit the default templates provided
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {TEMPLATE_TYPES.map((type) => {
            const activeTemplate = getActiveTemplate(type.key);
            const isEditing = editingTemplate === type.key;
            
            return (
              <Card key={type.key} className="border-l-4 border-l-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{type.label}</CardTitle>
                      <CardDescription>{type.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeTemplate?.isCustom && (
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                          Custom
                        </span>
                      )}
                      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded text-xs font-medium">
                        {activeTemplate ? 'Active' : 'Default'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`content-${type.key}`}>Template Content (HTML)</Label>
                        <Textarea
                          id={`content-${type.key}`}
                          value={customContent[type.key] || ''}
                          onChange={(e) => setCustomContent({ ...customContent, [type.key]: e.target.value })}
                          rows={10}
                          className="font-mono text-sm"
                          placeholder="Enter HTML content for the consent form..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleSaveContent(type.key)}
                          disabled={saveContentMutation.isPending}
                          data-testid={`button-save-${type.key}`}
                        >
                          Save Content
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setEditingTemplate(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex gap-2 flex-wrap">
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={10485760} // 10MB
                          onGetUploadParameters={handleFileUpload(type.key)}
                          onComplete={handleUploadComplete(type.key)}
                          buttonClassName="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Upload Custom Form
                        </ObjectUploader>

                        <Button
                          variant="outline"
                          onClick={() => handleEditContent(type.key)}
                          className="flex items-center gap-2"
                          data-testid={`button-edit-${type.key}`}
                        >
                          <Eye className="h-4 w-4" />
                          Edit Content
                        </Button>

                        {activeTemplate?.filePath && (
                          <Button
                            variant="outline"
                            onClick={() => window.open(`/objects/${activeTemplate.filePath}`, '_blank')}
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        )}

                        {activeTemplate?.isCustom && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMutation.mutate(activeTemplate.id)}
                            disabled={deleteMutation.isPending}
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove Custom
                          </Button>
                        )}
                      </div>

                      {activeTemplate && (
                        <div className="text-sm text-muted-foreground">
                          {activeTemplate.isCustom ? (
                            activeTemplate.filePath ? (
                              `Custom file: ${activeTemplate.fileName} (${Math.round((activeTemplate.fileSize || 0) / 1024)} KB)`
                            ) : (
                              "Custom content template"
                            )
                          ) : (
                            "Using default template"
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}