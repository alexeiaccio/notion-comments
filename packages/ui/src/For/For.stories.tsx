import type { Meta, StoryFn } from "@storybook/react";
import React from "react";

import { For } from "./For";

const meta = {
  title: "UI/For",
  component: For,
  tags: ["autodocs"],
} satisfies Meta<typeof For>;

export default meta;

export const RenderProp: StoryFn<typeof For> = () => {
  const [count, setCount] = React.useState(0);
  const [items, setItems] = React.useState(["0", "1", "2"]);

  return (
    <>
      <button onClick={() => setCount((x) => x + 1)}>{count}</button>
      <button onClick={() => setItems([...items, `${items.length}`])}>
        {items.length}
      </button>
      <button onClick={() => setItems([...items.reverse()])}>
        {items.length}
      </button>
      <For of={items}>
        {(item, meta) => {
          console.log("render", item);

          return <div key={meta?.key}>{item}</div>;
        }}
      </For>
    </>
  );
};
