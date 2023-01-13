import React, { Suspense } from "react";

export interface ShowProps<T = any> {
  when: TrackedPromise<T> | T;
  children: React.ReactNode | AwaitResolveRenderFunction<T>;
  errorElement?: React.ReactNode | AwaitResolveRenderFunction<unknown>;
  fallback?: React.ReactNode;
}

/**
 * Component to use for rendering the value of a Promise.
 *
 * @example
 *
 *  <Show when={somePromise}>
 *    {(res: Awaited<typeof somePromise>) => <div>{res.data}</div>}
 *  </Show>
 *
 * Also you can get access to error in the `errorElement` prop.
 *
 * @example
 *
 *  <Show
 *    when={somePromise}
 *    errorElement={(e: unknown) => <div>{e.message}</div>}
 *  >
 *    {...}
 *  </Show>
 *
 * And you can get access to promise data in child component via `useAsyncData` hook.
 *
 * @example
 *
 *  <Show when={somePromise}>
 *    <ChildComponent />
 *  </Show>
 *
 * then in `ChildComponent`:
 *
 *  function ChildComponent() {
 *    const data: unknown = useAsyncData();
 *    return <div>{data.data}</div>;
 *  }
 *
 * Based on `Await` component from `@remix-run/react-router`
 * @see https://github.com/remix-run/react-router
 */
export function Show<T = any>(props: ShowProps<T>) {
  return (
    <Suspense fallback={props.fallback}>
      <AwaitErrorBoundary
        resolve={props.when}
        errorElement={<ResolveError>{props.errorElement}</ResolveError>}
      >
        <ResolveAwait<T>>{props.children}</ResolveAwait>
      </AwaitErrorBoundary>
    </Suspense>
  );
}

/**
 * Component to use for rendering the value of a Promise.
 *
 * @example
 *
 *  <Suspense fallback={<div>Loading...</div>}>
 *   <Await resolve={somePromise}>
 *     {(res: Awaited<typeof somePromise>) => <div>{res.data}</div>}
 *   </Await>
 *  </Suspense>
 *
 * Based on `Await` component from `@remix-run/react-router`
 * @see https://github.com/remix-run/react-router
 */
export interface AwaitProps<T = any> {
  resolve: TrackedPromise<T> | T;
  children: React.ReactNode | AwaitResolveRenderFunction<T>;
  errorElement?: React.ReactNode | AwaitResolveRenderFunction<unknown>;
}
export function Await<T = any>(props: AwaitProps<T>) {
  return (
    <AwaitErrorBoundary
      resolve={props.resolve}
      errorElement={<ResolveError>{props.errorElement}</ResolveError>}
    >
      <ResolveAwait<T>>{props.children}</ResolveAwait>
    </AwaitErrorBoundary>
  );
}

interface TrackedPromise<T = any> extends Promise<T> {
  _tracked?: boolean;
  _data?: T;
  _error?: any;
}

class AbortedDeferredError extends Error {}

const AwaitContext = React.createContext<TrackedPromise | null>(null);
AwaitContext.displayName = "Await";

/**
 * Returns the happy-path data from the nearest ancestor <Await /> value
 */
export function useAsyncValue<T = any>(): Awaited<T> {
  const value = React.useContext(AwaitContext);
  return value?._data as Awaited<T>;
}

/**
 * Returns the error from the nearest ancestor <Await /> value
 */
export function useAsyncError(): unknown {
  const value = React.useContext(AwaitContext);
  return value?._error;
}

interface AwaitResolveRenderFunction<T = any> {
  (data: Awaited<T>): React.ReactElement;
}

type AwaitErrorBoundaryProps = React.PropsWithChildren<{
  errorElement?: React.ReactNode;
  resolve: TrackedPromise | any;
}>;

type AwaitErrorBoundaryState = {
  error: any;
};

enum AwaitRenderStatus {
  pending,
  success,
  error,
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const neverSettledPromise = new Promise(() => {});

class AwaitErrorBoundary extends React.Component<
  AwaitErrorBoundaryProps,
  AwaitErrorBoundaryState
> {
  constructor(props: AwaitErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error(
      "<Await> caught the following error during render",
      error,
      errorInfo,
    );
  }

  render() {
    const { children, errorElement, resolve } = this.props;

    let promise: TrackedPromise | null = null;
    let status: AwaitRenderStatus = AwaitRenderStatus.pending;

    if (!(resolve instanceof Promise)) {
      // Didn't get a promise - provide as a resolved promise
      status = AwaitRenderStatus.success;
      promise = Promise.resolve();
      Object.defineProperty(promise, "_tracked", { get: () => true });
      Object.defineProperty(promise, "_data", { get: () => resolve });
    } else if (this.state.error) {
      // Caught a render error, provide it as a rejected promise
      status = AwaitRenderStatus.error;
      const renderError = this.state.error;
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      promise = Promise.reject().catch(() => {}); // Avoid unhandled rejection warnings
      Object.defineProperty(promise, "_tracked", { get: () => true });
      Object.defineProperty(promise, "_error", { get: () => renderError });
    } else if ((resolve as TrackedPromise)._tracked) {
      // Already tracked promise - check contents
      promise = resolve;
      status =
        promise._error !== undefined
          ? AwaitRenderStatus.error
          : promise._data !== undefined
          ? AwaitRenderStatus.success
          : AwaitRenderStatus.pending;
    } else {
      // Raw (untracked) promise - track it
      status = AwaitRenderStatus.pending;
      Object.defineProperty(resolve, "_tracked", { get: () => true });
      promise = resolve.then(
        (data: any) =>
          Object.defineProperty(resolve, "_data", { get: () => data }),
        (error: any) =>
          Object.defineProperty(resolve, "_error", { get: () => error }),
      );
    }

    if (
      status === AwaitRenderStatus.error &&
      promise._error instanceof AbortedDeferredError
    ) {
      // Freeze the UI by throwing a never resolved promise
      throw neverSettledPromise;
    }

    if (status === AwaitRenderStatus.error && !errorElement) {
      // No errorElement, throw to the nearest route-level error boundary
      throw promise._error;
    }

    if (status === AwaitRenderStatus.error) {
      // Render via our errorElement
      return <AwaitContext.Provider value={promise} children={errorElement} />;
    }

    if (status === AwaitRenderStatus.success) {
      // Render children with resolved value
      return <AwaitContext.Provider value={promise} children={children} />;
    }

    // Throw to the suspense boundary
    throw promise;
  }
}

/**
 * @private
 * Indirection to leverage useAsyncValue for a render-prop API on <Await>
 */
function ResolveAwait<T = any>({
  children,
}: {
  children: React.ReactNode | AwaitResolveRenderFunction<T>;
}) {
  const data = useAsyncValue<T>();
  if (typeof children === "function") {
    return children(data);
  }
  return <>{children}</>;
}

/**
 * @private
 * Indirection to leverage useAsyncError for a render-prop API on <Await>
 */
function ResolveError({
  children,
}: {
  children: React.ReactNode | AwaitResolveRenderFunction;
}) {
  const data = useAsyncError();
  if (typeof children === "function") {
    return children(data);
  }
  return <>{children}</>;
}
