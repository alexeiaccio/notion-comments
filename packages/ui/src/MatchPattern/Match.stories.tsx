import type { Meta, StoryFn } from "@storybook/react";
import React from "react";
import { match, P } from "../ts-pattern";

import { Match, Otherwise, useMatchState, When, With } from "./Match";

const meta = {
  title: "UI/MatchPattern",
  component: Match as React.FC<any>,
  tags: ["autodocs"],
} satisfies Meta<typeof Match>;

export default meta;

const COLORS = ["red", "green", "blue", "hot fucking pink"] as const;
type Colors = (typeof COLORS)[number] | undefined;

export const Default: StoryFn<typeof Match> = () => {
  const [color, setColor] = React.useState(0);

  const match = useMatchState<Colors | undefined>({
    value: COLORS[color],
  });

  return (
    <>
      <button onClick={() => setColor((x) => (x + 1) % (COLORS.length + 1))}>
        {COLORS[color] ?? "wrong color"}
      </button>
      <div>
        <Match state={match} value={COLORS[color]}>
          <With
            pattern={["red", "blue"] as Colors[]}
            handler={(value) => (
              <div style={{ color: "red" }}>{String(value)}</div>
            )}
          />
          <With
            pattern={"green" as Colors}
            handler={(value) => (
              <div style={{ color: value }}>{String(value)}</div>
            )}
          />
          <With
            pattern="blue"
            guard={(x) => x !== "blue"}
            handler={(value) => (
              <div style={{ color: value }}>
                Never show! Value: {String(value)}
              </div>
            )}
          />
          <When<Colors>
            predicate={(x) => x === "hot fucking pink"}
            handler={(value) => <div>When! Value: {value}</div>}
          />
          <Otherwise
            handler={(value) => <div>Nope! Value: {String(value)}</div>}
          />
        </Match>
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

export const WithReducer: StoryFn<typeof Match> = () => {
  const [state, dispatch] = React.useReducer(reducer, initState);
  const isLoading = state.status === "loading";

  const match = useMatchState({
    value: state,
  });

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
        <Match state={match} value={state}>
          <With pattern={{ status: "error" }}>
            {({ error }) => (
              <>
                <h1>Error!</h1>
                <p>the error message is "{error.message}"</p>
              </>
            )}
          </With>
          <With pattern={{ status: "success" }}>
            {({ data }) => (
              <>
                <h1>fetch Success!</h1>
                <p>data: {data.value}</p>
              </>
            )}
          </With>
          <With pattern={{ status: "idle" }}>
            {({ status }) => (
              <>
                <h1 className="capitalize">{status}</h1>
                <p>Nothing is happening at the moment</p>
              </>
            )}
          </With>
          <With pattern={{ status: "loading" }}>
            {({ status }) => (
              <>
                <h1 className="capitalize">{status}...</h1>
                <p>(you can click on success, error, or cancel)</p>
              </>
            )}
          </With>
          <Otherwise>{() => <div>{"Otherwise"}</div>}</Otherwise>
        </Match>
      </div>
    </>
  );
};

// TODO: make types based on https://github.com/gvergnaud/ts-pattern
