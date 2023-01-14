import React from "react";

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
 * Or with `Then` element, if you need some type-safety.
 *
 * @example
 *
 *  <If test={someCondition}>
 *    <Then<typeof someCondition>>{(res) => 'This will only be shown if someCondition is truthy and type of res is nonnullable value of someCondition'}</Then>
 *  </If>
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
 * Or with `then` as render props, if you need some type-safety.
 *
 * @example
 *
 *  <If
 *   test={someCondition}
 *   then={(res) => 'This will only be shown if someCondition is truthy and type of res is nonnullable value of someCondition'}
 *   else={'This will be shown if someCondition is falsey.'}
 * />
 *
 * Based on `react-condition`
 * @see https://github.com/andrewfluck/react-condition
 */
export function If<T>(
  props:
    | {
        test: T;
        children: RenderProps<T>;
      }
    | { test: T; then: RenderProps<T>; else?: Children },
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
    return (
      <>
        {condition
          ? typeof props.then === "function" && props.test
            ? props.then(props.test)
            : props.then
          : hasElse
          ? props.else ?? null
          : null}
      </>
    );
  }
  if (hasChildren) {
    return (
      <>
        {React.Children.map(props.children, function (child) {
          const type =
            child &&
            typeof child === "object" &&
            "type" in child &&
            typeof child.type === "function" &&
            "displayName" in child.type &&
            child.type.displayName;
          const isElse =
            type === Else.displayName || type === ElseIf.displayName;
          if (
            type === Then.displayName &&
            typeof (child as React.ReactElement)?.props?.children ===
              "function" &&
            props.test
          ) {
            return React.cloneElement(child as React.ReactElement, {
              children: (child as React.ReactElement).props.children(
                props.test,
              ),
            });
          }
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

export function Then<T>(props: { children: RenderProps<T> }) {
  if (typeof props.children === "function")
    return <>{props.children("true" as any)}</>;
  return <>{props.children}</>;
}
Then.displayName = "Then";

type RenderProps<T = any> =
  | Array<React.ReactNode | ((arg: NonNullable<T>) => React.ReactNode)>
  | React.ReactNode
  | ((arg: NonNullable<T>) => React.ReactNode);

type Children = Array<React.ReactNode> | React.ReactNode;
