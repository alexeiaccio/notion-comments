import React from "react";
import type { Children } from "../utils/types";

/**
 * Use the `test` prop with `<If>` and `<ElseIf>` elements to conditionally
 * include certain elements. When an `<If>` test is _truthy_ it does not
 * render any `<ElseIf>` or `<Else>` children. However when it is _falsey_ it
 * _only_ renders `<ElseIf>` and `<Else>` children.
 *
 * @example
 *
 *   <If test={someCondition}>
 *     This will only be shown if someCondition is truthy.
 *     <ElseIf test={otherCondition}>
 *       This will only be shown if someCondition is falsey
 *       and otherCondition is truthy.
 *       <Else>
 *         This will only be shown if both someCondition and
 *         otherCondition are both falsey.
 *       </Else>
 *     </ElseIf>
 *     <Else>
 *       This will be shown if someCondition is falsey.
 *       <If test={finalCondition}>
 *         This will be shown if someCondition is falsey
 *         and finalCondition is truthy.
 *       </If>
 *     </Else>
 *   </If>
 *
 * Alternatively, you can provide `then` and `else` props.
 *
 * @example
 *
 *  <If
 *   test={someCondition}
 *   then={'This will only be shown if someCondition is truthy.'}
 *   else={'This will be shown if someCondition is falsey.'}
 * />
 *
 * Based on `react-condition`
 * @see https://github.com/andrewfluck/react-condition
 */
export function If(
  props:
    | {
        test: any;
        children: Children;
      }
    | { test: any; then: Children; else?: Children },
) {
  const hasTest = props.hasOwnProperty("test");
  if (!hasTest) {
    throw new TypeError("<If> requires a `test` prop.");
  }
  const condition = Boolean(hasTest && props.test);
  const hasElse = "else" in props && props.hasOwnProperty("else");
  const hasThen = "then" in props && props.hasOwnProperty("then");
  const hasChildren = "children" in props && props.hasOwnProperty("children");
  if (hasElse && !hasThen) {
    throw new TypeError("<If> only use `else` prop alongside `then` prop.");
  }
  // @ts-expect-error - it's ok
  if ((hasThen ^ hasChildren) === 0) {
    throw new TypeError("<If> expects either a `then` prop or children.");
  }
  if (hasThen) {
    return <>{condition ? props.then : hasElse ? props.else ?? null : null}</>;
  }
  if (hasChildren) {
    return (
      <>
        {React.Children.map(props.children, function (child) {
          const isElse =
            child &&
            typeof child === "object" &&
            "type" in child &&
            typeof child.type === "function" &&
            "displayName" in child.type &&
            (child.type.displayName === Else.displayName ||
              child.type.displayName === ElseIf.displayName);
          return condition !== isElse ? child : null;
        })}
      </>
    );
  }
  return null;
}
If.displayName = "If";

export function ElseIf(props: { test: any; children: Children }) {
  return <If {...props} />;
}
ElseIf.displayName = "ElseIf";

export function Else(props: { children: Children }) {
  return <>{props.children}</>;
}
Else.displayName = "Else";
