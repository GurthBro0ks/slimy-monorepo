import { ComingSoon } from "@/components/ui/coming-soon";
import { FileText } from "lucide-react";

export default function DocsPage() {
  return (
    <ComingSoon
      title="DOCUMENTATION"
      description="Comprehensive guides, API docs, and developer resources."
      icon={<FileText size={48} />}
    />
  );
}
