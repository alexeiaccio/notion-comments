import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { type ReactNode, Suspense, type ReactElement } from "react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";

export function QueryBoundary({
  children,
  fallback,
  fallbackRender,
}: {
  children?: ReactNode;
  fallback?: ReactNode;
  fallbackRender?: (props: FallbackProps) => ReactElement | null;
}) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          fallbackRender={fallbackRender ?? (() => null)}
          onReset={reset}
        >
          <Suspense fallback={fallback}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
