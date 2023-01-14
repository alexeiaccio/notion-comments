import type { Meta, StoryFn } from "@storybook/react";
import React from "react";
import { match, P } from "ts-pattern";

import { Match as Component, createMatch } from "./Match";

const meta = {
  title: "UI/Match",
  component: Component as React.FC<any>,
  tags: ["autodocs"],
} satisfies Meta<typeof Match>;

export default meta;

const COLORS = ["red", "green", "blue", "hot fucking pink"] as const;

const Match = createMatch<(typeof COLORS)[number]>();

export const WithThen: StoryFn<typeof Component> = () => {
  const [color, setColor] = React.useState(0);

  return (
    <>
      <button onClick={() => setColor((x) => (x + 1) % COLORS.length)}>
        {COLORS[color]}
      </button>
      <div>
        <Match.Root expression={COLORS[color]}>
          <Match.With
            pattern="red"
            then={(value) => <div style={{ color: value }}>{value}</div>}
          />
          <Match.With
            pattern="green"
            then={(value) => <div style={{ color: value }}>{value}</div>}
          />
          <Match.With
            pattern="blue"
            then={(value) => <div style={{ color: value }}>{value}</div>}
          />
          <Match.Default then={(value) => <div>{value}</div>} />
        </Match.Root>
      </div>
    </>
  );
};

export const WithChildren: StoryFn<typeof Component> = () => {
  const [color, setColor] = React.useState(0);

  return (
    <>
      <button onClick={() => setColor((x) => (x + 1) % COLORS.length)}>
        {COLORS[color]}
      </button>
      <div>
        <Match.Root expression={COLORS[color]}>
          <Match.With pattern="red">
            {(value) => <div style={{ color: value }}>{value}</div>}
          </Match.With>
          <Match.With pattern="green">
            {(value) => <div style={{ color: value }}>{value}</div>}
          </Match.With>
          <Match.With pattern="blue">
            {(value) => <div style={{ color: value }}>{value}</div>}
          </Match.With>
        </Match.Root>
      </div>
    </>
  );
};

type State<T = { value: string }> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

type Event<T = { value: string }> =
  | { type: "fetch" }
  | { type: "success"; data: T }
  | { type: "error"; error: Error }
  | { type: "cancel" };

const initState: State = {
  status: "idle",
};

const reducer = (state: State, event: Event): State =>
  match<[State, Event], State>([state, event])
    .with([{ status: "loading" }, { type: "success" }], ([, { data }]) => ({
      status: "success",
      data,
    }))
    .with(
      [{ status: "loading" }, { type: "error", error: P.select() }],
      (error) => ({
        status: "error",
        error,
      }),
    )
    .with([{ status: "loading" }, { type: "cancel" }], () => initState)
    .with([{ status: P.not("loading") }, { type: "fetch" }], () => ({
      status: "loading",
    }))
    .with(P._, () => state)
    .otherwise(() => state);

const MatchWithReducer = createMatch<State<{ value: string }>>();

export const WithReducer: StoryFn<typeof Component> = () => {
  const [state, dispatch] = React.useReducer(reducer, initState);
  const isLoading = state.status === "loading";

  return (
    <>
      <div className="flex">
        <button
          disabled={isLoading}
          onClick={() => dispatch({ type: "fetch" })}
        >
          fetch
        </button>
        <button
          disabled={!isLoading}
          onClick={() =>
            dispatch({ type: "success", data: { value: "fetched data" } })
          }
        >
          success
        </button>
        <button
          disabled={!isLoading}
          onClick={() =>
            dispatch({ type: "error", error: new Error("errroooor message") })
          }
        >
          error
        </button>
        <button
          disabled={!isLoading}
          onClick={() => dispatch({ type: "cancel" })}
        >
          cancel
        </button>
      </div>
      <div>
        <MatchWithReducer.Root expression={state}>
          <MatchWithReducer.With pattern={{ status: "error" }}>
            {({ error }) => (
              <>
                <h1>Error!</h1>
                <p>the error message is "{error.message}"</p>
              </>
            )}
          </MatchWithReducer.With>
          <MatchWithReducer.With pattern={{ status: "success" }}>
            {({ data }) => (
              <>
                <h1>fetch Success!</h1>
                <p>data: {data.value}</p>
              </>
            )}
          </MatchWithReducer.With>
          <MatchWithReducer.With pattern={{ status: "idle" }}>
            {({ status }) => (
              <>
                <h1 className="capitalize">{status}</h1>
                <p>Nothing is happening at the moment</p>
              </>
            )}
          </MatchWithReducer.With>
          <MatchWithReducer.With pattern={{ status: "loading" }}>
            {({ status }) => (
              <>
                <h1 className="capitalize">{status}...</h1>
                <p>(you can click on success, error, or cancel)</p>
              </>
            )}
          </MatchWithReducer.With>
          <MatchWithReducer.Default>Default</MatchWithReducer.Default>
        </MatchWithReducer.Root>
      </div>
    </>
  );
};
