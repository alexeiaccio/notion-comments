import type { symbols } from "./internals";

//////////////////////////////////////////////////////////////////////////////

// #region FindSelected

type SelectionsRecord = Record<string, [unknown, unknown[]]>;

export type None = {
  type: "none";
};
export type Some<key extends string> = {
  type: "some";
  key: key;
};

export type SelectionType = None | Some<string>;

type MapOptional<selections> = {
  [k in keyof selections]: selections[k] extends [infer v, infer subpath]
    ? [v | undefined, subpath]
    : never;
};

type MapList<selections> = {
  [k in keyof selections]: selections[k] extends [infer v, infer subpath]
    ? [v[], subpath]
    : never;
};

type ReduceFindSelectionUnion<
  i,
  ps extends any[],
  output = never,
> = ps extends [infer head, ...infer tail]
  ? ReduceFindSelectionUnion<i, tail, output | FindSelectionUnion<i, head>>
  : output;

export type FindSelectionUnion<
  i,
  p,
  // path just serves as an id, to identify different anonymous patterns which have the same type
  path extends any[] = [],
> = IsAny<i> extends true
  ? never
  : p extends Matcher<any, infer pattern, infer matcherType, infer sel>
  ? {
      select: sel extends Some<infer k>
        ? { [kk in k]: [i, path] } | FindSelectionUnion<i, pattern, path>
        : never;
      array: i extends (infer ii)[]
        ? MapList<FindSelectionUnion<ii, pattern>>
        : never;
      optional: MapOptional<FindSelectionUnion<i, pattern>>;
      or: MapOptional<ReduceFindSelectionUnion<i, Cast<pattern, any[]>>>;
      and: ReduceFindSelectionUnion<i, Cast<pattern, any[]>>;
      not: never;
      default: sel extends Some<infer k> ? { [kk in k]: [i, path] } : never;
    }[matcherType]
  : p extends readonly (infer pp)[]
  ? i extends readonly (infer ii)[]
    ? p extends readonly [any, ...any[]]
      ? i extends readonly [any, ...any[]]
        ? {
            [k in TupleKeys & keyof i & keyof p]: FindSelectionUnion<
              i[k],
              p[k],
              [...path, k]
            >;
          }[TupleKeys & keyof i & keyof p]
        : FindSelectionUnion<ii, p[number], [...path, 0]>
      : FindSelectionUnion<ii, pp, [...path, 0]>
    : never
  : p extends object
  ? i extends object
    ? {
        [k in keyof p]: k extends keyof i
          ? FindSelectionUnion<i[k], p[k], [...path, k]>
          : never;
      }[keyof p]
    : never
  : never;

export type SeveralAnonymousSelectError<
  a = "You can only use a single anonymous selection (with `select()`) in your pattern. If you need to select multiple values, give them names with `select(<name>)` instead",
> = {
  __error: never;
} & a;

export type MixedNamedAndAnonymousSelectError<
  a = 'Mixing named selections (`select("name")`) and anonymous selections (`select()`) is forbiden. Please, only use named selections.',
> = {
  __error: never;
} & a;

export type SelectionToArgs<selections extends SelectionsRecord> =
  symbols.anonymousSelectKey extends keyof selections
    ? // If the path is never, it means several anonymous patterns were `&` together
      [selections[symbols.anonymousSelectKey][1]] extends [never]
      ? SeveralAnonymousSelectError
      : keyof selections extends symbols.anonymousSelectKey
      ? selections[symbols.anonymousSelectKey][0]
      : MixedNamedAndAnonymousSelectError
    : { [k in keyof selections]: selections[k][0] };

type ConcatSelections<
  a extends SelectionsRecord,
  b extends SelectionsRecord,
> = {
  // keys both on output and sel
  [k in keyof a & keyof b]: [a[k][0] | b[k][0], a[k][1] & b[k][1]]; // the path has to be the same
} & {
  // keys of a
  [k in Exclude<keyof a, keyof b>]: a[k];
} & {
  // keyso of b
  [k in Exclude<keyof b, keyof a>]: b[k];
};

type ReduceToRecord<
  selections extends any[],
  output extends SelectionsRecord = {},
> = selections extends [infer sel, ...infer rest]
  ? ReduceToRecord<rest, ConcatSelections<Cast<sel, SelectionsRecord>, output>>
  : output;

export type Selections<i, p> = FindSelectionUnion<i, p> extends infer u
  ? [u] extends [never]
    ? i
    : SelectionToArgs<ReduceToRecord<UnionToTuple<u>>>
  : i;

export type FindSelected<i, p> =
  // This happens if the provided pattern didn't extend Pattern<i>,
  // Because the type checker falls back on the general `Pattern<i>` type
  // in this case.
  Equal<p, Pattern<i>> extends true ? i : Selections<i, p>;

// #endregion

//////////////////////////////////////////////////////////////////////////////

// #region Pattern

export type MatcherType =
  | "not"
  | "optional"
  | "or"
  | "and"
  | "array"
  | "select"
  | "default";

// We use a separate MatcherProtocol type to preserves
// the type level information (selections and excluded) used
// only for inference.
export type MatcherProtocol<
  input,
  narrowed,
  // Type of what this pattern selected from the input
  matcherType extends MatcherType,
  selections extends SelectionType,
  // Type to exclude from the input union because
  // it has been fully matched by this pattern
  excluded,
> = {
  match: <I>(value: I | input) => MatchResult;
  getSelectionKeys?: () => string[];
  matcherType?: matcherType;
};

export type MatchResult = {
  matched: boolean;
  selections?: Record<string, any>;
};

/**
 * A `Matcher` is an object implementing the match
 * protocol. It must define a `symbols.matcher` property
 * which returns an object with a `match()` method, taking
 * the input value and returning whether the pattern matches
 * or not, along with optional selections.
 */
export interface Matcher<
  input,
  narrowed,
  // Type of what this pattern selected from the input
  matcherType extends MatcherType = "default",
  selections extends SelectionType = None,
  // Type to exclude from the input union because
  // it has been fully matched by this pattern
  excluded = narrowed,
> {
  [symbols.matcher](): MatcherProtocol<
    input,
    narrowed,
    matcherType,
    selections,
    excluded
  >;
}

type UnknownMatcher = Matcher<unknown, unknown, any, any>;

export type OptionalP<input, p> = Matcher<input, p, "optional">;

export type ArrayP<input, p> = Matcher<input, p, "array">;

export type AndP<input, ps> = Matcher<input, ps, "and">;

export type OrP<input, ps> = Matcher<input, ps, "or">;

export type NotP<input, p> = Matcher<input, p, "not">;

export type GuardP<input, narrowed> = Matcher<input, narrowed>;

export type GuardExcludeP<input, narrowed, excluded> = Matcher<
  input,
  narrowed,
  "default",
  None,
  excluded
>;

export type SelectP<
  key extends string,
  input = unknown,
  p = Matcher<unknown, unknown>,
> = Matcher<input, p, "select", Some<key>>;

export type AnonymousSelectP = SelectP<symbols.anonymousSelectKey>;

export interface ToExclude<a> {
  [symbols.toExclude]: a;
}

export type UnknownPattern =
  | readonly []
  | readonly [UnknownPattern, ...UnknownPattern[]]
  | { readonly [k: string]: UnknownPattern }
  | Set<UnknownPattern>
  | Map<unknown, UnknownPattern>
  | Primitives
  | UnknownMatcher;

/**
 * `Pattern<a>` is the generic type for patterns matching a value of type `a`. A pattern can be any (nested) javascript value.
 *
 * They can also be wildcards, like `P._`, `P.string`, `P.number`,
 * or other matchers, like `P.when(predicate)`, `P.not(pattern)`, etc.
 *
 * [Read `Patterns` documentation on GitHub](https://github.com/gvergnaud/ts-pattern#patterns)
 *
 * @example
 * const pattern: P.Pattern<User> = { name: P.string }
 */
export type Pattern<a> =
  | Matcher<a, unknown, any, any>
  | (a extends Primitives
      ? a
      : unknown extends a
      ? UnknownPattern
      : a extends readonly (infer i)[]
      ? a extends readonly [any, ...any]
        ? { readonly [index in keyof a]: Pattern<a[index]> }
        : readonly [] | readonly [Pattern<i>, ...Pattern<i>[]]
      : a extends Map<infer k, infer v>
      ? Map<k, Pattern<v>>
      : a extends Set<infer v>
      ? Set<Pattern<v>>
      : a extends object
      ? { readonly [k in keyof a]?: Pattern<Exclude<a[k], undefined>> }
      : a);

// #endregion

//////////////////////////////////////////////////////////////////////////////

// #region helpers

export type ValueOf<a> = a extends any[] ? a[number] : a[keyof a];

export type Values<a extends object> = UnionToTuple<ValueOf<a>>;

/**
 * ### LeastUpperBound
 * An interesting one. A type taking two imbricated sets and returning the
 * smallest one.
 * We need that because sometimes the pattern's inferred type holds more
 * information than the value on which we are matching (if the value is any
 * or unknown for instance).
 */

export type LeastUpperBound<a, b> = b extends a ? b : a extends b ? a : never;

/**
 * if a key of an object has the never type,
 * returns never, otherwise returns the type of object
 **/

export type ExcludeIfContainsNever<a, b> = b extends Map<any, any> | Set<any>
  ? a
  : b extends readonly [any, ...any]
  ? ExcludeObjectIfContainsNever<a, keyof b & ("0" | "1" | "2" | "3" | "4")>
  : b extends any[]
  ? ExcludeObjectIfContainsNever<a, keyof b & number>
  : ExcludeObjectIfContainsNever<a, keyof b & string>;

export type ExcludeObjectIfContainsNever<
  a,
  keyConstraint = unknown,
> = a extends any
  ? "exclude" extends {
      [k in keyConstraint & keyof a]-?: [a[k]] extends [never]
        ? "exclude"
        : "include";
    }[keyConstraint & keyof a]
    ? never
    : a
  : never;

// from https://stackoverflow.com/questions/50374908/transform-union-type-to-intersection-type/50375286#50375286
export type UnionToIntersection<union> = (
  union extends any ? (k: union) => void : never
) extends (k: infer intersection) => void
  ? intersection
  : never;

export type IsUnion<a> = [a] extends [UnionToIntersection<a>] ? false : true;

export type UnionToTuple<
  union,
  output extends any[] = [],
> = UnionToIntersection<
  union extends any ? (t: union) => union : never
> extends (_: any) => infer elem
  ? UnionToTuple<Exclude<union, elem>, [elem, ...output]>
  : output;

export type Cast<a, b> = a extends b ? a : never;

export type Flatten<
  xs extends any[],
  output extends any[] = [],
> = xs extends readonly [infer head, ...infer tail]
  ? Flatten<tail, [...output, ...Cast<head, any[]>]>
  : output;

export type Equal<a, b> = (<T>() => T extends a ? 1 : 2) extends <
  T,
>() => T extends b ? 1 : 2
  ? true
  : false;

export type Expect<a extends true> = a;

export type IsAny<a> = 0 extends 1 & a ? true : false;

export type Length<it extends readonly any[]> = it["length"];

export type Iterator<
  n extends number,
  it extends any[] = [],
> = it["length"] extends n ? it : Iterator<n, [any, ...it]>;

export type Next<it extends any[]> = [any, ...it];
export type Prev<it extends any[]> = it extends readonly [any, ...infer tail]
  ? tail
  : [];

export type Take<
  xs extends readonly any[],
  it extends any[],
  output extends any[] = [],
> = Length<it> extends 0
  ? output
  : xs extends readonly [infer head, ...infer tail]
  ? Take<tail, Prev<it>, [...output, head]>
  : output;

export type Drop<
  xs extends readonly any[],
  n extends any[],
> = Length<n> extends 0
  ? xs
  : xs extends readonly [any, ...infer tail]
  ? Drop<tail, Prev<n>>
  : [];

export type UpdateAt<
  tail extends readonly any[],
  n extends any[],
  value,
  inits extends readonly any[] = [],
> = Length<n> extends 0
  ? tail extends readonly [any, ...infer tail]
    ? [...inits, value, ...tail]
    : inits
  : tail extends readonly [infer head, ...infer tail]
  ? UpdateAt<tail, Prev<n>, value, [...inits, head]>
  : inits;

export type BuiltInObjects =
  | Function
  | Date
  | RegExp
  | Generator
  | { readonly [Symbol.toStringTag]: string }
  | any[];

export type IsPlainObject<o, excludeUnion = BuiltInObjects> = o extends object
  ? // to excluded branded string types,
    // like `string & { __brand: "id" }`
    // and built-in objects
    o extends string | excludeUnion
    ? false
    : true
  : false;

export type Compute<a extends any> = a extends BuiltInObjects
  ? a
  : { [k in keyof a]: a[k] };

export type IntersectObjects<a> = (
  a extends any ? keyof a : never
) extends infer allKeys
  ? {
      [k in Cast<allKeys, PropertyKey>]: a extends any
        ? k extends keyof a
          ? a[k]
          : never
        : never;
    }
  : never;

export type WithDefault<a, def> = [a] extends [never] ? def : a;

export type IsLiteral<a> = [a] extends [null | undefined]
  ? true
  : [a] extends [string]
  ? string extends a
    ? false
    : true
  : [a] extends [number]
  ? number extends a
    ? false
    : true
  : [a] extends [boolean]
  ? boolean extends a
    ? false
    : true
  : [a] extends [symbol]
  ? symbol extends a
    ? false
    : true
  : [a] extends [bigint]
  ? bigint extends a
    ? false
    : true
  : false;

export type Primitives =
  | number
  | boolean
  | string
  | undefined
  | null
  | symbol
  | bigint;

export type TupleKeys = 0 | 1 | 2 | 3 | 4;

export type Union<a, b> = [b] extends [a] ? a : [a] extends [b] ? b : a | b;

/**
 * GuardValue returns the value guarded by a type guard function.
 */
export type GuardValue<fn> = fn extends (value: any) => value is infer b
  ? b
  : fn extends (value: infer a) => unknown
  ? a
  : never;

export type GuardFunction<input, narrowed> =
  | ((value: input) => value is Cast<narrowed, input>)
  | ((value: input) => boolean);

export type Some2<bools extends boolean[]> = true extends bools[number]
  ? true
  : false;

export type All<bools extends boolean[]> = bools[number] extends true
  ? true
  : false;

// #endregion

//////////////////////////////////////////////////////////////////////////////

// #region DeepExclude | DistributeUnions | BuildMany | isMatching

// BuildMany :: DataStructure -> Union<[value, path][]> -> Union<DataStructure>
export type BuildMany<data, xs extends any[]> = xs extends any
  ? BuildOne<data, xs>
  : never;

// BuildOne :: DataStructure
// -> [value, path][]
// -> DataStructure
type BuildOne<data, xs extends any[]> = xs extends [
  [infer value, infer path],
  ...infer tail,
]
  ? BuildOne<Update<data, value, Cast<path, PropertyKey[]>>, tail>
  : data;

type SafeGet<data, k extends PropertyKey, def> = k extends keyof data
  ? data[k]
  : def;

// Update :: a -> b -> PropertyKey[] -> a
type Update<data, value, path extends PropertyKey[]> = path extends [
  infer head,
  ...infer tail,
]
  ? data extends readonly [any, ...any]
    ? head extends number
      ? UpdateAt<
          data,
          Iterator<head>,
          Update<data[head], value, Cast<tail, PropertyKey[]>>
        >
      : never
    : data extends readonly (infer a)[]
    ? Update<a, value, Cast<tail, PropertyKey[]>>[]
    : data extends Set<infer a>
    ? Set<Update<a, value, Cast<tail, PropertyKey[]>>>
    : data extends Map<infer k, infer v>
    ? Map<k, Update<v, value, Cast<tail, PropertyKey[]>>>
    : Compute<
        Omit<data, Cast<head, PropertyKey>> & {
          [k in Cast<head, PropertyKey>]: Update<
            SafeGet<data, k, {}>,
            value,
            Cast<tail, PropertyKey[]>
          >;
        }
      >
  : value;

export type IsMatching<a, p> = true extends IsUnion<a> | IsUnion<p>
  ? true extends (
      p extends any ? (a extends any ? IsMatching<a, p> : never) : never
    )
    ? true
    : false
  : // Special case for unknown, because this is the type
  // of the inverted `_` wildcard pattern, which should
  // match everything.
  unknown extends p
  ? true
  : p extends Primitives
  ? p extends a
    ? true
    : false
  : [p, a] extends [readonly any[], readonly any[]]
  ? [p, a] extends [
      readonly [infer p1, infer p2, infer p3, infer p4, infer p5],
      readonly [infer a1, infer a2, infer a3, infer a4, infer a5],
    ]
    ? [
        IsMatching<a1, p1>,
        IsMatching<a2, p2>,
        IsMatching<a3, p3>,
        IsMatching<a4, p4>,
        IsMatching<a5, p5>,
      ] extends [true, true, true, true, true]
      ? true
      : false
    : [p, a] extends [
        readonly [infer p1, infer p2, infer p3, infer p4],
        readonly [infer a1, infer a2, infer a3, infer a4],
      ]
    ? [
        IsMatching<a1, p1>,
        IsMatching<a2, p2>,
        IsMatching<a3, p3>,
        IsMatching<a4, p4>,
      ] extends [true, true, true, true]
      ? true
      : false
    : [p, a] extends [
        readonly [infer p1, infer p2, infer p3],
        readonly [infer a1, infer a2, infer a3],
      ]
    ? [IsMatching<a1, p1>, IsMatching<a2, p2>, IsMatching<a3, p3>] extends [
        true,
        true,
        true,
      ]
      ? true
      : false
    : [p, a] extends [
        readonly [infer p1, infer p2],
        readonly [infer a1, infer a2],
      ]
    ? [IsMatching<a1, p1>, IsMatching<a2, p2>] extends [true, true]
      ? true
      : false
    : [p, a] extends [readonly [infer p1], readonly [infer a1]]
    ? IsMatching<a1, p1>
    : p extends a
    ? true
    : false
  : IsPlainObject<p> extends true
  ? true extends ( // `true extends union` means "if some cases of the a union are matching"
      a extends any // loop over the `a` union
        ? [keyof p & keyof a] extends [never] // if no common keys
          ? false
          : /**
           * Intentionally not using ValueOf, to avoid reaching the
           * 'type instanciation is too deep error'.
           */
          { [k in keyof p & keyof a]: IsMatching<a[k], p[k]> }[keyof p &
              keyof a] extends true
          ? true // all values are matching
          : false
        : never
    )
    ? true
    : false
  : p extends a
  ? true
  : false;

/**
 * DistributeMatchingUnions takes two arguments:
 * - a data structure of type `a` containing unions
 * - a pattern `p`, matching this data structure
 * and turns it into a union of all possible
 * combination of each unions contained in `a` that matches `p`.
 *
 * It does this in 3 main steps:
 *  - 1. Find all unions contained in the data structure, that matches `p`
 *    with `FindUnions<a, p>`. It returns a tree of [union, path] pairs.
 *  - 2. this tree is passed to the `Distribute` type level function,
 *    Which turns it into a union of list of `[singleValue, path]` pairs.
 *    Each list correspond to one of the possible combination of the unions
 *    found in `a`.
 *  - 3. build a data structure with the same shape as `a` for each combination
 *    and return the union of these data structures.
 *
 * @example
 * type t1 = DistributeMatchingUnions<['a' | 'b', 1 | 2], ['a', 1]>;
 * // => ['a', 1] | ['a', 2] | ['b', 1] | ['b', 2]
 *
 * type t2 = DistributeMatchingUnions<['a' | 'b', 1 | 2], ['a', unknown]>;
 * // => ['a', 1 | 2] | ['b', 1 | 2]
 */
export type DistributeMatchingUnions<a, p> = IsAny<a> extends true
  ? any
  : BuildMany<a, Distribute<FindUnionsMany<a, p>>>;

// FindUnionsMany :: a -> Union<a> -> PropertyKey[] -> UnionConfig[]
export type FindUnionsMany<
  a,
  p,
  path extends PropertyKey[] = [],
> = UnionToTuple<
  (
    p extends any
      ? IsMatching<a, p> extends true
        ? FindUnions<a, p, path>
        : []
      : never
  ) extends (infer T)[]
    ? T
    : never
>;

/**
 * The reason we don't look further down the tree with lists,
 * Set and Maps is that they can be heterogeneous,
 * so matching on a A[] for a in input of (A|B)[]
 * doesn't rule anything out. You can still have
 * a (A|B)[] afterward. The same logic goes for Set and Maps.
 *
 * Kinds are types of types.
 *
 * kind UnionConfig = {
 *  cases: Union<{
 *    value: b,
 *    subUnions: UnionConfig[]
 *  }>,
 *  path: string[]
 * }
 * FindUnions :: Pattern a p => a -> p -> UnionConfig[]
 */
export type FindUnions<
  a,
  p,
  path extends PropertyKey[] = [],
> = unknown extends p
  ? []
  : IsAny<p> extends true
  ? [] // Don't try to find unions after 5 levels
  : Length<path> extends 5
  ? []
  : IsUnion<a> extends true
  ? [
      {
        cases: a extends any
          ? {
              value: a;
              subUnions: FindUnionsMany<a, p, path>;
            }
          : never;
        path: path;
      },
    ]
  : [a, p] extends [readonly any[], readonly any[]]
  ? [a, p] extends [
      readonly [infer a1, infer a2, infer a3, infer a4, infer a5],
      readonly [infer p1, infer p2, infer p3, infer p4, infer p5],
    ]
    ? [
        ...FindUnions<a1, p1, [...path, 0]>,
        ...FindUnions<a2, p2, [...path, 1]>,
        ...FindUnions<a3, p3, [...path, 2]>,
        ...FindUnions<a4, p4, [...path, 3]>,
        ...FindUnions<a5, p5, [...path, 4]>,
      ]
    : [a, p] extends [
        readonly [infer a1, infer a2, infer a3, infer a4],
        readonly [infer p1, infer p2, infer p3, infer p4],
      ]
    ? [
        ...FindUnions<a1, p1, [...path, 0]>,
        ...FindUnions<a2, p2, [...path, 1]>,
        ...FindUnions<a3, p3, [...path, 2]>,
        ...FindUnions<a4, p4, [...path, 3]>,
      ]
    : [a, p] extends [
        readonly [infer a1, infer a2, infer a3],
        readonly [infer p1, infer p2, infer p3],
      ]
    ? [
        ...FindUnions<a1, p1, [...path, 0]>,
        ...FindUnions<a2, p2, [...path, 1]>,
        ...FindUnions<a3, p3, [...path, 2]>,
      ]
    : [a, p] extends [
        readonly [infer a1, infer a2],
        readonly [infer p1, infer p2],
      ]
    ? [...FindUnions<a1, p1, [...path, 0]>, ...FindUnions<a2, p2, [...path, 1]>]
    : [a, p] extends [readonly [infer a1], readonly [infer p1]]
    ? FindUnions<a1, p1, [...path, 0]>
    : []
  : a extends Set<any>
  ? []
  : a extends Map<any, any>
  ? []
  : [IsPlainObject<a>, IsPlainObject<p>] extends [true, true]
  ? Flatten<
      Values<{
        [k in keyof a & keyof p]: FindUnions<a[k], p[k], [...path, k]>;
      }>
    >
  : [];

// Distribute :: UnionConfig[] -> Union<[a, path][]>
export type Distribute<unions extends any[]> = unions extends [
  { cases: infer cases; path: infer path },
  ...infer tail,
]
  ? cases extends { value: infer value; subUnions: infer subUnions }
    ? [
        [value, path],
        ...Distribute<Cast<subUnions, any[]>>,
        ...Distribute<tail>,
      ]
    : never
  : [];

export type DeepExclude<a, b> = Exclude<DistributeMatchingUnions<a, b>, b>;

// #endregion

//////////////////////////////////////////////////////////////////////////////

// #region InvertPattern

type OptionalKeys<p> = ValueOf<{
  [k in keyof p]: p[k] extends Matcher<any, any, infer matcherType>
    ? matcherType extends "optional"
      ? k
      : never
    : never;
}>;

type ReduceUnion<tuple extends any[], output = never> = tuple extends readonly [
  infer p,
  ...infer tail,
]
  ? ReduceUnion<tail, output | InvertPattern<p>>
  : output;

type ReduceIntersection<
  tuple extends any[],
  output = unknown,
> = tuple extends readonly [infer p, ...infer tail]
  ? ReduceIntersection<tail, output & InvertPattern<p>>
  : output;

/**
 * ### InvertPattern
 * Since patterns have special wildcard values, we need a way
 * to transform a pattern into the type of value it represents
 */
export type InvertPattern<p> = p extends Matcher<
  infer input,
  infer narrowed,
  infer matcherType,
  any
>
  ? {
      not: ToExclude<InvertPattern<narrowed>>;
      select: InvertPattern<narrowed>;
      array: InvertPattern<narrowed>[];
      optional: InvertPattern<narrowed> | undefined;
      and: ReduceIntersection<Cast<narrowed, any[]>>;
      or: ReduceUnion<Cast<narrowed, any[]>>;
      default: [narrowed] extends [never] ? input : narrowed;
    }[matcherType]
  : p extends Primitives
  ? p
  : p extends readonly (infer pp)[]
  ? p extends readonly [infer p1, infer p2, infer p3, infer p4, infer p5]
    ? [
        InvertPattern<p1>,
        InvertPattern<p2>,
        InvertPattern<p3>,
        InvertPattern<p4>,
        InvertPattern<p5>,
      ]
    : p extends readonly [infer p1, infer p2, infer p3, infer p4]
    ? [
        InvertPattern<p1>,
        InvertPattern<p2>,
        InvertPattern<p3>,
        InvertPattern<p4>,
      ]
    : p extends readonly [infer p1, infer p2, infer p3]
    ? [InvertPattern<p1>, InvertPattern<p2>, InvertPattern<p3>]
    : p extends readonly [infer p1, infer p2]
    ? [InvertPattern<p1>, InvertPattern<p2>]
    : p extends readonly [infer p1]
    ? [InvertPattern<p1>]
    : p extends readonly []
    ? []
    : InvertPattern<pp>[]
  : p extends Map<infer pk, infer pv>
  ? Map<pk, InvertPattern<pv>>
  : p extends Set<infer pv>
  ? Set<InvertPattern<pv>>
  : IsPlainObject<p> extends true
  ? OptionalKeys<p> extends infer optKeys
    ? [optKeys] extends [never]
      ? {
          [k in Exclude<keyof p, optKeys>]: InvertPattern<p[k]>;
        }
      : Compute<
          {
            [k in Exclude<keyof p, optKeys>]: InvertPattern<p[k]>;
          } & {
            [k in Cast<optKeys, keyof p>]?: InvertPattern<p[k]>;
          }
        >
    : never
  : p;

export type ReduceIntersectionForExclude<
  tuple extends any[],
  i,
  output = unknown,
> = tuple extends readonly [infer p, ...infer tail]
  ? ReduceIntersectionForExclude<
      tail,
      i,
      output & InvertPatternForExcludeInternal<p, i, unknown>
    >
  : output;

export type ReduceUnionForExclude<
  tuple extends any[],
  i,
  output = never,
> = tuple extends readonly [infer p, ...infer tail]
  ? ReduceUnionForExclude<
      tail,
      i,
      output | InvertPatternForExcludeInternal<p, i, never>
    >
  : output;

type ExcludeIfExists<a, b> =
  // If b is of type never, it probably means that P.not
  // was called with a `P.when` that wasn't a type guard function.
  // in this case we do not exclude
  [b] extends [never]
    ? never
    : // If a is unknown, we can't exclude
    // (Unless negative types are added in the future)
    unknown extends a
    ? never
    : DeepExclude<a, b>;

/**
 * ### InvertPatternForExclude
 */
export type InvertPatternForExclude<p, i> = Equal<p, Pattern<i>> extends true
  ? never
  : InvertPatternForExcludeInternal<p, i>;

type InvertPatternForExcludeInternal<p, i, empty = never> =
  // We need to prevent distribution because the boolean
  // type is a union of literal as well as a Primitive type
  // and it will end up being a false positif if we distribute it.
  [p] extends [Primitives]
    ? IsLiteral<p> extends true
      ? p
      : IsLiteral<i> extends true
      ? p
      : empty
    : p extends Matcher<
        infer matchableInput,
        infer subpattern,
        infer matcherType,
        any,
        infer excluded
      >
    ? {
        select: InvertPatternForExcludeInternal<subpattern, i, empty>;
        array: i extends readonly (infer ii)[]
          ? InvertPatternForExcludeInternal<subpattern, ii, empty>[]
          : empty;
        optional:
          | InvertPatternForExcludeInternal<subpattern, i, empty>
          | undefined;
        and: ReduceIntersectionForExclude<Cast<subpattern, any[]>, i>;
        or: ReduceUnionForExclude<Cast<subpattern, any[]>, i>;
        not: ExcludeIfExists<
          // we use matchableInput if possible because it represent the
          // union of all possible value, but i is only one of these values.
          unknown extends matchableInput ? i : matchableInput,
          InvertPatternForExcludeInternal<subpattern, i>
        >;
        default: excluded;
      }[matcherType]
    : p extends readonly (infer pp)[]
    ? i extends readonly (infer ii)[]
      ? p extends readonly [infer p1, infer p2, infer p3, infer p4, infer p5]
        ? i extends readonly [infer i1, infer i2, infer i3, infer i4, infer i5]
          ? readonly [
              InvertPatternForExcludeInternal<p1, i1, empty>,
              InvertPatternForExcludeInternal<p2, i2, empty>,
              InvertPatternForExcludeInternal<p3, i3, empty>,
              InvertPatternForExcludeInternal<p4, i4, empty>,
              InvertPatternForExcludeInternal<p5, i5, empty>,
            ]
          : empty
        : p extends readonly [infer p1, infer p2, infer p3, infer p4]
        ? i extends readonly [infer i1, infer i2, infer i3, infer i4]
          ? readonly [
              InvertPatternForExcludeInternal<p1, i1, empty>,
              InvertPatternForExcludeInternal<p2, i2, empty>,
              InvertPatternForExcludeInternal<p3, i3, empty>,
              InvertPatternForExcludeInternal<p4, i4, empty>,
            ]
          : empty
        : p extends readonly [infer p1, infer p2, infer p3]
        ? i extends readonly [infer i1, infer i2, infer i3]
          ? readonly [
              InvertPatternForExcludeInternal<p1, i1, empty>,
              InvertPatternForExcludeInternal<p2, i2, empty>,
              InvertPatternForExcludeInternal<p3, i3, empty>,
            ]
          : empty
        : p extends readonly [infer p1, infer p2]
        ? i extends readonly [infer i1, infer i2]
          ? readonly [
              InvertPatternForExcludeInternal<p1, i1, empty>,
              InvertPatternForExcludeInternal<p2, i2, empty>,
            ]
          : empty
        : p extends readonly [infer p1]
        ? i extends readonly [infer i1]
          ? readonly [InvertPatternForExcludeInternal<p1, i1, empty>]
          : empty
        : p extends readonly []
        ? []
        : InvertPatternForExcludeInternal<pp, ii, empty>[]
      : empty
    : p extends Map<infer pk, infer pv>
    ? i extends Map<any, infer iv>
      ? Map<pk, InvertPatternForExcludeInternal<pv, iv, empty>>
      : empty
    : p extends Set<infer pv>
    ? i extends Set<infer iv>
      ? Set<InvertPatternForExcludeInternal<pv, iv, empty>>
      : empty
    : IsPlainObject<p> extends true
    ? i extends object
      ? [keyof p & keyof i] extends [never]
        ? empty
        : OptionalKeys<p> extends infer optKeys
        ? [optKeys] extends [never]
          ? {
              readonly [k in keyof p]: k extends keyof i
                ? InvertPatternForExcludeInternal<p[k], i[k], empty>
                : InvertPattern<p[k]>;
            }
          : Compute<
              {
                readonly [k in Exclude<keyof p, optKeys>]: k extends keyof i
                  ? InvertPatternForExcludeInternal<p[k], i[k], empty>
                  : InvertPattern<p[k]>;
              } & {
                readonly [k in Cast<optKeys, keyof p>]?: k extends keyof i
                  ? InvertPatternForExcludeInternal<p[k], i[k], empty>
                  : InvertPattern<p[k]>;
              }
            >
        : empty
      : empty
    : empty;

// #endregion

//////////////////////////////////////////////////////////////////////////////
