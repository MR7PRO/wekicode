import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, info.componentStack);
    } else {
      // TODO(Phase 7): forward to an external monitoring service.
      console.error("[ErrorBoundary]", error.message);
    }
  }

  private handleRetry = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        dir="rtl"
        className="min-h-[60vh] flex items-center justify-center px-4 py-16"
      >
        <div className="max-w-md w-full text-center space-y-4 rounded-xl border border-border bg-card p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            {this.props.fallbackTitle ?? "حدث خطأ غير متوقع."}
          </h2>
          <p className="text-sm text-muted-foreground">
            تعذر تحميل البيانات. حاول مرة أخرى.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="max-h-40 overflow-auto rounded-md bg-muted p-3 text-right text-xs text-muted-foreground">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Button onClick={this.handleRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              حاول مرة أخرى
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <a href="/">
                <Home className="h-4 w-4" aria-hidden="true" />
                العودة للرئيسية
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;