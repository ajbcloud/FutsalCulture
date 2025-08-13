import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingCart, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";

export default function CartButton() {
  const { cartItems, removeFromCart, clearCart, totalPrice, itemCount } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  if (itemCount === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 shadow-lg z-50 h-14 px-6"
          size="lg"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Checkout ({itemCount})
          <Badge className="ml-2 bg-white text-blue-600">
            ${(totalPrice / 100).toFixed(2)}
          </Badge>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="bg-zinc-900 border-zinc-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Cart Summary</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {cartItems.map((session) => (
            <div key={session.id} className="bg-zinc-800 border border-zinc-600 p-3 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-white text-sm">{session.title}</h4>
                  <p className="text-zinc-400 text-xs">{session.location}</p>
                  <p className="text-zinc-400 text-xs">{session.ageGroups?.join(', ') || 'All Ages'}</p>
                  <p className="text-blue-400 text-sm font-medium">
                    ${(session.priceCents / 100).toFixed(2)}
                  </p>
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
          ))}
          
          <div className="border-t border-zinc-600 pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-white font-medium">Total:</span>
              <span className="text-blue-400 font-bold text-lg">
                ${(totalPrice / 100).toFixed(2)}
              </span>
            </div>
            
            <div className="space-y-2">
              <Link href="/multi-checkout">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => setIsOpen(false)}
                >
                  Proceed to Checkout
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full border-zinc-600 text-zinc-400 hover:text-white"
                onClick={() => {
                  clearCart();
                  setIsOpen(false);
                }}
              >
                Clear Cart
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}