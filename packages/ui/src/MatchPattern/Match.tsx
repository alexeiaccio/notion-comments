import type { CollectionItemOptions } from "ariakit";
import {
  useControlledState,
  useForkRef,
  useInitialValue,
  useSafeLayoutEffect,
} from "ariakit-react-utils/hooks";
import {
  createStoreContext,
  useStore,
  useStoreProvider,
  useStorePublisher,
} from "ariakit-react-utils/store";
import type { SetState } from "ariakit-utils/types";
import { hasOwnProperty, noop } from "ariakit-utils/misc";
import {
  CollectionState,
  useCollectionState,
} from "ariakit/collection/collection-state";
import React, { useMemo, useRef } from "react";
import { matchPattern, symbols } from "./ts-pattern/internals";
import { P } from "./ts-pattern";

interface MatchProps<T = any> {
  state: MatchState<T>;
  expression: T | undefined;
  children: Children;
}

/**
 * Use the `expression` prop with `<Match>` element to conditionally include
 * certain elements. When an `<Match>` compares a value from `<With>` and the
 * comparison is _truthy_ it _only_ renders the matching child. However, when
 * the comparison is _falsey_ it continues through the children until it finds
 * a match, or falls back to `<Otherwise>`.
 *
 * For pattern-matching we use `ts-pattern`:
 * @see https://github.com/gvergnaud/ts-pattern
 *
 * For full type-safety create `Match` with `createMatch<UnionOfAllOptions>()`
 *
 * @example
 *
 *   type State<T> = | { status: "idle" } | { status: "loading" } | { status: "success"; data: T } | { status: "error"; error: Error };
 *
 *   const Match = createMatch<State>();
 *
 *   <Match.Root expression={state}>
 *      <Match.With pattern={{ status: "error" }}>
 *        {({ error }) => <p>Error! "{error.message}"</p>)}
 *      </Match.With>
 *      <Match.With pattern={{ status: "success" }}>
 *         {({ data }) => <p>Success! data: {data.value}</p>)}
 *            // ^? {data.value} – argument type infers correctly.
 *      </Match.With>
 *      <Match.With pattern={{ status: "idle" }}>
 *        {() => <p>Nothing is happening at the moment</p>}
 *      </Match.With>
 *      <Match.With pattern={{ status: "loading" }}>
 *        {() => <p>Loading... (you can click on success, error, or cancel)</p>)}
 *      </Match.With>
 *  </Match.Root>
 *
 * Or just like the example below:
 *
 * @example
 *
 *   <Match expression={"blue"}>
 *       <With pattern={"red"}>
 *           red
 *       </With>
 *       <With pattern={"green"}>
 *           green
 *       </With>
 *       <With pattern={"blue"}>
 *           blue
 *       </With>
 *        <Otherwise>
 *           no color
 *       </Otherwise>
 *   </Match>
 *
 * Alternatively, you can provide `then` as props to `<With>` or `<Otherwise>`
 *
 * @example
 *
 *   <Match expression={"hot fucking pink"}>
 *       <With pattern={"red"} then={"red"} />
 *       <With pattern={"red"} then={"green"} />
 *       <With pattern={"red"} then={"blue"} />
 *       <Otherwise then={"no color"} />
 *   </Match>
 *
 */
export function Match<T = any>({ state, ...props }: MatchProps<T>) {
  const { wrapElement } = useStoreProvider({ state, ...props }, MatchContext);

  return wrapElement(<>{props.children}</>);
}
if (process.env.NODE_ENV !== "production") {
  Match.displayName = "Match";
}

type WithProps<TPattern = any, TData = any> = Omit<
  CollectionItemOptions,
  "state"
> & {
  state?: MatchState<TPattern>;
  pattern: TPattern | TPattern[];
  guard?: (value: TPattern) => unknown;
  handler?: (arg: TData) => Children;
  children?: (arg: TData) => Children;
};

export function With<T = any>({
  state: stateProp,
  pattern,
  guard,
  handler,
  children,
  ...props
}: WithProps<T>) {
  const state = useStore(stateProp || MatchContext, ["value", "registerItem"]);
  const matcher = useMemo(() => {
    const patterns = Array.isArray(pattern) ? pattern : [pattern];
    const predicates = guard ? (Array.isArray(guard) ? guard : [guard]) : [];
    return {
      match: (value: T) => {
        const selected: Record<string, unknown> = {};
        const matched = Boolean(
          patterns.some((pattern) =>
            matchPattern(pattern, value, (key, value) => {
              selected[key] = value;
            }),
          ) && predicates.every((predicate) => predicate(value as any)),
        );
        return {
          matched,
          value:
            matched && Object.keys(selected).length
              ? symbols.anonymousSelectKey in selected
                ? selected[symbols.anonymousSelectKey]
                : selected
              : value,
        };
      },
      handler: handler ?? children ?? noop,
    };
  }, [pattern, guard, handler, children]);

  const ref = useRef<HTMLElement>(null);
  useSafeLayoutEffect(() => {
    return state.registerItem?.({ ref });
  }, [state.registerItem]);

  const hasValue = Boolean(pattern);
  const hasHandler = Boolean(handler);
  if (!hasValue) {
    throw new TypeError("<With> requires an `pattern` prop.");
  }
  // @ts-expect-error - it's ok
  if ((hasHandler ^ Boolean(children)) === 0) {
    throw new TypeError("<With> expects either a `handler` prop or children.");
  }

  return (
    <div
      ref={useForkRef(ref)}
      style={{
        display: matcher.match(state.value)?.matched ? "block" : "none",
      }}
      {...(!matcher.match(state.value)?.matched && { "aria-hidden": true })}
      {...props}
    >
      {matcher.handler(state.value)}
    </div>
  );
}
if (process.env.NODE_ENV !== "production") {
  With.displayName = "With";
}

type OtherwiseProps<T = any> = Pick<WithProps<any, T>, "children" | "handler">;

export function Otherwise<T = any>(props: OtherwiseProps<T>) {
  return <With pattern={P._} {...props} />;
}
if (process.env.NODE_ENV !== "production") {
  Otherwise.displayName = "Otherwise";
}

const MatchContext = createStoreContext<MatchState>();

export function useMatchState<i>(props: MatchStateProps<i>) {
  const collection = useCollectionState<MatchStateItem>();
  const defaultValue = useInitialValue(
    props.defaultValue || (undefined as MatchState<i>["value"]),
  );
  const [value, setValue] = useControlledState(
    defaultValue,
    props.value,
    props.setValue,
  );

  const state = React.useMemo<MatchState<i>>(
    () => ({
      ...collection,
      value,
      setValue,
    }),
    [collection, value, setValue],
  );

  return useStorePublisher(state);
}

// function findItem(
//   items: MatchState["items"] | undefined,
//   type: MatchStateItem["type"],
// ) {
//   return items?.find((item) => item.type === type);
// }

// function useItem(state: MatchState | undefined, type: MatchStateItem["type"]) {
//   return useMemo(() => findItem(state?.items, type), [state?.items, type]);
// }

type MatchState<i = any> = CollectionState<MatchStateItem> & {
  value: i;
  setValue: SetState<MatchState<i>["value"]>;
};

type MatchStateItem = CollectionState["items"][number] & {
  type: "with" | "when" | "wildcard" | "otherwise";
  pattern: any;
  guard?: any;
  handler?: any;
  id?: string;
};

type MatchStateProps<i> = {
  defaultValue?: i;
  value?: i;
  setValue?: (values: MatchState<i>["value"]) => void;
  exhaustive?: boolean;
};

type Children = Array<React.ReactNode> | React.ReactNode;
