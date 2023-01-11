import { expectRenderToEqual, expectRenderToThrow } from "../utils/test";
import { If, ElseIf, Else } from "./If";
import { describe, it } from "vitest";

describe("if", () => {
  it("includes children if condition is truthy", () => {
    expectRenderToEqual(<If test={"truthy"}>Truthy?</If>, <>{"Truthy?"}</>);
  });

  it("excludes children if condition is falsey", () => {
    expectRenderToEqual(<If test={0}>Truthy?</If>, <>{null}</>);
  });

  it("includes Else child if condition is falsey", () => {
    expectRenderToEqual(
      <If test={0}>
        Truthy?
        <Else>Falsey?</Else>
      </If>,
      <>{"Falsey?"}</>,
    );
  });

  it("excludes Else child if condition is truthy", () => {
    expectRenderToEqual(
      <If test={1}>
        Truthy?
        <Else>Falsey?</Else>
      </If>,
      <>{"Truthy?"}</>,
    );
  });

  it("evaluates ElseIf child if condition is falsey", () => {
    expectRenderToEqual(
      <If test={0}>
        Truthy?
        <ElseIf test={1}>Otherwise?</ElseIf>
      </If>,
      <>{"Otherwise?"}</>,
    );
  });

  it("does not evaluate If child if condition is falsey", () => {
    expectRenderToEqual(
      <If test={0}>
        Truthy?
        <If test={1}>Otherwise?</If>
      </If>,
      <>{null}</>,
    );
  });

  it("allows multiple nested ElseIf and Else cases", () => {
    expectRenderToEqual(
      <If test={0}>
        Truthy?
        <ElseIf test={0}>
          Otherwise?
          <Else>Not Otherwise?</Else>
        </ElseIf>
        <Else>Falsey?</Else>
      </If>,
      <>
        {"Not Otherwise?"}
        {"Falsey?"}
      </>,
    );
  });

  it("supports then prop", () => {
    expectRenderToEqual(<If test={1} then={"Truthy?"} />, <>{"Truthy?"}</>);
    expectRenderToEqual(<If test={0} then={"Truthy?"} />, <>{null}</>);
  });

  it("supports then else prop", () => {
    expectRenderToEqual(
      <If test={1} then={"Truthy?"} else={"Falsey?"} />,
      <>{"Truthy?"}</>,
    );
    expectRenderToEqual(
      <If test={0} then={"Truthy?"} else={"Falsey?"} />,
      <>{"Falsey?"}</>,
    );
  });

  describe("error cases", () => {
    it("requires case", () => {
      // @ts-expect-error - <If> requires a `test` prop.
      expectRenderToThrow(<If then={null} />, "<If> requires a `test` prop.");
    });

    it("requires either then or children", () => {
      expectRenderToThrow(
        // @ts-expect-error - <If> expects either a `then` prop or children.
        <If test={1} />,
        "<If> expects either a `then` prop or children.",
      );
    });

    it("requires then when using else", () => {
      expectRenderToThrow(
        // @ts-expect-error - <If> only use `else` prop alongside `then` prop.
        <If test={1} else={null} />,
        "<If> only use `else` prop alongside `then` prop.",
      );
    });
  });
});
