import type { Meta, StoryFn } from "@storybook/react";
import React from "react";

import { Else, ElseIf, If, Then } from "./If";

const meta = {
  title: "UI/If",
  component: If,
  tags: ["autodocs"],
} satisfies Meta<typeof If>;

export default meta;

export const WithChildren: StoryFn<typeof If> = () => {
  const [test, setTest] = React.useState(false);

  return (
    <>
      <button onClick={() => setTest((x) => !x)}>{String(test)}</button>
      <div>
        <If test={test}>
          Truthy?
          <Else>Falsey?</Else>
        </If>
      </div>
    </>
  );
};

export const WithRenderProps: StoryFn<typeof If> = () => {
  const [test, setTest] = React.useState<{ true: "Truthy!" } | null>(null);

  return (
    <>
      <button
        onClick={() =>
          setTest((x) => (x === null ? { true: "Truthy!" } : null))
        }
      >
        {String(Boolean(test))}
      </button>
      <div>
        <If test={test}>
          <Then<typeof test>>{(res) => <div>{res.true}</div>}</Then>
          <Else>Falsey?</Else>
        </If>
      </div>
    </>
  );
};

export const WithElseIf: StoryFn<typeof If> = () => {
  const [test, setTest] = React.useState(false);
  const [test2, setTest2] = React.useState(false);

  return (
    <>
      <button onClick={() => setTest((x) => !x)}>
        {String(Boolean(test))}
      </button>
      <button onClick={() => setTest2((x) => !x)}>
        {String(Boolean(test2))}
      </button>
      <div>
        <If test={test}>
          Truthy?
          <ElseIf test={test2}>
            Otherwise?
            <Else>Not Otherwise?</Else>
          </ElseIf>
          <Else>Falsey?</Else>
        </If>
      </div>
    </>
  );
};

export const WithThenElse: StoryFn<typeof If> = () => {
  const [test, setTest] = React.useState(false);

  return (
    <>
      <button onClick={() => setTest((x) => !x)}>
        {String(Boolean(test))}
      </button>
      <div>
        <If test={test} then={"Truthy?"} else={"Falsey?"} />
      </div>
    </>
  );
};

export const WithThenRenderProps: StoryFn<typeof If> = () => {
  const [test, setTest] = React.useState<{ true: "Truthy!" } | null>(null);

  return (
    <>
      <button
        onClick={() =>
          setTest((x) => (x === null ? { true: "Truthy!" } : null))
        }
      >
        {String(Boolean(test))}
      </button>
      <div>
        <If
          test={test}
          then={(res) => <div>{res.true}</div>}
          else={"Falsey?"}
        />
      </div>
    </>
  );
};
