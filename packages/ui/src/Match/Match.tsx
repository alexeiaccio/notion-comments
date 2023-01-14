import React from "react";
import { match, P, type P as PType } from "ts-pattern";

interface MatchProps<T = any> {
  expression: T | undefined;
  children: Children;
  exhaustive?: boolean;
}

/**
 * Use the `expression` prop with `<Match>` element to conditionally include
 * certain elements. When an `<Match>` compares a value from `<With>` and the
 * comparison is _truthy_ it _only_ renders the matching child. However, when
 * the comparison is _falsey_ it continues through the children until it finds
 * a match, or falls back to `<Default>`.
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
 *   </Match>
 *
 * @example
 *
 *   <Match expression={"hot fucking pink"}>
 *       <With pattern={"red"}>
 *           red
 *       </With>
 *       <With pattern={"green"}>
 *           green
 *       </With>
 *       <With pattern={"blue"}>
 *           blue
 *       </With>
 *       <Default>
 *           no color
 *       </Default>
 *   </Match>
 *
 *
 * Alternatively, you can provide `then` as props to `<With>` or `<Default>`
 *
 * @example
 *
 *   <Match expression={"hot fucking pink"}>
 *       <With pattern={"red"} then={"red"} />
 *       <With pattern={"red"} then={"green"} />
 *       <With pattern={"red"} then={"blue"} />
 *       <Default then={"no color"} />
 *   </Match>
 *
 */
export function Match<T = any>(props: MatchProps<T>) {
  const count = React.Children.count(props.children);

  const hasExpression = props.hasOwnProperty("expression");
  if (!hasExpression) {
    throw new TypeError("<Match> requires an `expression` prop.");
  }

  let matcher = match<any, any>(props.expression);

  React.Children.forEach(props.children, (child, i) => {
    const type =
      child &&
      typeof child === "object" &&
      "type" in child &&
      typeof child.type === "function" &&
      (("displayName" in child.type && child.type.displayName) ||
        ("name" in child.type && child.type.name));

    if (
      type !== With.displayName &&
      type !== Default.displayName &&
      child !== null
    ) {
      throw new TypeError(
        "<Match> requires a child of type <With>, <Default>, or null.",
      );
    }

    if (child && typeof child === "object" && "props" in child) {
      matcher = matcher.with(
        child.props.pattern as P.Pattern<T>,
        child.props.then
          ? typeof child.props.then === "function"
            ? child.props.then
            : () => child.props.then
          : typeof child.props.children === "function"
          ? child.props.children
          : () => child.props.children,
      );
    }

    if (i + 1 === count) {
      if (type === Default.displayName) {
        if (child && typeof child === "object" && "props" in child) {
          matcher = matcher.with(
            P._,
            child.props.then
              ? typeof child.props.then === "function"
                ? child.props.then
                : () => child.props.then
              : typeof child.props.children === "function"
              ? child.props.children
              : () => child.props.children,
          );
        }
      } else {
        matcher = matcher.with(P._, () => null as any);
      }
    } else {
      if (type === Default.displayName) {
        throw new TypeError(
          "<Default> is required to be the last node if present.",
        );
      }
    }
  });

  return <>{matcher.run()}</>;
}
Match.displayName = "Root";

type WithProps<TPattern = any, TData = any> =
  | {
      pattern: TPattern;
      then?: ((arg: TData) => Children) | Children;
    }
  | {
      pattern: TPattern;
      children?: ((arg: TData) => Children) | Children;
    };

export function With<T = any>(props: WithProps<T>) {
  const hasValue = props.hasOwnProperty("pattern");
  const hasThen = props.hasOwnProperty("then");

  if (!hasValue) {
    throw new TypeError("<With> requires an `pattern` prop.");
  }

  // @ts-expect-error - it's ok
  if ((hasThen ^ props.hasOwnProperty("children")) === 0) {
    throw new TypeError("<With> expects either a `then` prop or children.");
  }

  return <>{null}</>;
}
With.displayName = "With";

type DefaultProps<T = any> =
  | { children?: ((arg: T) => Children) | Children }
  | { then?: ((arg: T) => Children) | Children };

export function Default<T = any>(props: DefaultProps<T>) {
  const hasThen = props.hasOwnProperty("then");

  // @ts-expect-error - it's ok
  if ((hasThen ^ props.hasOwnProperty("children")) === 0) {
    throw new TypeError(
      "<Default> expects either a `then` prop or children. Remove <Default> for null.",
    );
  }

  return <>{null}</>;
}
Default.displayName = "Default";

export const createMatch = <TState,>() => {
  const components = {
    Root: (props: MatchProps<TState>) => <Match {...props} />,
    With: <TPattern extends PType.Pattern<TState>>(
      props: WithProps<TPattern, Extract<TState, TPattern>>,
    ) => <With {...props} />,
    Default: (props: DefaultProps<TState>) => <Default {...props} />,
  } as const satisfies Record<string, React.FC<any>>;
  Match.displayName = "Root";
  With.displayName = "With";
  Default.displayName = "Default";
  return components;
};

type Children = Array<React.ReactNode> | React.ReactNode;
