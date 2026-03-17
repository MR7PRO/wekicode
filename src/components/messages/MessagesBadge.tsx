import { MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/hooks/useMessages";
import { motion, AnimatePresence } from "framer-motion";

export function MessagesBadge() {
  const { totalUnread } = useMessages();

  return (
    <Link to="/messages">
      <Button variant="ghost" size="icon" className="relative">
        <MessageSquare className="w-5 h-5" />
        <AnimatePresence>
          {totalUnread > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive flex items-center justify-center"
            >
              <span className="text-[10px] font-bold text-destructive-foreground">
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </Link>
  );
}
