import React from "react";

/**
 * Use the `expression` prop with `<Switch>` element to conditionally include
 * certain elements. When an `<Switch>` compares a value from `<Case>` and the
 * comparison is _truthy_ it _only_ renders the matching child. However, when
 * the comparison is _falsey_ it continues through the children until it finds
 * a match, or falls back to `<Default>`.
 *
 * @example
 *
 *   <Switch expression={"blue"}>
 *       <Case value={"red"}>
 *           red
 *       </Case>
 *       <Case value={"green"}>
 *           green
 *       </Case>
 *       <Case value={"blue"}>
 *           blue
 *       </Case>
 *   </Switch>
 *
 * @example
 *
 *   <Switch expression={"hot fucking pink"}>
 *       <Case value={"red"}>
 *           red
 *       </Case>
 *       <Case value={"green"}>
 *           green
 *       </Case>
 *       <Case value={"blue"}>
 *           blue
 *       </Case>
 *       <Default>
 *           no color
 *       </Default>
 *   </Switch>
 *
 *
 * Alternatively, you can provide `then` as props to `<Case>` or `<Default>`
 *
 * @example
 *
 *   <Switch expression={"hot fucking pink"}>
 *       <Case value={"red"} then={"red"} />
 *       <Case value={"red"} then={"green"} />
 *       <Case value={"red"} then={"blue"} />
 *       <Default then={"no color"} />
 *   </Switch>
 *
 * Based on `react-condition`
 * @see https://github.com/andrewfluck/react-condition
 */
export function Switch(props: { expression: any; children: Children }) {
  let match: Children = null;
  const count = React.Children.count(props.children);

  const hasExpression = props.hasOwnProperty("expression");
  if (!hasExpression) {
    throw new TypeError("<Switch> requires an `expression` prop.");
  }

  React.Children.forEach(props.children, (child, i) => {
    if (match) return;

    const type =
      child &&
      typeof child === "object" &&
      "type" in child &&
      typeof child.type === "function" &&
      "displayName" in child.type &&
      child.type.displayName;

    if (
      type !== Case.displayName &&
      type !== Default.displayName &&
      child !== null
    ) {
      throw new TypeError(
        "<Switch> requires a child of type <Case>, <Default>, or null.",
      );
    }

    if (i + 1 === count) {
      if (type === Default.displayName) {
        match = child;
      }
    } else {
      if (type === Default.displayName) {
        throw new TypeError(
          "<Default> is required to be the last node if present.",
        );
      }
    }

    child &&
    typeof child === "object" &&
    "props" in child &&
    child.props.value === props.expression
      ? (match = child)
      : null;
  });

  return match;
}
Switch.displayName = "Switch";

export function Case(
  props:
    | {
        value: any;
        then?: Children;
      }
    | {
        value: any;
        children?: Children;
      },
) {
  const hasValue = props.hasOwnProperty("value");
  const hasThen = props.hasOwnProperty("then");

  if (!hasValue) {
    throw new TypeError("<Case> requires an `value` prop.");
  }

  // @ts-expect-error - it's ok
  if ((hasThen ^ props.hasOwnProperty("children")) === 0) {
    throw new TypeError("<Case> expects either a `then` prop or children.");
  }

  if ("then" in props) {
    return <>{props.then ?? null}</>;
  }

  if ("children" in props) {
    return <>{props.children ?? null}</>;
  }

  return <>{null}</>;
}
Case.displayName = "Case";

export function Default(props: { children?: Children } | { then?: Children }) {
  const hasThen = props.hasOwnProperty("then");

  // @ts-expect-error - it's ok
  if ((hasThen ^ props.hasOwnProperty("children")) === 0) {
    throw new TypeError(
      "<Default> expects either a `then` prop or children. Remove <Default> for null.",
    );
  }

  if ("then" in props) {
    return <>{props.then ?? null}</>;
  }

  if ("children" in props) {
    return <>{props.children ?? null}</>;
  }

  return <>{null}</>;
}
Default.displayName = "Default";

type Children = Array<React.ReactNode> | React.ReactNode;
