import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SubscriptionUpgradeBannerProps {
  isAnimating: boolean;
  plan: string | null;
  onClose: () => void;
}

export function SubscriptionUpgradeBanner({ isAnimating, plan, onClose }: SubscriptionUpgradeBannerProps) {
  if (!isAnimating || !plan) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-4 rounded-lg shadow-lg min-w-[320px]">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-5 h-5" />
            </motion.div>
            
            <div className="flex-1">
              <div className="font-semibold">
                🎉 Upgrading to {plan?.toUpperCase()} Plan
              </div>
              <div className="text-sm text-green-100">
                Activating your new features...
              </div>
            </div>
            
            <Button
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 w-6 h-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Animated progress bar */}
          <div className="mt-3 bg-white/20 rounded-full h-1 overflow-hidden">
            <motion.div
              className="bg-white h-full rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, ease: "linear" }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function SubscriptionSuccessBanner({ plan, onClose }: { plan: string | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg shadow-lg min-w-[320px]">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="w-5 h-5" />
            </motion.div>
            
            <div className="flex-1">
              <div className="font-semibold">
                ✅ {plan?.toUpperCase()} Plan Activated!
              </div>
              <div className="text-sm text-green-100">
                All your new features are now available.
              </div>
            </div>
            
            <Button
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 w-6 h-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}