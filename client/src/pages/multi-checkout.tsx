import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Clock, MapPin, DollarSign, Tag } from "lucide-react";
import type { Player } from "@shared/schema";

export default function MultiCheckout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { cartItems, removeFromCart, clearCart, totalPrice } = useCart();
  const { toast } = useToast();
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [discountError, setDiscountError] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<Record<string, string>>({});

  // Fetch players for discount validation
  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  // Calculate discount amount
  const calculateDiscountAmount = () => {
    if (!appliedDiscount) return 0;
    
    switch (appliedDiscount.discountType) {
      case 'full':
        return totalPrice;
      case 'percentage':
        return Math.round(totalPrice * (appliedDiscount.discountValue / 100));
      case 'fixed':
        return Math.min(appliedDiscount.discountValue * 100, totalPrice); // Convert to cents
      default:
        return 0;
    }
  };

  const discountAmount = calculateDiscountAmount();
  const finalTotal = totalPrice - discountAmount;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const applyDiscountMutation = useMutation({
    mutationFn: async () => {
      // Use the first selected player for discount validation
      const firstPlayerId = Object.values(selectedPlayers)[0];
      const response = await apiRequest("POST", "/api/checkout/apply-discount", {
        code: discountCode,
        playerId: firstPlayerId
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAppliedDiscount(data.discountCode);
      setDiscountError("");
      toast({
        title: "Discount applied",
        description: `${discountCode} discount has been applied successfully`,
      });
    },
    onError: (error: any) => {
      setDiscountError(error.message || "Invalid discount code");
      setAppliedDiscount(null);
    },
  });

  const createMultiCheckoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/multi-checkout", {
        sessions: cartItems.map(session => ({ 
          sessionId: session.id,
          playerId: selectedPlayers[session.id] || players[0]?.id
        })),
        discountCode: appliedDiscount?.code,
        discountAmount: discountAmount
      });
      return response.json();
    },
    onSuccess: (data) => {
      clearCart();
      toast({
        title: "Success",
        description: "All sessions booked successfully!",
      });
      // Redirect to dashboard
      window.location.href = "/dashboard";
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to process checkout",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-zinc-400 mb-8">Add some sessions to your cart to proceed with checkout.</p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <a href="/sessions">Browse Sessions</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout Summary</h1>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sessions List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Selected Sessions ({cartItems.length})</h2>
            
            {cartItems.map((session) => (
              <Card key={session.id} className="bg-zinc-900 border border-zinc-700">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{session.title}</h3>
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center text-zinc-400 text-sm">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{session.location}</span>
                        </div>
                        <div className="flex items-center text-zinc-400 text-sm">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>
                            {new Date(session.startTime).toLocaleString([], {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center text-zinc-400 text-sm">
                          <Badge variant="outline" className="text-zinc-400 border-zinc-600">
                            {Array.isArray(session.ageGroups) ? session.ageGroups.join(', ') : session.ageGroups}
                          </Badge>
                        </div>
                        
                        {/* Player Selection */}
                        <div className="mt-3">
                          <Label htmlFor={`player-${session.id}`} className="text-sm text-zinc-400">
                            Select Player:
                          </Label>
                          <Select 
                            value={selectedPlayers[session.id] || ""}
                            onValueChange={(value) => setSelectedPlayers(prev => ({ ...prev, [session.id]: value }))}
                          >
                            <SelectTrigger className="w-full mt-1 bg-zinc-800 border-zinc-600">
                              <SelectValue placeholder="Choose player" />
                            </SelectTrigger>
                            <SelectContent>
                              {players.map((player) => (
                                <SelectItem key={player.id} value={player.id}>
                                  {player.firstName} {player.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center text-blue-400 font-semibold mb-2">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span>${(session.priceCents / 100).toFixed(2)}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(session.id)}
                        className="text-zinc-400 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <Card className="bg-zinc-900 border border-zinc-700 sticky top-8">
              <CardHeader>
                <CardTitle className="text-white">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-zinc-400">
                    <span>Sessions ({cartItems.length})</span>
                    <span>${(totalPrice / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Processing fee</span>
                    <span>$0.00</span>
                  </div>
                  {appliedDiscount && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount ({appliedDiscount.code})</span>
                      <span>-${(discountAmount / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-zinc-600 pt-2">
                    <div className="flex justify-between text-white font-semibold text-lg">
                      <span>Total</span>
                      <span>${(finalTotal / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Discount Code Section */}
                <div className="border-t border-zinc-600 pt-4">
                  <h3 className="text-white font-medium mb-3 flex items-center">
                    <Tag className="w-4 h-4 mr-2" />
                    Discount Code
                  </h3>
                  
                  {!appliedDiscount ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter discount code"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                          className="flex-1 bg-zinc-800 border-zinc-600 text-white"
                        />
                        <Button
                          onClick={() => applyDiscountMutation.mutate()}
                          disabled={!discountCode.trim() || applyDiscountMutation.isPending || Object.keys(selectedPlayers).length === 0}
                          variant="outline"
                          className="border-zinc-600 text-zinc-400 hover:text-white"
                        >
                          {applyDiscountMutation.isPending ? "..." : "Apply"}
                        </Button>
                      </div>
                      {discountError && (
                        <p className="text-red-400 text-sm">{discountError}</p>
                      )}
                      {Object.keys(selectedPlayers).length === 0 && (
                        <p className="text-yellow-400 text-sm">Please select a player for each session to apply discount codes</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-zinc-800 p-3 rounded-md">
                      <div>
                        <span className="text-green-400 font-medium">{appliedDiscount.code}</span>
                        <p className="text-zinc-400 text-sm">
                          {appliedDiscount.discountType === 'full' ? '100% off' :
                           appliedDiscount.discountType === 'percentage' ? `${appliedDiscount.discountValue}% off` :
                           `$${(appliedDiscount.discountValue / 100).toFixed(2)} off`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAppliedDiscount(null);
                          setDiscountCode("");
                          setDiscountError("");
                        }}
                        className="text-zinc-400 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3 pt-4">
                  <Button 
                    onClick={() => createMultiCheckoutMutation.mutate()}
                    disabled={createMultiCheckoutMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {createMultiCheckoutMutation.isPending ? "Processing..." : "Proceed to Payment"}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-zinc-600 text-zinc-400 hover:text-white"
                    asChild
                  >
                    <a href="/sessions">Continue Shopping</a>
                  </Button>
                </div>
                
                <div className="text-xs text-zinc-500 pt-4">
                  <p>Payment will be processed securely through Stripe.</p>
                  <p className="mt-2">You will receive email confirmation after successful payment.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}