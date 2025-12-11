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
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "@/components/admin-layout";
import { Pagination } from "@/components/pagination";
import { format } from "date-fns";
import { Plus, Trash2, Edit, Copy, Star } from "lucide-react";
import type { inviteCodes } from "@shared/schema";

type InviteCode = typeof inviteCodes.$inferSelect;

export default function Invitations() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<InviteCode | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [setDefaultId, setSetDefaultId] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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
    metadataJson: "{}",
  });

  const { data: inviteCodes = [], isLoading } = useQuery<InviteCode[]>({
    queryKey: ["/api/admin/invite-codes"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/invite-codes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invite-codes"] });
      toast({ title: "Invite code created successfully" });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create invite code",
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
      toast({ title: "Invite code updated successfully" });
      setEditingCode(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update invite code",
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
      toast({ title: "Invite code deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete invite code",
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
      toast({ title: "Default invite code updated successfully" });
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

  const resetForm = () => {
    setFormData({
      code: "",
      codeType: "invite",
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
      metadataJson: "{}",
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
      description: formData.description || null,
      isActive: formData.isActive,
      ageGroup: formData.ageGroup || null,
      gender: formData.gender || null,
      location: formData.location || null,
      club: formData.club || null,
      maxUses: formData.maxUses || null,
      validFrom: formData.validFrom || null,
      validUntil: formData.validUntil || null,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
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
      metadataJson: code.metadata ? JSON.stringify(code.metadata, null, 2) : "{}",
    });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Code copied to clipboard" });
  };

  const getCodeTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "invite":
        return "default";
      case "access":
        return "secondary";
      case "discount":
        return "outline";
      default:
        return "default";
    }
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

  const totalPages = Math.ceil(inviteCodes.length / itemsPerPage);
  const paginatedCodes = inviteCodes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-foreground">Invite Codes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage invite, access, and discount codes for your organization
            </p>
          </div>
          <Dialog open={isCreateOpen || !!editingCode} onOpenChange={(open) => {
            if (!open) {
              setIsCreateOpen(false);
              setEditingCode(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} size="sm" data-testid="button-create-invite-code">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Create Invite Code</span>
                <span className="sm:hidden">Create Code</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCode ? "Edit Invite Code" : "Create Invite Code"}</DialogTitle>
                <DialogDescription>
                  {editingCode ? "Update the invite code settings" : "Create a new invite code with optional pre-fill data and discount settings"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="basic" data-testid="tab-basic-info">Basic Info</TabsTrigger>
                    <TabsTrigger value="prefill" data-testid="tab-prefill-data">Pre-fill Data</TabsTrigger>
                    <TabsTrigger value="discount" data-testid="tab-discount-settings">Discount</TabsTrigger>
                    <TabsTrigger value="limits" data-testid="tab-usage-limits">Usage & Limits</TabsTrigger>
                    <TabsTrigger value="metadata" data-testid="tab-metadata">Metadata</TabsTrigger>
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
                            <SelectItem value="invite">Invite</SelectItem>
                            <SelectItem value="access">Access</SelectItem>
                            <SelectItem value="discount">Discount</SelectItem>
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
                  </TabsContent>

                  <TabsContent value="prefill" className="space-y-4 mt-4">
                    <p className="text-sm text-muted-foreground">
                      Pre-fill data will automatically populate signup forms when users use this code
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
                        <Label htmlFor="club">Club</Label>
                        <Input
                          id="club"
                          value={formData.club}
                          onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                          placeholder="e.g., City FC"
                          data-testid="input-club"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="discount" className="space-y-4 mt-4">
                    {formData.codeType === "discount" ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="discountType">Discount Type</Label>
                            <Select
                              value={formData.discountType}
                              onValueChange={(value: any) => setFormData({ ...formData, discountType: value })}
                            >
                              <SelectTrigger data-testid="select-discount-type">
                                <SelectValue placeholder="Select discount type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="full">Full (100% Off)</SelectItem>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {formData.discountType !== "full" && (
                            <div>
                              <Label htmlFor="discountValue">
                                {formData.discountType === "percentage" ? "Percentage Off" : "Amount Off ($)"}
                              </Label>
                              <Input
                                id="discountValue"
                                type="number"
                                value={formData.discountValue}
                                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                                placeholder={formData.discountType === "percentage" ? "50" : "5"}
                                min="0"
                                max={formData.discountType === "percentage" ? "100" : undefined}
                                data-testid="input-discount-value"
                              />
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-sm text-muted-foreground">
                            Discount settings are only available for codes with type "Discount". 
                            Change the code type to "Discount" in the Basic Info tab to configure discounts.
                          </p>
                        </CardContent>
                      </Card>
                    )}
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

                  <TabsContent value="metadata" className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="metadata">Custom Variables (JSON)</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Add custom variables for email templates (e.g., teamName, coachName)
                      </p>
                      <Textarea
                        id="metadata"
                        value={formData.metadataJson}
                        onChange={(e) => setFormData({ ...formData, metadataJson: e.target.value })}
                        placeholder='{"teamName": "Eagles", "coachName": "John Smith"}'
                        className="font-mono bg-background border-border text-foreground placeholder:text-muted-foreground min-h-[200px]"
                        data-testid="input-metadata"
                      />
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
            </DialogContent>
          </Dialog>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Pre-fill Info</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Valid Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No invite codes found. Create your first code to get started.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCodes.map((code) => (
                  <TableRow key={code.id} data-testid={`row-invite-code-${code.id}`}>
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
                    <TableCell>
                      <Badge className={getCodeTypeColor(code.codeType)} data-testid={`badge-type-${code.id}`}>
                        {code.codeType}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" data-testid={`text-description-${code.id}`}>
                      {code.description || "-"}
                    </TableCell>
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
                        {/* Show "Completed" when usage is full, otherwise Active/Inactive */}
                        {code.maxUses !== null && (code.currentUses || 0) >= code.maxUses ? (
                          <Badge variant="default" className="bg-blue-500" data-testid={`badge-completed-${code.id}`}>
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant={code.isActive ? "default" : "secondary"} className={code.isActive ? "bg-green-500" : "bg-gray-500"} data-testid={`badge-active-${code.id}`}>
                            {code.isActive ? "Active" : "Inactive"}
                          </Badge>
                        )}
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
                        {!code.isDefault && (
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
        </div>

        {inviteCodes.length > 10 && (
          <Pagination
            totalItems={inviteCodes.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
      </div>

      <AlertDialog open={!!setDefaultId} onOpenChange={(open) => !open && setSetDefaultId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set as Default Invite Code</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to set this as your tenant's default invite code? 
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
