import { expectRenderToEqual, expectRenderToThrow } from "../utils/test";
import { Switch, Case, Default } from "./Switch";
import { describe, it } from "vitest";

describe("switch", () => {
  it("includes child from matching expression", () => {
    expectRenderToEqual(
      <Switch expression="blue">
        <Case value="red" then={"red"} />
        <Case value="green" then={"green"} />
        <Case value="blue" then={"blue"} />
      </Switch>,
      <>{"blue"}</>,
    );
  });

  it("includes single child from matching expression", () => {
    expectRenderToEqual(
      <Switch expression="blue">
        <Case value="red" then={"red"} />
        <Case value="green" then={"green"} />
        <Case value="blue" then={"blue"} />
        <Case value="blue" then={"blue?"} />
      </Switch>,
      <>{"blue"}</>,
    );
  });

  it("excludes all children from not matching expression", () => {
    expectRenderToEqual(
      <Switch expression="hot fucking pink">
        <Case value="red" then={"red"} />
        <Case value="green" then={"green"} />
        <Case value="blue" then={"blue"} />
      </Switch>,
      <>{null}</>,
    );
  });

  it("includes child from matching expression but fallsback", () => {
    expectRenderToEqual(
      <Switch expression="hot fucking pink">
        <Case value="red" then={"red"} />
        <Case value="green" then={"green"} />
        <Case value="blue" then={"blue"} />
        <Default then={"no color"} />
      </Switch>,
      <>{"no color"}</>,
    );
  });

  describe("error cases", () => {
    it("requires default at end", () => {
      expectRenderToThrow(
        <Switch expression="hot fucking pink">
          <Case value="red" then={"red"} />
          <Case value="green" then={"green"} />
          <Default then={"no color"} />
          <Case value="blue" then={"blue"} />
        </Switch>,
        "<Default> is required to be the last node if present.",
      );
    });

    it("requires case default or null", () => {
      expectRenderToThrow(
        <Switch expression="red">
          <p>Uh oh 🙊🙉</p>
          <Case value="red" then={"red"} />
          <Case value="green" then={"green"} />
          <Case value="blue" then={"blue"} />
        </Switch>,
        "<Switch> requires a child of type <Case>, <Default>, or null.",
      );
    });
  });
});
