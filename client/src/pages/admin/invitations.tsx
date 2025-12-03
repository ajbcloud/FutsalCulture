import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "@/components/admin-layout";
import { Pagination } from "@/components/pagination";
import { format } from "date-fns";
import { Plus, Trash2, Edit, Copy, Star, ChevronDown, ChevronUp, Ticket, Percent } from "lucide-react";
import type { inviteCodes } from "@shared/schema";

type InviteCode = typeof inviteCodes.$inferSelect;

export default function Invitations() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"invite-access" | "discount">("invite-access");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDiscountCreateOpen, setIsDiscountCreateOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<InviteCode | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [discountCurrentPage, setDiscountCurrentPage] = useState(1);
  const [setDefaultId, setSetDefaultId] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showPrefill, setShowPrefill] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    codeType: "invite" as "invite" | "access" | "discount",
    description: "",
    isActive: true,
    ageGroup: "",
    gender: "",
    location: "",
    club: "",
    discountType: "full" as "full" | "percentage" | "fixed",
    discountValue: 0,
    maxUses: null as number | null,
    validFrom: "",
    validUntil: "",
  });

  const { data: inviteCodes = [], isLoading } = useQuery<InviteCode[]>({
    queryKey: ["/api/admin/invite-codes"],
  });

  const inviteAccessCodes = inviteCodes.filter(c => c.codeType === "invite" || c.codeType === "access");
  const discountCodes = inviteCodes.filter(c => c.codeType === "discount");

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/invite-codes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invite-codes"] });
      toast({ title: "Code created successfully" });
      setIsCreateOpen(false);
      setIsDiscountCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PUT", `/api/admin/invite-codes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invite-codes"] });
      toast({ title: "Code updated successfully" });
      setEditingCode(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/admin/invite-codes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invite-codes"] });
      toast({ title: "Code deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/admin/invite-codes/set-default/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invite-codes"] });
      toast({ title: "Default code updated successfully" });
      setSetDefaultId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to set default code",
        description: error.message,
        variant: "destructive",
      });
      setSetDefaultId(null);
    },
  });

  const resetForm = (codeType: "invite" | "access" | "discount" = "invite") => {
    setFormData({
      code: "",
      codeType,
      description: "",
      isActive: true,
      ageGroup: "",
      gender: "",
      location: "",
      club: "",
      discountType: "full",
      discountValue: 0,
      maxUses: null,
      validFrom: "",
      validUntil: "",
    });
    setShowPrefill(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      code: formData.code.toUpperCase(),
      codeType: formData.codeType,
      description: formData.description || null,
      isActive: formData.isActive,
      ageGroup: formData.ageGroup || null,
      gender: formData.gender || null,
      location: formData.location || null,
      club: formData.club || null,
      maxUses: formData.maxUses || null,
      validFrom: formData.validFrom || null,
      validUntil: formData.validUntil || null,
    };

    if (formData.codeType === "discount") {
      payload.discountType = formData.discountType;
      if (formData.discountType !== "full") {
        payload.discountValue = formData.discountValue;
      } else {
        payload.discountValue = null;
      }
    } else {
      payload.discountType = null;
      payload.discountValue = null;
    }

    if (editingCode) {
      updateMutation.mutate({
        id: editingCode.id,
        data: payload,
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (code: InviteCode) => {
    setEditingCode(code);
    const hasPrefillData = code.ageGroup || code.gender || code.location || code.club;
    setShowPrefill(!!hasPrefillData);
    setFormData({
      code: code.code,
      codeType: code.codeType as any,
      description: code.description || "",
      isActive: code.isActive ?? true,
      ageGroup: code.ageGroup || "",
      gender: code.gender || "",
      location: code.location || "",
      club: code.club || "",
      discountType: (code.discountType as any) || "full",
      discountValue: code.discountValue || 0,
      maxUses: code.maxUses,
      validFrom: code.validFrom ? format(new Date(code.validFrom), "yyyy-MM-dd'T'HH:mm") : "",
      validUntil: code.validUntil ? format(new Date(code.validUntil), "yyyy-MM-dd'T'HH:mm") : "",
    });
    if (code.codeType === "discount") {
      setIsDiscountCreateOpen(true);
    } else {
      setIsCreateOpen(true);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Code copied to clipboard" });
  };

  const getCodeTypeColor = (type: string) => {
    switch (type) {
      case "invite":
        return "bg-blue-500 text-white";
      case "access":
        return "bg-purple-500 text-white";
      case "discount":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const inviteAccessTotalPages = Math.ceil(inviteAccessCodes.length / itemsPerPage);
  const paginatedInviteAccessCodes = inviteAccessCodes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const discountTotalPages = Math.ceil(discountCodes.length / itemsPerPage);
  const paginatedDiscountCodes = discountCodes.slice((discountCurrentPage - 1) * itemsPerPage, discountCurrentPage * itemsPerPage);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const renderInviteAccessForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic" data-testid="tab-basic-info">Code Details</TabsTrigger>
          <TabsTrigger value="limits" data-testid="tab-usage-limits">Usage & Limits</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="SUMMER2025"
                required
                minLength={3}
                maxLength={50}
                data-testid="input-code"
              />
            </div>
            <div>
              <Label htmlFor="codeType">Code Type *</Label>
              <Select
                value={formData.codeType}
                onValueChange={(value: any) => setFormData({ ...formData, codeType: value })}
              >
                <SelectTrigger data-testid="select-code-type">
                  <SelectValue placeholder="Select code type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invite">Invite - For new registrations</SelectItem>
                  <SelectItem value="access">Access - For unlocking sessions</SelectItem>
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
              placeholder="Enter a description for this code..."
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              data-testid="input-description"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              data-testid="switch-is-active"
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <Collapsible open={showPrefill} onOpenChange={setShowPrefill}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" type="button" className="w-full justify-between p-2 h-auto" data-testid="button-toggle-prefill">
                <span className="text-sm font-medium">Pre-fill Data (Optional)</span>
                {showPrefill ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                These fields will auto-populate signup forms when users use this code
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ageGroup">Age Group</Label>
                  <Input
                    id="ageGroup"
                    value={formData.ageGroup}
                    onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                    placeholder="e.g., U12, U15"
                    data-testid="input-age-group"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender || "none"}
                    onValueChange={(value) => setFormData({ ...formData, gender: value === "none" ? "" : value })}
                  >
                    <SelectTrigger data-testid="select-gender">
                      <SelectValue placeholder="Select gender (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="boys">Boys</SelectItem>
                      <SelectItem value="girls">Girls</SelectItem>
                      <SelectItem value="coed">Coed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Downtown Arena"
                    data-testid="input-location"
                  />
                </div>
                <div>
                  <Label htmlFor="club">Club/Team</Label>
                  <Input
                    id="club"
                    value={formData.club}
                    onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                    placeholder="e.g., City FC"
                    data-testid="input-club"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4 mt-4">
          <div>
            <Label htmlFor="maxUses">Max Uses (optional)</Label>
            <Input
              id="maxUses"
              type="number"
              value={formData.maxUses || ""}
              onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? Number(e.target.value) : null })}
              placeholder="Leave empty for unlimited"
              min="1"
              data-testid="input-max-uses"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="validFrom">Valid From (optional)</Label>
              <Input
                id="validFrom"
                type="datetime-local"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                data-testid="input-valid-from"
              />
            </div>
            <div>
              <Label htmlFor="validUntil">Valid Until (optional)</Label>
              <Input
                id="validUntil"
                type="datetime-local"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                data-testid="input-valid-until"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsCreateOpen(false);
            setEditingCode(null);
            resetForm();
          }}
          data-testid="button-cancel"
        >
          Cancel
        </Button>
        <Button type="submit" data-testid="button-submit">
          {editingCode ? "Update Code" : "Create Code"}
        </Button>
      </div>
    </form>
  );

  const renderDiscountForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic" data-testid="tab-discount-details">Discount Details</TabsTrigger>
          <TabsTrigger value="limits" data-testid="tab-discount-limits">Usage & Limits</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discountCode">Code *</Label>
              <Input
                id="discountCode"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="SAVE20"
                required
                minLength={3}
                maxLength={50}
                data-testid="input-discount-code"
              />
            </div>
            <div>
              <Label htmlFor="discountType">Discount Type *</Label>
              <Select
                value={formData.discountType}
                onValueChange={(value: any) => setFormData({ ...formData, discountType: value })}
              >
                <SelectTrigger data-testid="select-discount-type">
                  <SelectValue placeholder="Select discount type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full (100% Off)</SelectItem>
                  <SelectItem value="percentage">Percentage Off</SelectItem>
                  <SelectItem value="fixed">Fixed Amount Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.discountType !== "full" && (
            <div>
              <Label htmlFor="discountValue">
                {formData.discountType === "percentage" ? "Percentage Off (%)" : "Amount Off ($)"}
              </Label>
              <Input
                id="discountValue"
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                placeholder={formData.discountType === "percentage" ? "50" : "5"}
                min="0"
                max={formData.discountType === "percentage" ? "100" : undefined}
                required
                data-testid="input-discount-value"
              />
            </div>
          )}

          <div>
            <Label htmlFor="discountDescription">Description</Label>
            <Textarea
              id="discountDescription"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Summer sale - 20% off all sessions"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              data-testid="input-discount-description"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="discountIsActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              data-testid="switch-discount-is-active"
            />
            <Label htmlFor="discountIsActive">Active</Label>
          </div>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4 mt-4">
          <div>
            <Label htmlFor="discountMaxUses">Max Uses (optional)</Label>
            <Input
              id="discountMaxUses"
              type="number"
              value={formData.maxUses || ""}
              onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? Number(e.target.value) : null })}
              placeholder="Leave empty for unlimited"
              min="1"
              data-testid="input-discount-max-uses"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discountValidFrom">Valid From (optional)</Label>
              <Input
                id="discountValidFrom"
                type="datetime-local"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                data-testid="input-discount-valid-from"
              />
            </div>
            <div>
              <Label htmlFor="discountValidUntil">Valid Until (optional)</Label>
              <Input
                id="discountValidUntil"
                type="datetime-local"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                data-testid="input-discount-valid-until"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsDiscountCreateOpen(false);
            setEditingCode(null);
            resetForm();
          }}
          data-testid="button-discount-cancel"
        >
          Cancel
        </Button>
        <Button type="submit" data-testid="button-discount-submit">
          {editingCode ? "Update Discount" : "Create Discount"}
        </Button>
      </div>
    </form>
  );

  const renderCodesTable = (codes: InviteCode[], isDiscount: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          {!isDiscount && <TableHead>Type</TableHead>}
          {isDiscount && <TableHead>Discount</TableHead>}
          <TableHead>Description</TableHead>
          {!isDiscount && <TableHead>Pre-fill Info</TableHead>}
          <TableHead>Usage</TableHead>
          <TableHead>Valid Dates</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {codes.length === 0 ? (
          <TableRow>
            <TableCell colSpan={isDiscount ? 7 : 8} className="text-center py-8 text-muted-foreground">
              {isDiscount 
                ? "No discount codes found. Create your first discount code to get started."
                : "No invite or access codes found. Create your first code to get started."
              }
            </TableCell>
          </TableRow>
        ) : (
          codes.map((code) => (
            <TableRow key={code.id} data-testid={`row-code-${code.id}`}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded" data-testid={`text-code-${code.id}`}>
                    {code.code}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(code.code)}
                    data-testid={`button-copy-${code.id}`}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </TableCell>
              {!isDiscount && (
                <TableCell>
                  <Badge className={getCodeTypeColor(code.codeType)} data-testid={`badge-type-${code.id}`}>
                    {code.codeType}
                  </Badge>
                </TableCell>
              )}
              {isDiscount && (
                <TableCell data-testid={`text-discount-${code.id}`}>
                  {code.discountType === "full" ? (
                    <Badge variant="secondary">100% Off</Badge>
                  ) : code.discountType === "percentage" ? (
                    <Badge variant="secondary">{code.discountValue}% Off</Badge>
                  ) : (
                    <Badge variant="secondary">${code.discountValue} Off</Badge>
                  )}
                </TableCell>
              )}
              <TableCell className="max-w-xs truncate" data-testid={`text-description-${code.id}`}>
                {code.description || "-"}
              </TableCell>
              {!isDiscount && (
                <TableCell data-testid={`text-prefill-${code.id}`}>
                  {code.ageGroup || code.gender || code.location || code.club ? (
                    <div className="text-xs space-y-1">
                      {code.ageGroup && <div>Age: {code.ageGroup}</div>}
                      {code.gender && <div>Gender: {code.gender}</div>}
                      {code.location && <div>Location: {code.location}</div>}
                      {code.club && <div>Club: {code.club}</div>}
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
              )}
              <TableCell data-testid={`text-usage-${code.id}`}>
                {code.currentUses || 0}/{code.maxUses || "∞"}
              </TableCell>
              <TableCell data-testid={`text-dates-${code.id}`}>
                {code.validFrom || code.validUntil ? (
                  <div className="text-xs space-y-1">
                    {code.validFrom && <div>From: {format(new Date(code.validFrom), "MM/dd/yyyy")}</div>}
                    {code.validUntil && <div>Until: {format(new Date(code.validUntil), "MM/dd/yyyy")}</div>}
                  </div>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge variant={code.isActive ? "default" : "secondary"} className={code.isActive ? "bg-green-500" : "bg-gray-500"} data-testid={`badge-active-${code.id}`}>
                    {code.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {code.isDefault && (
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300" data-testid={`badge-default-${code.id}`}>
                      DEFAULT
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(code)}
                    data-testid={`button-edit-${code.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {!code.isDefault && !isDiscount && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSetDefaultId(code.id)}
                      data-testid={`button-set-default-${code.id}`}
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete the code "${code.code}"?`)) {
                        deleteMutation.mutate(code.id);
                      }
                    }}
                    data-testid={`button-delete-${code.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-foreground">Promo & Access Codes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage invite, access, and discount codes for your organization
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="invite-access" className="flex items-center gap-2" data-testid="tab-invite-access">
              <Ticket className="w-4 h-4" />
              <span>Invite & Access</span>
            </TabsTrigger>
            <TabsTrigger value="discount" className="flex items-center gap-2" data-testid="tab-discount">
              <Percent className="w-4 h-4" />
              <span>Discount Codes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invite-access" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Dialog open={isCreateOpen || (!!editingCode && editingCode.codeType !== "discount")} onOpenChange={(open) => {
                if (!open) {
                  setIsCreateOpen(false);
                  setEditingCode(null);
                  resetForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetForm("invite"); setIsCreateOpen(true); }} size="sm" data-testid="button-create-invite-code">
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Create Invite/Access Code</span>
                    <span className="sm:hidden">Create Code</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingCode ? "Edit Code" : "Create Invite/Access Code"}</DialogTitle>
                    <DialogDescription>
                      {editingCode 
                        ? "Update the code settings" 
                        : "Create a code for new registrations (invite) or to unlock private sessions (access)"
                      }
                    </DialogDescription>
                  </DialogHeader>
                  {renderInviteAccessForm()}
                </DialogContent>
              </Dialog>
            </div>

            <div className="border rounded-lg overflow-hidden">
              {renderCodesTable(paginatedInviteAccessCodes, false)}
            </div>

            {inviteAccessCodes.length > 10 && (
              <Pagination
                totalItems={inviteAccessCodes.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            )}
          </TabsContent>

          <TabsContent value="discount" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Dialog open={isDiscountCreateOpen || (!!editingCode && editingCode.codeType === "discount")} onOpenChange={(open) => {
                if (!open) {
                  setIsDiscountCreateOpen(false);
                  setEditingCode(null);
                  resetForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetForm("discount"); setIsDiscountCreateOpen(true); }} size="sm" data-testid="button-create-discount-code">
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Create Discount Code</span>
                    <span className="sm:hidden">Create Discount</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingCode ? "Edit Discount Code" : "Create Discount Code"}</DialogTitle>
                    <DialogDescription>
                      {editingCode 
                        ? "Update the discount code settings" 
                        : "Create a promotional code to offer discounts on bookings"
                      }
                    </DialogDescription>
                  </DialogHeader>
                  {renderDiscountForm()}
                </DialogContent>
              </Dialog>
            </div>

            <div className="border rounded-lg overflow-hidden">
              {renderCodesTable(paginatedDiscountCodes, true)}
            </div>

            {discountCodes.length > 10 && (
              <Pagination
                totalItems={discountCodes.length}
                itemsPerPage={itemsPerPage}
                currentPage={discountCurrentPage}
                onPageChange={setDiscountCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={!!setDefaultId} onOpenChange={(open) => !open && setSetDefaultId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set as Default Invite Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to set this as your organization's default invite code? 
              This will unset any existing default code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-set-default">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setDefaultId && setDefaultMutation.mutate(setDefaultId)}
              data-testid="button-confirm-set-default"
            >
              Set as Default
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
