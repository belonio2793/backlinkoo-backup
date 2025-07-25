import { useState } from "react";
import { X, Flask } from "lucide-react";
import { Button } from "@/components/ui/button";

export const BetaNotification = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 relative z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Flask className="h-4 w-4" />
          <span>
            <strong>BETA</strong> - We're actively developing and building our application live!
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="text-white hover:text-white hover:bg-white/20 h-auto p-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
