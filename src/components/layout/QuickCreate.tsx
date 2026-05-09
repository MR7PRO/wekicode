import { Plus, HelpCircle, FileText, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function QuickCreate() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 border-primary/40 hover:bg-primary/10"
          aria-label="إنشاء سريع"
        >
          <Plus className="w-4 h-4 text-primary" />
          <span>إنشاء</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          إنشاء جديد
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/questions" className="cursor-pointer">
            <HelpCircle className="w-4 h-4 ml-2 text-primary" />
            سؤال جديد
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/articles" className="cursor-pointer">
            <FileText className="w-4 h-4 ml-2 text-primary" />
            مقال جديد
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/jobs" className="cursor-pointer">
            <Briefcase className="w-4 h-4 ml-2 text-primary" />
            وظيفة / مشروع
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
