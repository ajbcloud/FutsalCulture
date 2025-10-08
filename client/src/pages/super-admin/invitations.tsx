import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Pagination } from "@/components/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Copy, 
  Download, 
  TrendingUp,
  Package,
  BarChart3,
  QrCode,
  Send,
  RefreshCcw,
  ArrowRightLeft,
  Shield,
  Sparkles,
  Zap,
  Crown
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import type { inviteCodes } from "@shared/schema";

type InviteCode = typeof inviteCodes.$inferSelect & {
  tenantName?: string;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function SuperAdminInvitations() {
  const { toast } = useToast();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("all-codes");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBulkCreateOpen, setIsBulkCreateOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<InviteCode | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [transferId, setTransferId] = useState<string | null>(null);
  const [targetTenantId, setTargetTenantId] = useState("");
  
  // Read URL parameters on mount to set initial tab and action
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const actionParam = params.get('action');
    
    if (tabParam && (tabParam === 'all-codes' || tabParam === 'platform-codes' || tabParam === 'analytics')) {
      setActiveTab(tabParam);
    }
    
    if (actionParam === 'create') {
      setIsCreateOpen(true);
      // Clean up URL after opening dialog
      window.history.replaceState({}, '', window.location.pathname + '?tab=' + (tabParam || 'all-codes'));
    }
  }, [location]);
  
  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    tenantId: "",
    codeType: "",
    status: "",
    isPlatform: "",
    search: ""
  });
  
  // Form data
  const [formData, setFormData] = useState({
    code: "",
    codeType: "invite" as "invite" | "access" | "discount",
    description: "",
    isActive: true,
    tenantId: "",
    category: "" as "" | "partner" | "promotion" | "beta" | "vip",
    ageGroup: "",
    gender: "",
    location: "",
    club: "",
    discountType: "full" as "full" | "percentage" | "fixed",
    discountValue: 0,
    maxUses: null as number | null,
    validFrom: "",
    validUntil: "",
    metadataJson: "{}"
  });
  
  // Bulk create form data
  const [bulkFormData, setBulkFormData] = useState({
    pattern: "PLATFORM-XXX",
    count: 10,
    codeType: "invite" as "invite" | "access" | "discount",
    description: "",
    isActive: true,
    tenantId: "",
    maxUses: null as number | null,
    validFrom: "",
    validUntil: "",
    discountType: "full" as "full" | "percentage" | "fixed",
    discountValue: 0,
    metadataJson: "{}"
  });

  // Fetch all invitation codes
  const { data: codesData, isLoading: isLoadingCodes } = useQuery<{ rows: InviteCode[]; total: number }>({
    queryKey: ["/api/super-admin/invitations", filters, currentPage, itemsPerPage],
    queryFn: () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: itemsPerPage.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });
      return apiRequest("GET", `/api/super-admin/invitations?${params}`);
    }
  });
  
  // Fetch tenants for dropdown
  const { data: tenants = [] } = useQuery<any[]>({
    queryKey: ["/api/super-admin/tenants"],
  });
  
  // Fetch analytics data
  const { data: analyticsData } = useQuery({
    queryKey: ["/api/super-admin/invitations/analytics", { groupBy: 'tenant' }],
    queryFn: () => apiRequest("GET", `/api/super-admin/invitations/analytics?groupBy=tenant`),
    enabled: activeTab === "analytics"
  });
  
  const { data: codeTypeAnalytics } = useQuery({
    queryKey: ["/api/super-admin/invitations/analytics", { groupBy: 'code_type' }],
    queryFn: () => apiRequest("GET", `/api/super-admin/invitations/analytics?groupBy=code_type`),
    enabled: activeTab === "analytics"
  });
  
  const { data: dateAnalytics } = useQuery({
    queryKey: ["/api/super-admin/invitations/analytics", { groupBy: 'date' }],
    queryFn: () => apiRequest("GET", `/api/super-admin/invitations/analytics?groupBy=date`),
    enabled: activeTab === "analytics"
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/super-admin/invitations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/invitations"] });
      toast({ title: "Platform invitation code created successfully" });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create invitation code",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const bulkCreateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/super-admin/invitations/bulk-create", data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/invitations"] });
      toast({ title: `${response.created} invitation codes created successfully` });
      setIsBulkCreateOpen(false);
      resetBulkForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to bulk create invitation codes",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/super-admin/invitations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/invitations"] });
      toast({ title: "Invitation code updated successfully" });
      setEditingCode(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update invitation code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/super-admin/invitations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/invitations"] });
      toast({ title: "Invitation code deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete invitation code",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const cloneMutation = useMutation({
    mutationFn: ({ id, code }: { id: string; code: string }) =>
      apiRequest("POST", `/api/super-admin/invitations/${id}/clone`, { code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/invitations"] });
      toast({ title: "Invitation code cloned successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to clone invitation code",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const transferMutation = useMutation({
    mutationFn: ({ id, targetTenantId }: { id: string; targetTenantId: string }) =>
      apiRequest("POST", `/api/super-admin/invitations/${id}/transfer`, { targetTenantId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/invitations"] });
      toast({ title: "Invitation code transferred successfully" });
      setTransferId(null);
      setTargetTenantId("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to transfer invitation code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      codeType: "invite",
      description: "",
      isActive: true,
      tenantId: "",
      category: "",
      ageGroup: "",
      gender: "",
      location: "",
      club: "",
      discountType: "full",
      discountValue: 0,
      maxUses: null,
      validFrom: "",
      validUntil: "",
      metadataJson: "{}"
    });
  };
  
  const resetBulkForm = () => {
    setBulkFormData({
      pattern: "PLATFORM-XXX",
      count: 10,
      codeType: "invite",
      description: "",
      isActive: true,
      tenantId: "",
      maxUses: null,
      validFrom: "",
      validUntil: "",
      discountType: "full",
      discountValue: 0,
      metadataJson: "{}"
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let metadata: Record<string, any> = {};
    try {
      if (formData.metadataJson.trim()) {
        metadata = JSON.parse(formData.metadataJson);
      }
    } catch (error) {
      toast({
        title: "Invalid JSON in metadata",
        description: "Please check your metadata JSON format",
        variant: "destructive",
      });
      return;
    }

    const payload: any = {
      code: formData.code.toUpperCase(),
      codeType: formData.codeType,
      description: formData.description || undefined,
      isActive: formData.isActive,
      tenantId: formData.tenantId || undefined,
      category: formData.category || undefined,
      ageGroup: formData.ageGroup || undefined,
      gender: formData.gender || undefined,
      location: formData.location || undefined,
      club: formData.club || undefined,
      maxUses: formData.maxUses || undefined,
      validFrom: formData.validFrom || undefined,
      validUntil: formData.validUntil || undefined,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    };

    if (formData.codeType === "discount") {
      payload.discountType = formData.discountType;
      if (formData.discountType !== "full") {
        payload.discountValue = formData.discountValue;
      }
    }

    if (editingCode) {
      updateMutation.mutate({ id: editingCode.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };
  
  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let metadata: Record<string, any> = {};
    try {
      if (bulkFormData.metadataJson.trim()) {
        metadata = JSON.parse(bulkFormData.metadataJson);
      }
    } catch (error) {
      toast({
        title: "Invalid JSON in metadata",
        description: "Please check your metadata JSON format",
        variant: "destructive",
      });
      return;
    }

    const payload: any = {
      pattern: bulkFormData.pattern,
      count: bulkFormData.count,
      codeType: bulkFormData.codeType,
      description: bulkFormData.description || undefined,
      isActive: bulkFormData.isActive,
      tenantId: bulkFormData.tenantId || undefined,
      maxUses: bulkFormData.maxUses || undefined,
      validFrom: bulkFormData.validFrom || undefined,
      validUntil: bulkFormData.validUntil || undefined,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    };

    if (bulkFormData.codeType === "discount") {
      payload.discountType = bulkFormData.discountType;
      if (bulkFormData.discountType !== "full") {
        payload.discountValue = bulkFormData.discountValue;
      }
    }

    bulkCreateMutation.mutate(payload);
  };

  const handleEdit = (code: InviteCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      codeType: code.codeType as any,
      description: code.description || "",
      isActive: code.isActive ?? true,
      tenantId: code.tenantId,
      category: "",
      ageGroup: code.ageGroup || "",
      gender: code.gender || "",
      location: code.location || "",
      club: code.club || "",
      discountType: (code.discountType as any) || "full",
      discountValue: code.discountValue || 0,
      maxUses: code.maxUses,
      validFrom: code.validFrom ? format(new Date(code.validFrom), "yyyy-MM-dd'T'HH:mm") : "",
      validUntil: code.validUntil ? format(new Date(code.validUntil), "yyyy-MM-dd'T'HH:mm") : "",
      metadataJson: code.metadata ? JSON.stringify(code.metadata, null, 2) : "{}"
    });
  };
  
  const handleClone = (code: InviteCode) => {
    const newCode = prompt("Enter a new code for the clone:", `${code.code}-COPY`);
    if (newCode) {
      cloneMutation.mutate({ id: code.id, code: newCode });
    }
  };
  
  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });
      
      const response = await fetch(`/api/super-admin/invitations/export?${params}`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `invitation_codes_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({ title: "Codes exported successfully" });
    } catch (error) {
      toast({
        title: "Failed to export codes",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Code copied to clipboard" });
  };

  const getStatusBadge = (code: InviteCode) => {
    const now = new Date();
    const validUntil = code.validUntil ? new Date(code.validUntil) : null;
    
    if (!code.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    if (validUntil && validUntil < now) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    if (code.maxUses && code.currentUses >= code.maxUses) {
      return <Badge variant="outline">Fully Used</Badge>;
    }
    
    return <Badge variant="default">Active</Badge>;
  };
  
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "partner":
        return <Shield className="w-4 h-4" />;
      case "promotion":
        return <Sparkles className="w-4 h-4" />;
      case "beta":
        return <Zap className="w-4 h-4" />;
      case "vip":
        return <Crown className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const totalPages = Math.ceil((codesData?.total || 0) / itemsPerPage);
  const paginatedCodes = codesData?.rows || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Platform Invitations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage invitation codes across all tenants
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" size="sm" data-testid="button-export">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={isBulkCreateOpen} onOpenChange={setIsBulkCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-bulk-create">
                <Package className="w-4 h-4 mr-2" />
                Bulk Create
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk Create Invitation Codes</DialogTitle>
                <DialogDescription>
                  Generate multiple codes with a pattern. Use XXX for random characters.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleBulkSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bulk-pattern">Pattern</Label>
                    <Input
                      id="bulk-pattern"
                      value={bulkFormData.pattern}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, pattern: e.target.value })}
                      placeholder="SUMMER2024-XXX"
                      required
                      data-testid="input-bulk-pattern"
                    />
                    <p className="text-xs text-muted-foreground mt-1">XXX will be replaced with random characters</p>
                  </div>
                  <div>
                    <Label htmlFor="bulk-count">Count</Label>
                    <Input
                      id="bulk-count"
                      type="number"
                      value={bulkFormData.count}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, count: parseInt(e.target.value) })}
                      min={1}
                      max={100}
                      required
                      data-testid="input-bulk-count"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bulk-type">Code Type</Label>
                    <Select
                      value={bulkFormData.codeType}
                      onValueChange={(value: any) => setBulkFormData({ ...bulkFormData, codeType: value })}
                    >
                      <SelectTrigger id="bulk-type" data-testid="select-bulk-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invite">Invite Code</SelectItem>
                        <SelectItem value="access">Access Code</SelectItem>
                        <SelectItem value="discount">Discount Code</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="bulk-tenant">Tenant (Optional)</Label>
                    <Select
                      value={bulkFormData.tenantId}
                      onValueChange={(value) => setBulkFormData({ ...bulkFormData, tenantId: value })}
                    >
                      <SelectTrigger id="bulk-tenant" data-testid="select-bulk-tenant">
                        <SelectValue placeholder="Platform-wide" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Platform-wide</SelectItem>
                        {tenants.map((tenant: any) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.organization}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsBulkCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={bulkCreateMutation.isPending}>
                    {bulkCreateMutation.isPending ? "Creating..." : "Create Codes"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateOpen || !!editingCode} onOpenChange={(open) => {
            if (!open) {
              setIsCreateOpen(false);
              setEditingCode(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} size="sm" data-testid="button-create">
                <Plus className="w-4 h-4 mr-2" />
                Create Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCode ? "Edit Invitation Code" : "Create Platform Invitation Code"}</DialogTitle>
                <DialogDescription>
                  {editingCode ? "Update the invitation code" : "Create a new platform-wide invitation code"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Code</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="PLATFORM2024"
                      required
                      disabled={!!editingCode}
                      data-testid="input-code"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={formData.codeType}
                      onValueChange={(value: any) => setFormData({ ...formData, codeType: value })}
                    >
                      <SelectTrigger id="type" data-testid="select-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invite">Invite Code</SelectItem>
                        <SelectItem value="access">Access Code</SelectItem>
                        <SelectItem value="discount">Discount Code</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tenant">Tenant (Optional)</Label>
                    <Select
                      value={formData.tenantId}
                      onValueChange={(value) => setFormData({ ...formData, tenantId: value })}
                    >
                      <SelectTrigger id="tenant" data-testid="select-tenant">
                        <SelectValue placeholder="Platform-wide" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Platform-wide</SelectItem>
                        {tenants.map((tenant: any) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.organization}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger id="category" data-testid="select-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        <SelectItem value="partner">Partner Code</SelectItem>
                        <SelectItem value="promotion">Promotion Code</SelectItem>
                        <SelectItem value="beta">Beta Access</SelectItem>
                        <SelectItem value="vip">VIP Code</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Summer 2024 platform-wide promotion"
                    data-testid="textarea-description"
                  />
                </div>
                {formData.codeType === "discount" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="discount-type">Discount Type</Label>
                      <Select
                        value={formData.discountType}
                        onValueChange={(value: any) => setFormData({ ...formData, discountType: value })}
                      >
                        <SelectTrigger id="discount-type" data-testid="select-discount-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">Full Discount</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.discountType !== "full" && (
                      <div>
                        <Label htmlFor="discount-value">
                          {formData.discountType === "percentage" ? "Percentage (%)" : "Amount (cents)"}
                        </Label>
                        <Input
                          id="discount-value"
                          type="number"
                          value={formData.discountValue}
                          onChange={(e) => setFormData({ ...formData, discountValue: parseInt(e.target.value) })}
                          min={0}
                          max={formData.discountType === "percentage" ? 100 : 999999}
                          data-testid="input-discount-value"
                        />
                      </div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max-uses">Max Uses (Optional)</Label>
                    <Input
                      id="max-uses"
                      type="number"
                      value={formData.maxUses || ""}
                      onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="Unlimited"
                      min={1}
                      data-testid="input-max-uses"
                    />
                  </div>
                  <div className="flex items-center space-x-2 mt-6">
                    <Switch
                      id="active"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="active">Active</Label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="valid-from">Valid From (Optional)</Label>
                    <Input
                      id="valid-from"
                      type="datetime-local"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                      data-testid="input-valid-from"
                    />
                  </div>
                  <div>
                    <Label htmlFor="valid-until">Valid Until (Optional)</Label>
                    <Input
                      id="valid-until"
                      type="datetime-local"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      data-testid="input-valid-until"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="metadata">Metadata (JSON)</Label>
                  <Textarea
                    id="metadata"
                    value={formData.metadataJson}
                    onChange={(e) => setFormData({ ...formData, metadataJson: e.target.value })}
                    placeholder='{"source": "platform", "campaign": "summer2024"}'
                    rows={3}
                    data-testid="textarea-metadata"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsCreateOpen(false);
                    setEditingCode(null);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingCode ? (updateMutation.isPending ? "Updating..." : "Update") : (createMutation.isPending ? "Creating..." : "Create")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all-codes" data-testid="tab-all-codes">
            All Codes
          </TabsTrigger>
          <TabsTrigger value="platform-codes" data-testid="tab-platform-codes">
            Platform Codes
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-codes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Input
                  placeholder="Search codes..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  data-testid="input-search"
                />
                <Select
                  value={filters.tenantId}
                  onValueChange={(value) => setFilters({ ...filters, tenantId: value })}
                >
                  <SelectTrigger data-testid="select-filter-tenant">
                    <SelectValue placeholder="All Tenants" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Tenants</SelectItem>
                    {tenants.map((tenant: any) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.organization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.codeType}
                  onValueChange={(value) => setFilters({ ...filters, codeType: value })}
                >
                  <SelectTrigger data-testid="select-filter-type">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="invite">Invite</SelectItem>
                    <SelectItem value="access">Access</SelectItem>
                    <SelectItem value="discount">Discount</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger data-testid="select-filter-status">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="fully_used">Fully Used</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.isPlatform}
                  onValueChange={(value) => setFilters({ ...filters, isPlatform: value })}
                >
                  <SelectTrigger data-testid="select-filter-platform">
                    <SelectValue placeholder="All Codes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Codes</SelectItem>
                    <SelectItem value="true">Platform Only</SelectItem>
                    <SelectItem value="false">Tenant Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {isLoadingCodes ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCodes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No invitation codes found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedCodes.map((code) => (
                        <TableRow key={code.id}>
                          <TableCell className="font-mono">
                            <div className="flex items-center gap-2">
                              {code.isPlatform && <Badge variant="secondary" className="text-xs">Platform</Badge>}
                              {code.code}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(code.code)}
                                data-testid={`button-copy-${code.id}`}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{code.codeType}</Badge>
                          </TableCell>
                          <TableCell>{code.tenantName || "Platform"}</TableCell>
                          <TableCell>{getStatusBadge(code)}</TableCell>
                          <TableCell>
                            {code.currentUses}/{code.maxUses || "∞"}
                          </TableCell>
                          <TableCell>
                            {code.validUntil ? format(new Date(code.validUntil), "MMM dd, yyyy") : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(code)}
                                data-testid={`button-edit-${code.id}`}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleClone(code)}
                                data-testid={`button-clone-${code.id}`}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setTransferId(code.id)}
                                data-testid={`button-transfer-${code.id}`}
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteId(code.id)}
                                data-testid={`button-delete-${code.id}`}
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="platform-codes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Code Templates</CardTitle>
              <CardDescription>
                Pre-configured templates for common use cases
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => {
                setFormData({
                  ...formData,
                  code: `PARTNER-${Date.now().toString(36).toUpperCase()}`,
                  codeType: "access",
                  category: "partner",
                  description: "Partner access code with full platform benefits"
                });
                setIsCreateOpen(true);
              }}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-8 h-8 text-blue-500" />
                    <h3 className="font-semibold">Partner Code</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Grant full access to business partners across all tenants
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => {
                setFormData({
                  ...formData,
                  code: `PROMO-${Date.now().toString(36).toUpperCase()}`,
                  codeType: "discount",
                  category: "promotion",
                  description: "Limited-time promotional discount",
                  discountType: "percentage",
                  discountValue: 25
                });
                setIsCreateOpen(true);
              }}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-8 h-8 text-purple-500" />
                    <h3 className="font-semibold">Promotion Code</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Create marketing campaign codes with discounts
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => {
                setFormData({
                  ...formData,
                  code: `BETA-${Date.now().toString(36).toUpperCase()}`,
                  codeType: "access",
                  category: "beta",
                  description: "Beta feature access for early adopters",
                  maxUses: 100
                });
                setIsCreateOpen(true);
              }}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-8 h-8 text-yellow-500" />
                    <h3 className="font-semibold">Beta Access</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enable beta features for select users
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => {
                setFormData({
                  ...formData,
                  code: `VIP-${Date.now().toString(36).toUpperCase()}`,
                  codeType: "discount",
                  category: "vip",
                  description: "VIP client exclusive benefits",
                  discountType: "full"
                });
                setIsCreateOpen(true);
              }}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Crown className="w-8 h-8 text-amber-500" />
                    <h3 className="font-semibold">VIP Code</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Exclusive codes for premium clients
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Codes</CardTitle>
              <CardDescription>
                Codes that work across all tenants
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCodes ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedCodes
                    .filter(code => code.isPlatform)
                    .slice(0, 10)
                    .map((code) => (
                      <div key={code.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded">
                              <QrCode className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold">{code.code}</span>
                                {getCategoryIcon(code.metadata?.category as string)}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(code.code)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {code.description || "No description"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {code.currentUses}/{code.maxUses || "∞"} uses
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {code.validUntil ? `Expires ${format(new Date(code.validUntil), "MMM dd")}` : "No expiry"}
                              </p>
                            </div>
                            {getStatusBadge(code)}
                          </div>
                        </div>
                      </div>
                    ))}
                  {paginatedCodes.filter(code => code.isPlatform).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No platform codes created yet
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{codesData?.total || 0}</div>
                <p className="text-xs text-muted-foreground">Across all tenants</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Platform Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {paginatedCodes.filter(c => c.isPlatform).length}
                </div>
                <p className="text-xs text-muted-foreground">Multi-tenant codes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {paginatedCodes.reduce((sum, c) => sum + c.currentUses, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Code redemptions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Active Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {paginatedCodes.filter(c => c.isActive).length}
                </div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Usage by Tenant</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsData && analyticsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="tenantName" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="totalCodes" fill="#8884d8" name="Total Codes" />
                      <Bar dataKey="totalUsage" fill="#82ca9d" name="Total Usage" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No analytics data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Code Types Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {codeTypeAnalytics && codeTypeAnalytics.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={codeTypeAnalytics}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ codeType, totalCodes }) => `${codeType}: ${totalCodes}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="totalCodes"
                      >
                        {codeTypeAnalytics.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No analytics data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daily Code Creation</CardTitle>
            </CardHeader>
            <CardContent>
              {dateAnalytics && dateAnalytics.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dateAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="totalCodes" stroke="#8884d8" name="Codes Created" />
                    <Line type="monotone" dataKey="totalUsage" stroke="#82ca9d" name="Total Usage" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No analytics data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invitation Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invitation code? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteMutation.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!transferId} onOpenChange={() => setTransferId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer Invitation Code</AlertDialogTitle>
            <AlertDialogDescription>
              Select the target tenant to transfer this code to.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="transfer-tenant">Target Tenant</Label>
            <Select
              value={targetTenantId}
              onValueChange={setTargetTenantId}
            >
              <SelectTrigger id="transfer-tenant" data-testid="select-transfer-tenant">
                <SelectValue placeholder="Select tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((tenant: any) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.organization}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setTransferId(null);
              setTargetTenantId("");
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (transferId && targetTenantId) {
                  transferMutation.mutate({ id: transferId, targetTenantId });
                }
              }}
              disabled={!targetTenantId}
            >
              Transfer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}