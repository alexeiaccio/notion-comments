import { Show } from "@notion-comments/ui";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { type ReactNode, Suspense, ReactElement } from "react";
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

// TODO: reset error boundary state in Show
export function ShowQuery<T>({
  when,
  children,
  fallback,
  fallbackRender,
}: {
  when: Promise<T> | T;
  children?: ReactNode | ((data: Awaited<T>) => React.ReactElement);
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
          <Show when={when} fallback={fallback}>
            {children}
          </Show>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
