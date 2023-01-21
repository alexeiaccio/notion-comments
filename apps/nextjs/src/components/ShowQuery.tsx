import { Show } from "@notion-comments/ui";
import { useState } from "react";

export function ShowQuery<T>({
  when,
  children,
  fallback,
  errorElement,
}: {
  when: () => Promise<T>;
  children: ((data: T) => React.ReactNode) | React.ReactNode;
  fallback?: React.ReactNode;
  errorElement?: (props: {
    error: Error;
    resetErrorBoundary: (...args: Array<unknown>) => void;
  }) => React.ReactElement | null;
}) {
  const [promise, setPromise] = useState<Promise<T>>(when());

  return (
    <Show
      when={promise}
      fallback={fallback}
      errorElement={
        errorElement
          ? (error) => (
              <>
                {errorElement?.({
                  error,
                  resetErrorBoundary: () => setPromise(when()),
                })}
              </>
            )
          : undefined
      }
    >
      {(data: T) => (
        <>{typeof children === "function" ? children(data) : children}</>
      )}
    </Show>
  );
}
