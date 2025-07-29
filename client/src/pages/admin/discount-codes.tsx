import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "@/components/admin-layout";
import { format } from "date-fns";
import { Plus, Trash2, Edit, Copy } from "lucide-react";
import type { DiscountCode } from "@shared/schema";

export default function DiscountCodes() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "full",
    discountValue: 0,
    maxUses: null as number | null,
    validFrom: "",
    validUntil: "",
    isActive: true,
  });

  const { data: discountCodes = [], isLoading } = useQuery<DiscountCode[]>({
    queryKey: ["/api/admin/discount-codes"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/discount-codes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discount-codes"] });
      toast({ title: "Discount code created successfully" });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create discount code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PUT", `/api/admin/discount-codes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discount-codes"] });
      toast({ title: "Discount code updated successfully" });
      setEditingCode(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update discount code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/admin/discount-codes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/discount-codes"] });
      toast({ title: "Discount code deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete discount code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discountType: "full",
      discountValue: 0,
      maxUses: null,
      validFrom: "",
      validUntil: "",
      isActive: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCode) {
      updateMutation.mutate({
        id: editingCode.id,
        data: {
          ...formData,
          maxUses: formData.maxUses || null,
          validFrom: formData.validFrom || null,
          validUntil: formData.validUntil || null,
        },
      });
    } else {
      createMutation.mutate({
        ...formData,
        maxUses: formData.maxUses || null,
        validFrom: formData.validFrom || null,
        validUntil: formData.validUntil || null,
      });
    }
  };

  const handleEdit = (code: DiscountCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      description: code.description || "",
      discountType: code.discountType,
      discountValue: code.discountValue || 0,
      maxUses: code.maxUses,
      validFrom: code.validFrom ? format(new Date(code.validFrom), "yyyy-MM-dd'T'HH:mm") : "",
      validUntil: code.validUntil ? format(new Date(code.validUntil), "yyyy-MM-dd'T'HH:mm") : "",
      isActive: code.isActive ?? true,
    });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Code copied to clipboard" });
  };

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
        <h1 className="text-xl sm:text-3xl font-bold text-white">Discount Codes</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} size="sm" className="self-start sm:self-auto">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Create Discount Code</span>
              <span className="sm:hidden">Create Code</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Discount Code</DialogTitle>
              <DialogDescription>
                Create a new discount code for parents to use during checkout
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Discount Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="SUMMER2025"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value) => setFormData({ ...formData, discountType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full (100% Off)</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                  />
                </div>
              )}

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summer camp discount for early registration"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxUses">Max Uses (leave empty for unlimited)</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    value={formData.maxUses || ""}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? Number(e.target.value) : null })}
                    placeholder="100"
                    min="1"
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="validFrom">Valid From (optional)</Label>
                  <Input
                    id="validFrom"
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="validUntil">Valid Until (optional)</Label>
                  <Input
                    id="validUntil"
                    type="datetime-local"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Code"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Discount Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Valid Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discountCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono font-bold">{code.code}</TableCell>
                    <TableCell className="capitalize">{code.discountType}</TableCell>
                    <TableCell>
                      {code.discountType === "full"
                        ? "100%"
                        : code.discountType === "percentage"
                        ? `${code.discountValue}%`
                        : `$${(code.discountValue || 0) / 100}`}
                    </TableCell>
                    <TableCell>
                      {code.currentUses} / {code.maxUses || "∞"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {code.validFrom && (
                          <div>From: {format(new Date(code.validFrom), "MMM d, yyyy")}</div>
                        )}
                        {code.validUntil && (
                          <div>Until: {format(new Date(code.validUntil), "MMM d, yyyy")}</div>
                        )}
                        {!code.validFrom && !code.validUntil && <div>Always valid</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          code.isActive
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {code.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(code.code)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(code)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit Discount Code</DialogTitle>
                              <DialogDescription>
                                Update the discount code settings
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="edit-code">Discount Code</Label>
                                  <Input
                                    id="edit-code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    required
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-discountType">Discount Type</Label>
                                  <Select
                                    value={formData.discountType}
                                    onValueChange={(value) => setFormData({ ...formData, discountType: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="full">Full (100% Off)</SelectItem>
                                      <SelectItem value="percentage">Percentage</SelectItem>
                                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {formData.discountType !== "full" && (
                                <div>
                                  <Label htmlFor="edit-discountValue">
                                    {formData.discountType === "percentage" ? "Percentage Off" : "Amount Off ($)"}
                                  </Label>
                                  <Input
                                    id="edit-discountValue"
                                    type="number"
                                    value={formData.discountValue}
                                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                                    min="0"
                                    max={formData.discountType === "percentage" ? "100" : undefined}
                                  />
                                </div>
                              )}

                              <div>
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea
                                  id="edit-description"
                                  value={formData.description}
                                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="edit-maxUses">Max Uses</Label>
                                  <Input
                                    id="edit-maxUses"
                                    type="number"
                                    value={formData.maxUses || ""}
                                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? Number(e.target.value) : null })}
                                    min="1"
                                  />
                                </div>
                                <div className="flex items-end">
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      id="edit-isActive"
                                      checked={formData.isActive}
                                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                    />
                                    <Label htmlFor="edit-isActive">Active</Label>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="edit-validFrom">Valid From</Label>
                                  <Input
                                    id="edit-validFrom"
                                    type="datetime-local"
                                    value={formData.validFrom}
                                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-validUntil">Valid Until</Label>
                                  <Input
                                    id="edit-validUntil"
                                    type="datetime-local"
                                    value={formData.validUntil}
                                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end space-x-2">
                                <Button type="button" variant="outline" onClick={() => setEditingCode(null)}>
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={updateMutation.isPending}>
                                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this discount code?")) {
                              deleteMutation.mutate(code.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {discountCodes.length === 0 ? (
              <div className="text-center text-zinc-400 py-8">
                No discount codes created yet
              </div>
            ) : (
              discountCodes.map((code) => (
                <div key={code.id} className="bg-zinc-800 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-mono font-bold text-white text-lg truncate">{code.code}</h3>
                      <p className="text-zinc-400 text-sm capitalize">{code.discountType} discount</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs shrink-0 ${
                        code.isActive
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {code.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Value:</span>
                      <span className="text-zinc-300 font-medium">
                        {code.discountType === "full"
                          ? "100%"
                          : code.discountType === "percentage"
                          ? `${code.discountValue}%`
                          : `$${(code.discountValue || 0) / 100}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Uses:</span>
                      <span className="text-zinc-300">{code.currentUses} / {code.maxUses || "∞"}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Valid:</span>
                      <div className="text-zinc-300 text-right">
                        {code.validFrom && (
                          <div>From: {format(new Date(code.validFrom), "MMM d")}</div>
                        )}
                        {code.validUntil && (
                          <div>Until: {format(new Date(code.validUntil), "MMM d")}</div>
                        )}
                        {!code.validFrom && !code.validUntil && <div>Always</div>}
                      </div>
                    </div>
                    {code.description && (
                      <div className="mt-2">
                        <p className="text-zinc-300 text-xs">{code.description}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(code.code)}
                      className="text-xs px-3 py-1 h-7"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(code)}
                            className="text-xs px-2 py-1 h-7"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Discount Code</DialogTitle>
                            <DialogDescription>
                              Update the discount code settings
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="edit-code">Discount Code</Label>
                                <Input
                                  id="edit-code"
                                  value={formData.code}
                                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-discountType">Discount Type</Label>
                                <Select
                                  value={formData.discountType}
                                  onValueChange={(value) => setFormData({ ...formData, discountType: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="full">Full (100% Off)</SelectItem>
                                    <SelectItem value="percentage">Percentage</SelectItem>
                                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {formData.discountType !== "full" && (
                              <div>
                                <Label htmlFor="edit-discountValue">
                                  {formData.discountType === "percentage" ? "Percentage Off" : "Amount Off ($)"}
                                </Label>
                                <Input
                                  id="edit-discountValue"
                                  type="number"
                                  value={formData.discountValue}
                                  onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                                  min="0"
                                  max={formData.discountType === "percentage" ? "100" : undefined}
                                />
                              </div>
                            )}

                            <div>
                              <Label htmlFor="edit-description">Description</Label>
                              <Textarea
                                id="edit-description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="edit-maxUses">Max Uses</Label>
                                <Input
                                  id="edit-maxUses"
                                  type="number"
                                  value={formData.maxUses || ""}
                                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? Number(e.target.value) : null })}
                                  min="1"
                                />
                              </div>
                              <div className="flex items-end">
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id="edit-isActive"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                  />
                                  <Label htmlFor="edit-isActive">Active</Label>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="edit-validFrom">Valid From</Label>
                                <Input
                                  id="edit-validFrom"
                                  type="datetime-local"
                                  value={formData.validFrom}
                                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-validUntil">Valid Until</Label>
                                <Input
                                  id="edit-validUntil"
                                  type="datetime-local"
                                  value={formData.validUntil}
                                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                />
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                              <Button type="button" variant="outline" onClick={() => setEditingCode(null)} className="w-full sm:w-auto">
                                Cancel
                              </Button>
                              <Button type="submit" disabled={updateMutation.isPending} className="w-full sm:w-auto">
                                {updateMutation.isPending ? "Saving..." : "Save Changes"}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this discount code?")) {
                            deleteMutation.mutate(code.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-300 text-xs px-2 py-1 h-7"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}