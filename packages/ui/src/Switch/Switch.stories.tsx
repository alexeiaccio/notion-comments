import type { Meta, StoryFn } from "@storybook/react";
import React from "react";

import { Switch, Case, Default } from "./Switch";

const meta = {
  title: "UI/Switch",
  component: Switch,
  tags: ["autodocs"],
} satisfies Meta<typeof Switch>;

export default meta;

const COLORS = ["red", "green", "blue", "hot fucking pink"];

export const WithCases: StoryFn<typeof Switch> = () => {
  const [color, setColor] = React.useState(0);

  return (
    <>
      <button onClick={() => setColor((x) => (x + 1) % COLORS.length)}>
        {COLORS[color]}
      </button>
      <div>
        <Switch expression={COLORS[color]}>
          <Case value="red" then={"red"} />
          <Case value="green" then={"green"} />
          <Case value="blue" then={"blue"} />
        </Switch>
      </div>
    </>
  );
};

export const WithDefault: StoryFn<typeof Switch> = () => {
  const [color, setColor] = React.useState(0);

  return (
    <>
      <button onClick={() => setColor((x) => (x + 1) % COLORS.length)}>
        {COLORS[color]}
      </button>
      <div>
        <Switch expression={COLORS[color]}>
          <Case value="red" then={"red"} />
          <Case value="green" then={"green"} />
          <Case value="blue" then={"blue"} />
          <Default then={"no color"} />
        </Switch>
      </div>
    </>
  );
};
