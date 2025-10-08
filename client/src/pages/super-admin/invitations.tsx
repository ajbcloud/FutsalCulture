import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Ticket,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Copy,
  Calendar as CalendarIcon,
  MoreVertical,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  DollarSign,
  Percent,
  Hash,
  Clock,
  TrendingUp,
  Package,
  ShieldCheck,
  Sparkles,
  Info,
  Settings,
  ChevronDown,
  MapPin,
  User,
  Building,
} from "lucide-react";

// Types
interface InvitationCode {
  id: string;
  code: string;
  type: "invite" | "access" | "discount";
  description: string;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  maxUses?: number;
  usedCount: number;
  validFrom?: string;
  validUntil?: string;
  active: boolean;
  isPlatform: boolean;
  preFillFields?: {
    ageGroup?: string;
    gender?: string;
    location?: string;
    club?: string;
  };
  createdAt: string;
  createdBy: string;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
}

interface InvitationStats {
  totalCodes: number;
  activeCodes: number;
  totalUses: number;
  averageDiscountValue: number;
  topPerformingCode: string;
  conversionRate: number;
}

// Schemas
const invitationSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters"),
  type: z.enum(["invite", "access", "discount"]),
  description: z.string().min(1, "Description is required"),
  discountType: z.enum(["percentage", "fixed"]).optional(),
  discountValue: z.number().min(0).optional(),
  maxUses: z.number().min(0).optional().nullable(),
  validFrom: z.date().optional().nullable(),
  validUntil: z.date().optional().nullable(),
  active: z.boolean().default(true),
  preFillFields: z.object({
    ageGroup: z.string().optional(),
    gender: z.string().optional(),
    location: z.string().optional(),
    club: z.string().optional(),
  }).optional(),
});

export default function SuperAdminInvitations() {
  const [selectedCode, setSelectedCode] = useState<InvitationCode | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [exportLoading, setExportLoading] = useState(false);
  const [validFromDate, setValidFromDate] = useState<Date>();
  const [validUntilDate, setValidUntilDate] = useState<Date>();
  const { toast } = useToast();

  // Form
  const form = useForm<z.infer<typeof invitationSchema>>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      code: "",
      type: "invite",
      description: "",
      active: true,
      preFillFields: {},
    },
  });

  // Watch the type field to conditionally show discount fields
  const codeType = form.watch("type");

  // Queries
  const { data: invitationsData, isLoading: invitationsLoading, refetch: refetchInvitations } = useQuery<{
    codes: InvitationCode[];
    stats: InvitationStats;
  }>({
    queryKey: ["/api/super-admin/invitations"],
  });

  const codes = invitationsData?.codes || [];
  const stats = invitationsData?.stats || {
    totalCodes: 0,
    activeCodes: 0,
    totalUses: 0,
    averageDiscountValue: 0,
    topPerformingCode: "",
    conversionRate: 0,
  };

  // Filter codes - only show platform codes
  const filteredCodes = codes.filter((code) => {
    // Only show platform codes
    if (!code.isPlatform) return false;
    
    const matchesSearch = searchQuery === "" || 
      code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === "all" || code.type === typeFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && code.active) ||
      (statusFilter === "inactive" && !code.active);

    return matchesSearch && matchesType && matchesStatus;
  });

  // Mutations
  const createInvitationMutation = useMutation({
    mutationFn: async (data: z.infer<typeof invitationSchema>) => {
      const response = await apiRequest("POST", "/api/super-admin/invitations", {
        ...data,
        isPlatform: true,
        validFrom: data.validFrom?.toISOString(),
        validUntil: data.validUntil?.toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invitation code created successfully",
      });
      setDialogOpen(false);
      form.reset();
      refetchInvitations();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create invitation code",
        variant: "destructive",
      });
    },
  });

  const updateInvitationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof invitationSchema> }) => {
      const response = await apiRequest("PUT", `/api/super-admin/invitations/${id}`, {
        ...data,
        validFrom: data.validFrom?.toISOString(),
        validUntil: data.validUntil?.toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invitation code updated successfully",
      });
      setDialogOpen(false);
      setSelectedCode(null);
      form.reset();
      refetchInvitations();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update invitation code",
        variant: "destructive",
      });
    },
  });

  const deleteInvitationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/super-admin/invitations/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invitation code deleted successfully",
      });
      setDeleteDialogOpen(false);
      setSelectedCode(null);
      refetchInvitations();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete invitation code",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const response = await apiRequest("PATCH", `/api/super-admin/invitations/${id}/status`, {
        active,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Status updated successfully",
      });
      refetchInvitations();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: z.infer<typeof invitationSchema>) => {
    if (selectedCode) {
      updateInvitationMutation.mutate({ id: selectedCode.id, data });
    } else {
      createInvitationMutation.mutate(data);
    }
  };

  const openDialog = (code?: InvitationCode) => {
    if (code) {
      setSelectedCode(code);
      form.reset({
        code: code.code,
        type: code.type,
        description: code.description,
        discountType: code.discountType,
        discountValue: code.discountValue,
        maxUses: code.maxUses || undefined,
        validFrom: code.validFrom ? new Date(code.validFrom) : undefined,
        validUntil: code.validUntil ? new Date(code.validUntil) : undefined,
        active: code.active,
        preFillFields: code.preFillFields || {},
      });
      setValidFromDate(code.validFrom ? new Date(code.validFrom) : undefined);
      setValidUntilDate(code.validUntil ? new Date(code.validUntil) : undefined);
    } else {
      setSelectedCode(null);
      form.reset({
        code: "",
        type: "invite",
        description: "",
        active: true,
        preFillFields: {},
        discountType: undefined,
        discountValue: undefined,
        maxUses: undefined,
        validFrom: undefined,
        validUntil: undefined,
      });
      setValidFromDate(undefined);
      setValidUntilDate(undefined);
    }
    setDialogOpen(true);
  };

  const generateRandomCode = () => {
    const prefix = codeType === "discount" ? "DISC" : codeType === "access" ? "ACC" : "INV";
    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
    form.setValue("code", `${prefix}-${randomString}`);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: "Code copied to clipboard",
    });
  };

  const exportToCSV = async () => {
    setExportLoading(true);
    try {
      const response = await apiRequest("GET", "/api/super-admin/invitations/export?format=csv");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invitation-codes-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Success",
        description: "Invitation codes exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export invitation codes",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Ticket className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Platform Invitations</h1>
            <p className="text-muted-foreground">Manage signup codes and discounts across the platform</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Button 
            onClick={exportToCSV} 
            variant="outline"
            disabled={exportLoading}
            data-testid="button-export-csv"
          >
            {exportLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export CSV
          </Button>
          
          <Button onClick={() => openDialog()} data-testid="button-create-invitation">
            <Plus className="w-4 h-4 mr-2" />
            Create Invitation
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <Card data-testid="card-total-codes">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCodes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All invitation codes
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-codes">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Codes</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCodes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-uses">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Uses</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Times redeemed
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-discount">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Discount</CardTitle>
            <Percent className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageDiscountValue}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average discount value
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-conversion-rate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Signup conversion rate
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-top-code">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Code</CardTitle>
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{stats.topPerformingCode || "N/A"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Most used code
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Invitation Codes</CardTitle>
          <CardDescription>
            Manage platform-wide signup codes, access codes, and discount codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by code or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[150px]" data-testid="select-type-filter">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="invite">Invite</SelectItem>
                  <SelectItem value="access">Access</SelectItem>
                  <SelectItem value="discount">Discount</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]" data-testid="select-status-filter">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={() => refetchInvitations()} data-testid="button-refresh">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitationsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      <div className="py-8 text-muted-foreground">
                        No invitation codes found
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCodes.map((code) => (
                    <TableRow key={code.id} data-testid={`row-code-${code.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                            {code.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyCode(code.code)}
                            data-testid={`button-copy-${code.id}`}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          code.type === "discount" ? "default" :
                          code.type === "access" ? "secondary" :
                          "outline"
                        }>
                          {code.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={code.description}>
                          {code.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        {code.type === "discount" && code.discountValue ? (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {code.discountType === "percentage" ? (
                              <span>{code.discountValue}%</span>
                            ) : (
                              <span>${code.discountValue}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{code.usedCount} used</div>
                          {code.maxUses && (
                            <div className="text-xs text-muted-foreground">
                              of {code.maxUses} max
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {code.validFrom && (
                            <div className="text-xs">
                              From: {format(new Date(code.validFrom), "MMM dd, yyyy")}
                            </div>
                          )}
                          {code.validUntil && (
                            <div className="text-xs text-muted-foreground">
                              Until: {format(new Date(code.validUntil), "MMM dd, yyyy")}
                            </div>
                          )}
                          {!code.validFrom && !code.validUntil && (
                            <span className="text-muted-foreground">Always</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={code.active}
                          onCheckedChange={(checked) => 
                            toggleStatusMutation.mutate({ id: code.id, active: checked })
                          }
                          data-testid={`switch-status-${code.id}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-actions-${code.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDialog(code)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedCode(code);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCode ? "Edit Invitation Code" : "Create Invitation Code"}
            </DialogTitle>
            <DialogDescription>
              {selectedCode 
                ? "Update the details of this invitation code" 
                : "Create a new platform-wide invitation code"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input {...field} placeholder="SUMMER2025" data-testid="input-code" />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={generateRandomCode}
                            data-testid="button-generate-code"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-code-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="invite">Invite</SelectItem>
                          <SelectItem value="access">Access</SelectItem>
                          <SelectItem value="discount">Discount</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Describe what this code is for..."
                        rows={3}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Discount fields */}
              {codeType === "discount" && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="discountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-discount-type">
                              <SelectValue placeholder="Select discount type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="discountValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Value</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            placeholder="Enter value"
                            data-testid="input-discount-value"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="maxUses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Uses (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Leave empty for unlimited"
                        data-testid="input-max-uses"
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty for unlimited uses
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Validity dates */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="validFrom"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Valid From (optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="button-valid-from"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Valid Until (optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="button-valid-until"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Pre-fill fields */}
              <div className="space-y-4">
                <Label>Pre-fill Fields (optional)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="preFillFields.ageGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Age Group</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., U12" data-testid="input-age-group" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="preFillFields.gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-gender">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="mixed">Mixed</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="preFillFields.location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Location</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Sydney" data-testid="input-location" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="preFillFields.club"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Club</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Elite FC" data-testid="input-club" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Make this code immediately available for use
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createInvitationMutation.isPending || updateInvitationMutation.isPending}
                  data-testid="button-submit"
                >
                  {createInvitationMutation.isPending || updateInvitationMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      {selectedCode ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>{selectedCode ? "Update" : "Create"} Code</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invitation Code</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this invitation code? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedCode && (
            <div className="py-4">
              <div className="rounded-lg bg-muted p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Code:</span>
                    <code className="font-mono text-sm">{selectedCode.code}</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Type:</span>
                    <Badge variant="outline">{selectedCode.type}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Used:</span>
                    <span className="text-sm">{selectedCode.usedCount} times</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedCode && deleteInvitationMutation.mutate(selectedCode.id)}
              disabled={deleteInvitationMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteInvitationMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Code"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}