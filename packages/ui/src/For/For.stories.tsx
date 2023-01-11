import type { Meta, StoryFn } from "@storybook/react";
import React from "react";

import { For } from "./For";

const meta = {
  title: "UI/For",
  component: For,
  tags: ["autodocs"],
} satisfies Meta<typeof For>;

export default meta;

function Wrapper({ children }: { children: React.ReactNode }) {
  const [count, setCount] = React.useState(0);
  return (
    <>
      <button onClick={() => setCount((x) => x + 1)}>{count}</button>
      <div>{children}</div>
    </>
  );
}

export const RenderProp: StoryFn<typeof For> = () => {
  const [items, setItems] = React.useState(["0", "1", "2"]);

  return (
    <Wrapper>
      <button onClick={() => setItems([...items, `${items.length}`])}>
        Add
      </button>
      <button onClick={() => setItems([])}>Remove</button>
      <button onClick={() => setItems([...items.reverse()])}>Reverse</button>
      <For of={items} ifEmpty={<div>Nothing there</div>}>
        {(item, meta) => {
          // console.log("render", item);
          return <div key={meta?.key}>{item}</div>;
        }}
      </For>
    </Wrapper>
  );
};
