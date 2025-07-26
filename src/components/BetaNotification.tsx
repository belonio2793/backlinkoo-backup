import { useState, useMemo } from "react";
import { X, Beaker } from "lucide-react";
import { Button } from "@/components/ui/button";

export const BetaNotification = () => {
  const [isVisible, setIsVisible] = useState(true);

  const randomBackgroundClass = useMemo(() => {
    const gradients = [
      "bg-gradient-to-r from-orange-500 to-amber-500",
      "bg-gradient-to-r from-purple-500 to-pink-500",
      "bg-gradient-to-r from-blue-500 to-cyan-500",
      "bg-gradient-to-r from-green-500 to-emerald-500",
      "bg-gradient-to-r from-red-500 to-rose-500",
      "bg-gradient-to-r from-indigo-500 to-purple-500",
      "bg-gradient-to-r from-teal-500 to-green-500",
      "bg-gradient-to-r from-yellow-500 to-orange-500",
      "bg-gradient-to-r from-pink-500 to-red-500",
      "bg-gradient-to-r from-cyan-500 to-blue-500",
      "bg-gradient-to-r from-violet-500 to-indigo-500",
      "bg-gradient-to-r from-lime-500 to-teal-500"
    ];

    return gradients[Math.floor(Math.random() * gradients.length)];
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`${randomBackgroundClass} text-white px-4 py-2 relative z-50`}>
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Beaker className="h-4 w-4" />
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
