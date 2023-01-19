import {
  useControlledState,
  useInitialValue,
  useSafeLayoutEffect,
} from "ariakit-react-utils/hooks";
import {
  createStoreContext,
  useStore,
  useStoreProvider,
  useStorePublisher,
} from "ariakit-react-utils/store";
import type { AnyFunction, SetState } from "ariakit-utils/types";
import { noop } from "ariakit-utils/misc";
import React from "react";
import * as symbols from "../ts-pattern/internals/symbols";
import { matchPattern } from "../ts-pattern/internals/helpers";
import * as P from "../ts-pattern/patterns";
import type { Pattern } from "../ts-pattern/types/Pattern";
import type { MatchedValue } from "../ts-pattern/types/Match";
import type { FindSelected } from "../ts-pattern/types/FindSelected";
import type { InvertPattern } from "../ts-pattern/types/InvertPattern";
import type { GuardValue } from "../ts-pattern/types/helpers";

interface MatchProps<T = any> {
  state: MatchState<T>;
  value: T | undefined;
  children: Elements;
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

  return (
    <>
      {wrapElement(
        <>
          {React.Children.map(props.children, (child, id) =>
            React.cloneElement(child, { id }),
          )}
        </>,
      )}
      <Run state={state} {...props} />
    </>
  );
}
if (process.env.NODE_ENV !== "production") {
  Match.displayName = "Match";
}

/**
 * @private
 * @internal
 */
function Run({ state, ...props }: MatchProps<any>) {
  const count = React.Children.count(props.children);
  const children: Array<React.ReactNode> = [];
  React.Children.forEach(props.children, (child, i) => {
    const name =
      child &&
      typeof child === "object" &&
      "type" in child &&
      typeof child.type === "function" &&
      (("displayName" in child.type && child.type.displayName) ||
        ("name" in child.type && child.type.name));
    const withName = "With";
    const whenName = "When";
    const otherwiseName = "Otherwise";
    if (
      name !== withName &&
      name !== whenName &&
      name !== otherwiseName &&
      child !== null
    ) {
      throw new TypeError(
        "<Match> requires a child of type <With>, <When>,  <Otherwise>, or null.",
      );
    }
    if (i + 1 !== count && name === otherwiseName) {
      throw new TypeError(
        "<Otherwise> is required to be the last node if present.",
      );
    }

    const caseState = state.cases[i];
    if (!caseState) return null;
    const match = caseState.match(state.value);
    if (
      match.matched &&
      (!children.length || name !== otherwiseName || i + 1 !== count)
    ) {
      children.push(
        React.createElement(
          React.Fragment,
          { key: `${state.id}-${i}` },
          caseState.handler(match.value, state.value),
        ),
      );
    }
  });
  return <>{children}</>;
}

type WithProps<TState, TPattern extends Pattern<TState>> = {
  state?: MatchState<TState>;
  pattern: TPattern | Array<TPattern>;
  predicate?: (...args: any) => unknown;
  handler?: (...args: any) => Children;
  children?: (...args: any) => Children;
};

export function With<TState, TPattern extends Pattern<TState>>(
  props: WithProps<TState, TPattern> & PriviteProps,
) {
  const state = useStore(props.state || MatchContext, ["id", "setCases"]);
  const { pattern, predicate, handler, children, name = "With" } = props;
  const hasValue = Boolean(pattern);
  const hasHandler = Boolean(handler);
  if (!hasValue && name !== "Otherwise") {
    throw new TypeError(`<${name}> requires an 'pattern' prop.`);
  }
  // @ts-expect-error - it's ok
  if ((hasHandler ^ Boolean(children)) === 0) {
    throw new TypeError(
      `<${name}> expects either a 'handler' prop or 'children'.`,
    );
  }

  useSafeLayoutEffect(() => {
    const patterns = Array.isArray(pattern) ? pattern : [pattern];
    const predicates = predicate
      ? Array.isArray(predicate)
        ? predicate
        : [predicate]
      : [];
    const matcher = {
      name: `${name}.${state.id}.${props.id}`,
      match: (value: TPattern) => {
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
    state.setCases((prevCases: MatchState["cases"]) =>
      prevCases.every((item) => item.name !== matcher.name)
        ? [...prevCases, matcher]
        : prevCases,
    );
  }, [state.setCases, pattern]);

  return null;
}
if (process.env.NODE_ENV !== "production") {
  With.displayName = "With";
}

type WhenProps<TState> = {
  state?: MatchState<TState>;
  predicate: AnyFunction;
  handler?: (...args: any) => Children;
  children?: (...args: any) => Children;
};

export function When<TState>(props: WhenProps<TState> & PriviteProps) {
  const state = useStore(props.state || MatchContext, ["id", "setCases"]);
  const { predicate, handler, children, name = "When" } = props;
  const hasValue = Boolean(predicate);
  const hasHandler = Boolean(handler);
  if (!hasValue && name !== "Otherwise") {
    throw new TypeError(`<${name}> requires an 'predicate' prop.`);
  }
  // @ts-expect-error - it's ok
  if ((hasHandler ^ Boolean(children)) === 0) {
    throw new TypeError(
      `<${name}> expects either a 'handler' prop or 'children'.`,
    );
  }

  useSafeLayoutEffect(() => {
    const predicates = predicate
      ? Array.isArray(predicate)
        ? predicate
        : [predicate]
      : [];
    const matcher = {
      name: `${name}.${state.id}.${props.id}`,
      match: (value: TState) => {
        const selected: Record<string, unknown> = {};
        const matched = Boolean(
          predicates.every((predicate) => predicate(value as any)),
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
    state.setCases((prevCases: MatchState["cases"]) =>
      prevCases.every((item) => item.name !== matcher.name)
        ? [...prevCases, matcher]
        : prevCases,
    );
  }, [state.setCases, predicate]);

  return null;
}
if (process.env.NODE_ENV !== "production") {
  When.displayName = "When";
}

type OtherwiseProps<TState, TPattern extends Pattern<TState>> = Pick<
  WithProps<TState, TPattern>,
  "children" | "handler"
>;

export function Otherwise<TState, TPattern extends Pattern<TState>>(
  props: OtherwiseProps<TState, TPattern> & PriviteProps,
) {
  return <With pattern={P.any as any} {...props} />;
}
if (process.env.NODE_ENV !== "production") {
  Otherwise.displayName = "Otherwise";
}

const MatchContext = createStoreContext<MatchState>();

export function useMatchState<TState>(props: MatchStateProps<TState>) {
  const id = React.useId();
  const defaultValue = useInitialValue(
    props.defaultValue || (undefined as MatchState<TState>["value"]),
  );
  const [value, setValue] = useControlledState<MatchState["value"]>(
    defaultValue,
    props.value,
    props.setValue,
  );
  const [cases, setCases] = useControlledState<MatchState["cases"]>([]);

  const state = React.useMemo(
    () =>
      [
        {
          id,
          value,
          setValue,
          cases,
          setCases,
        },
        {
          With: <
            TPattern extends Pattern<TState>,
            TPredicate extends (
              value: MatchedValue<TState, InvertPattern<TPattern>>,
            ) => unknown,
            TValue extends MatchedValue<TState, InvertPattern<TPattern>>,
          >(args: {
            state?: MatchState<TState>;
            pattern: TPattern | Array<TPattern>;
            predicate?: TPredicate;
            handler?: (
              selections: FindSelected<TValue, TPattern>,
              value: TValue,
            ) => Children;
            children?: (
              selections: FindSelected<TValue, TPattern>,
              value: TValue,
            ) => Children;
          }) => <With name="With" {...args} />,
          When: <
            TPredicate extends (value: TState) => unknown,
            TValue extends GuardValue<TPredicate>,
          >(args: {
            predicate: TPredicate;
            handler?: (value: TValue) => Children;
            children?: (value: TValue) => Children;
          }) => <When name="When" {...args} />,
          Otherwise: <TPattern extends Pattern<TState>>(
            args: OtherwiseProps<TState, TPattern>,
          ) => <Otherwise name="Otherwise" {...args} />,
        },
      ] as const satisfies Readonly<[MatchState<TState>, any]>,
    [value, setValue, cases, setCases],
  );

  return useStorePublisher(state);
}

type MatchState<TValue = any> = {
  id: string;
  value: TValue;
  setValue: SetState<MatchState<TValue>["value"]>;
  cases: Array<{
    name: string;
    match: (value: any) => { matched: boolean; value: any };
    handler: (...args: any) => any;
  }>;
  setCases: SetState<MatchState<TValue>["cases"]>;
};

type MatchStateProps<TValue> = {
  defaultValue?: TValue;
  value?: TValue;
  setValue?: (values: MatchState<TValue>["value"]) => void;
  exhaustive?: boolean;
};

type PriviteProps = {
  /** @private */
  id?: number;
  /** @private */
  name?: string;
};

type Children = Array<React.ReactNode> | React.ReactNode;

type Elements = Array<React.ReactElement> | React.ReactElement;

// type XOR<T, U> = T | U extends object
//   ? (Without<T, U> & U) | (Without<U, T> & T)
//   : T | U;
// type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

// export type RenderProps<T = any> = XOR<
//   { handler: (...args: T[]) => React.ReactNode },
//   { children: (...args: T[]) => React.ReactNode }
// >;
