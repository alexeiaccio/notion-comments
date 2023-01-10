/**
 * [Iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#iterator)
 * is a *protocol* which describes a standard way to produce a sequence of
 * values, typically the values of the Iterable represented by this Iterator.
 *
 * While described by the [ES2015 version of JavaScript](http://www.ecma-international.org/ecma-262/6.0/#sec-iterator-interface)
 * it can be utilized by any version of JavaScript.
 *
 * @external Iterator
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#iterator|MDN Iteration protocols}
 */

/**
 * [Iterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#iterable)
 * is a *protocol* which when implemented allows a JavaScript object to define
 * their iteration behavior, such as what values are looped over in a
 * [`for...of`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of)
 * loop or `iterall`'s `forEach` function. Many [built-in types](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#Builtin_iterables)
 * implement the Iterable protocol, including `Array` and `Map`.
 *
 * While described by the [ES2015 version of JavaScript](http://www.ecma-international.org/ecma-262/6.0/#sec-iterable-interface)
 * it can be utilized by any version of JavaScript.
 *
 * @external Iterable
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#iterable|MDN Iteration protocols}
 */

// In ES2015 environments, Symbol exists
const SYMBOL /*: any */ = typeof Symbol === "function" ? Symbol : void 0;

// In ES2015 (or a polyfilled) environment, this will be Symbol.iterator
const SYMBOL_ITERATOR = SYMBOL && SYMBOL.iterator;

/**
 * A property name to be used as the name of an Iterable's method responsible
 * for producing an Iterator, referred to as `@@iterator`. Typically represents
 * the value `Symbol.iterator` but falls back to the string `"@@iterator"` when
 * `Symbol.iterator` is not defined.
 *
 * Use `$$iterator` for defining new Iterables instead of `Symbol.iterator`,
 * but do not use it for accessing existing Iterables, instead use
 * {@link getIterator} or {@link isIterable}.
 *
 * @example
 *
 * const $$iterator = require('iterall').$$iterator
 *
 * function Counter (to) {
 *   this.to = to
 * }
 *
 * Counter.prototype[$$iterator] = function () {
 *   return {
 *     to: this.to,
 *     num: 0,
 *     next () {
 *       if (this.num >= this.to) {
 *         return { value: undefined, done: true }
 *       }
 *       return { value: this.num++, done: false }
 *     }
 *   }
 * }
 *
 * const counter = new Counter(3)
 * for (const number of counter) {
 *   console.log(number) // 0 ... 1 ... 2
 * }
 *
 * @type {Symbol|string}
 */
/*:: declare export const $$iterator: '@@iterator'; */
export const $$iterator = SYMBOL_ITERATOR || "@@iterator";

export function isIterable(obj: any): obj is Iterable<any>;

/**
 * Returns true if the provided object implements the Iterator protocol via
 * either implementing a `Symbol.iterator` or `"@@iterator"` method.
 *
 * @example
 *
 * const isIterable = require('iterall').isIterable
 * isIterable([ 1, 2, 3 ]) // true
 * isIterable('ABC') // true
 * isIterable({ length: 1, 0: 'Alpha' }) // false
 * isIterable({ key: 'value' }) // false
 * isIterable(new Map()) // true
 *
 * @param obj
 *   A value which might implement the Iterable protocol.
 * @return {boolean} true if Iterable.
 */
export function isIterable(obj: any) {
  return !!getIteratorMethod(obj);
}

export function isArrayLike(obj: any): obj is { length: number };

/**
 * Returns true if the provided object implements the Array-like protocol via
 * defining a positive-integer `length` property.
 *
 * @example
 *
 * const isArrayLike = require('iterall').isArrayLike
 * isArrayLike([ 1, 2, 3 ]) // true
 * isArrayLike('ABC') // true
 * isArrayLike({ length: 1, 0: 'Alpha' }) // true
 * isArrayLike({ key: 'value' }) // false
 * isArrayLike(new Map()) // false
 *
 * @param obj
 *   A value which might implement the Array-like protocol.
 * @return {boolean} true if Array-like.
 */
export function isArrayLike(obj: any) {
  const length = obj != null && obj.length;
  return typeof length === "number" && length >= 0 && length % 1 === 0;
}

export function isCollection(
  obj: any,
): obj is Iterable<any> | { length: number };

/**
 * Returns true if the provided object is an Object (i.e. not a string literal)
 * and is either Iterable or Array-like.
 *
 * This may be used in place of [Array.isArray()][isArray] to determine if an
 * object should be iterated-over. It always excludes string literals and
 * includes Arrays (regardless of if it is Iterable). It also includes other
 * Array-like objects such as NodeList, TypedArray, and Buffer.
 *
 * @example
 *
 * const isCollection = require('iterall').isCollection
 * isCollection([ 1, 2, 3 ]) // true
 * isCollection('ABC') // false
 * isCollection({ length: 1, 0: 'Alpha' }) // true
 * isCollection({ key: 'value' }) // false
 * isCollection(new Map()) // true
 *
 * @example
 *
 * const forEach = require('iterall').forEach
 * if (isCollection(obj)) {
 *   forEach(obj, function (value) {
 *     console.log(value)
 *   })
 * }
 *
 * @param obj
 *   An Object value which might implement the Iterable or Array-like protocols.
 * @return {boolean} true if Iterable or Array-like Object.
 */
export function isCollection(obj: any) {
  return Object(obj) === obj && (isArrayLike(obj) || isIterable(obj));
}

export function getIterator<TValue>(
  iterable: Iterable<TValue>,
): Iterator<TValue>;
export function getIterator(iterable: any): void | Iterator<any>;

/**
 * If the provided object implements the Iterator protocol, its Iterator object
 * is returned. Otherwise returns undefined.
 *
 * @example
 *
 * const getIterator = require('iterall').getIterator
 * const iterator = getIterator([ 1, 2, 3 ])
 * iterator.next() // { value: 1, done: false }
 * iterator.next() // { value: 2, done: false }
 * iterator.next() // { value: 3, done: false }
 * iterator.next() // { value: undefined, done: true }
 *
 * @template T the type of each iterated value
 * @param {Iterable<T>} iterable
 *   An Iterable object which is the source of an Iterator.
 * @return {Iterator<T>} new Iterator instance.
 */
export function getIterator(iterable: any) {
  const method = getIteratorMethod(iterable);
  if (method) {
    return method.call(iterable);
  }
}

export function getIteratorMethod<TValue>(
  iterable: Iterable<TValue>,
): () => Iterator<TValue>;
export function getIteratorMethod(iterable: any): void | (() => Iterator<any>);

/**
 * If the provided object implements the Iterator protocol, the method
 * responsible for producing its Iterator object is returned.
 *
 * This is used in rare cases for performance tuning. This method must be called
 * with obj as the contextual this-argument.
 *
 * @example
 *
 * const getIteratorMethod = require('iterall').getIteratorMethod
 * const myArray = [ 1, 2, 3 ]
 * const method = getIteratorMethod(myArray)
 * if (method) {
 *   const iterator = method.call(myArray)
 * }
 *
 * @template T the type of each iterated value
 * @param {Iterable<T>} iterable
 *   An Iterable object which defines an `@@iterator` method.
 * @return {function(): Iterator<T>} `@@iterator` method.
 */
export function getIteratorMethod(iterable: any) {
  if (iterable != null) {
    const method =
      (SYMBOL_ITERATOR && iterable[SYMBOL_ITERATOR]) || iterable["@@iterator"];
    if (typeof method === "function") {
      return method;
    }
  }
}

export function createIterator<TValue>(
  collection: Iterable<TValue>,
): Iterator<TValue>;
export function createIterator(collection: { length: number }): Iterator<any>;
export function createIterator(collection: any): void | Iterator<any>;

/**
 * Similar to {@link getIterator}, this method returns a new Iterator given an
 * Iterable. However it will also create an Iterator for a non-Iterable
 * Array-like collection, such as Array in a non-ES2015 environment.
 *
 * `createIterator` is complimentary to `forEach`, but allows a "pull"-based
 * iteration as opposed to `forEach`'s "push"-based iteration.
 *
 * `createIterator` produces an Iterator for Array-likes with the same behavior
 * as ArrayIteratorPrototype described in the ECMAScript specification, and
 * does *not* skip over "holes".
 *
 * @example
 *
 * const createIterator = require('iterall').createIterator
 *
 * const myArraylike = { length: 3, 0: 'Alpha', 1: 'Bravo', 2: 'Charlie' }
 * const iterator = createIterator(myArraylike)
 * iterator.next() // { value: 'Alpha', done: false }
 * iterator.next() // { value: 'Bravo', done: false }
 * iterator.next() // { value: 'Charlie', done: false }
 * iterator.next() // { value: undefined, done: true }
 *
 * @template T the type of each iterated value
 * @param {Iterable<T>|{ length: number }} collection
 *   An Iterable or Array-like object to produce an Iterator.
 * @return {Iterator<T>} new Iterator instance.
 */
export function createIterator(collection: any) {
  if (collection != null) {
    const iterator = getIterator(collection);
    if (iterator) {
      return iterator;
    }
    if (isArrayLike(collection)) {
      // @ts-expect-error - ArrayLikeIterator has prototype
      return new ArrayLikeIterator(collection);
    }
  }
}

// When the object provided to `createIterator` is not Iterable but is
// Array-like, this simple Iterator is created.
function ArrayLikeIterator(obj: any) {
  // @ts-expect-error - see below
  this._o = obj;
  // @ts-expect-error - see below
  this._i = 0;
}

// Note: all Iterators are themselves Iterable.
ArrayLikeIterator.prototype[$$iterator] = function () {
  return this;
};

// A simple state-machine determines the IteratorResult returned, yielding
// each value in the Array-like object in order of their indicies.
ArrayLikeIterator.prototype.next = function () {
  if (this._o === void 0 || this._i >= this._o.length) {
    this._o = void 0;
    return { value: void 0, done: true };
  }
  return { value: this._o[this._i++], done: false };
};

export function forEach<TCollection extends Iterable<any>>(
  collection: TCollection,
  callbackFn: (
    value: ValueOf<TCollection>,
    index: number,
    collection: TCollection,
  ) => any,
  thisArg?: any,
): void;
export function forEach<TCollection extends { length: number }>(
  collection: TCollection,
  callbackFn: (value: any, index: number, collection: TCollection) => any,
  thisArg?: any,
): void;

/**
 * Given an object which either implements the Iterable protocol or is
 * Array-like, iterate over it, calling the `callback` at each iteration.
 *
 * Use `forEach` where you would expect to use a `for ... of` loop in ES6.
 * However `forEach` adheres to the behavior of [Array#forEach][] described in
 * the ECMAScript specification, skipping over "holes" in Array-likes. It will
 * also delegate to a `forEach` method on `collection` if one is defined,
 * ensuring native performance for `Arrays`.
 *
 * Similar to [Array#forEach][], the `callback` function accepts three
 * arguments, and is provided with `thisArg` as the calling context.
 *
 * Note: providing an infinite Iterator to forEach will produce an error.
 *
 * [Array#forEach]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
 *
 * @example
 *
 * const forEach = require('iterall').forEach
 *
 * forEach(myIterable, function (value, index, iterable) {
 *   console.log(value, index, iterable === myIterable)
 * })
 *
 * @example
 *
 * // ES6:
 * for (let value of myIterable) {
 *   console.log(value)
 * }
 *
 * // Any JavaScript environment:
 * forEach(myIterable, function (value) {
 *   console.log(value)
 * })
 *
 * @template T the type of each iterated value
 * @param {Iterable<T>|{ length: number }} collection
 *   The Iterable or array to iterate over.
 * @param {function(T, number, object)} callback
 *   Function to execute for each iteration, taking up to three arguments
 * @param [thisArg]
 *   Optional. Value to use as `this` when executing `callback`.
 */
export function forEach(collection: any, callback: any, thisArg: any) {
  if (collection != null) {
    if (typeof collection.forEach === "function") {
      return collection.forEach(callback, thisArg);
    }
    let i = 0;
    const iterator = getIterator(collection);
    if (iterator) {
      let step;
      while (!(step = iterator.next()).done) {
        callback.call(thisArg, step.value, i++, collection);
        // Infinite Iterators could cause forEach to run forever.
        // After a very large number of iterations, produce an error.
        /* istanbul ignore if */
        if (i > 9999999) {
          throw new TypeError("Near-infinite iteration.");
        }
      }
    } else if (isArrayLike(collection)) {
      for (; i < collection.length; i++) {
        if (collection.hasOwnProperty(i)) {
          callback.call(thisArg, collection[i], i, collection);
        }
      }
    }
  }
}

/////////////////////////////////////////////////////
//                                                 //
//                 ASYNC ITERATORS                 //
//                                                 //
/////////////////////////////////////////////////////

/**
 * [AsyncIterable](https://tc39.github.io/proposal-async-iteration/#sec-asynciterable-interface)
 * is a *protocol* which when implemented allows a JavaScript object to define
 * an asynchronous iteration behavior, such as what values are looped over in
 * a [`for-await-of`](https://tc39.github.io/proposal-async-iteration/#sec-for-in-and-for-of-statements)
 * loop or `iterall`'s {@link forAwaitEach} function.
 *
 * While described as a proposed addition to the [ES2017 version of JavaScript](https://tc39.github.io/proposal-async-iteration/)
 * it can be utilized by any version of JavaScript.
 *
 * @external AsyncIterable
 * @see {@link https://tc39.github.io/proposal-async-iteration/#sec-asynciterable-interface|Async Iteration Proposal}
 * @template T The type of each iterated value
 * @property {function (): AsyncIterator<T>} Symbol.asyncIterator
 *   A method which produces an AsyncIterator for this AsyncIterable.
 */

/**
 * [AsyncIterator](https://tc39.github.io/proposal-async-iteration/#sec-asynciterator-interface)
 * is a *protocol* which describes a standard way to produce and consume an
 * asynchronous sequence of values, typically the values of the
 * {@link AsyncIterable} represented by this {@link AsyncIterator}.
 *
 * AsyncIterator is similar to Observable or Stream. Like an {@link Iterator} it
 * also as a `next()` method, however instead of an IteratorResult,
 * calling this method returns a {@link Promise} for a IteratorResult.
 *
 * While described as a proposed addition to the [ES2017 version of JavaScript](https://tc39.github.io/proposal-async-iteration/)
 * it can be utilized by any version of JavaScript.
 *
 * @external AsyncIterator
 * @see {@link https://tc39.github.io/proposal-async-iteration/#sec-asynciterator-interface|Async Iteration Proposal}
 */

// In ES2017 (or a polyfilled) environment, this will be Symbol.asyncIterator
const SYMBOL_ASYNC_ITERATOR = SYMBOL && SYMBOL.asyncIterator;

/**
 * A property name to be used as the name of an AsyncIterable's method
 * responsible for producing an Iterator, referred to as `@@asyncIterator`.
 * Typically represents the value `Symbol.asyncIterator` but falls back to the
 * string `"@@asyncIterator"` when `Symbol.asyncIterator` is not defined.
 *
 * Use `$$asyncIterator` for defining new AsyncIterables instead of
 * `Symbol.asyncIterator`, but do not use it for accessing existing Iterables,
 * instead use {@link getAsyncIterator} or {@link isAsyncIterable}.
 *
 * @example
 *
 * const $$asyncIterator = require('iterall').$$asyncIterator
 *
 * function Chirper (to) {
 *   this.to = to
 * }
 *
 * Chirper.prototype[$$asyncIterator] = function () {
 *   return {
 *     to: this.to,
 *     num: 0,
 *     next () {
 *       return new Promise(resolve => {
 *         if (this.num >= this.to) {
 *           resolve({ value: undefined, done: true })
 *         } else {
 *           setTimeout(() => {
 *             resolve({ value: this.num++, done: false })
 *           }, 1000)
 *         }
 *       })
 *     }
 *   }
 * }
 *
 * const chirper = new Chirper(3)
 * for await (const number of chirper) {
 *   console.log(number) // 0 ...wait... 1 ...wait... 2
 * }
 *
 * @type {Symbol|string}
 */
export const $$asyncIterator = SYMBOL_ASYNC_ITERATOR || "@@asyncIterator";

export function isAsyncIterable(obj: any): obj is AsyncIterable<any>;

/**
 * Returns true if the provided object implements the AsyncIterator protocol via
 * either implementing a `Symbol.asyncIterator` or `"@@asyncIterator"` method.
 *
 * @example
 *
 * const isAsyncIterable = require('iterall').isAsyncIterable
 * isAsyncIterable(myStream) // true
 * isAsyncIterable('ABC') // false
 *
 * @param obj
 *   A value which might implement the AsyncIterable protocol.
 * @return {boolean} true if AsyncIterable.
 */
export function isAsyncIterable(obj: any) {
  return !!getAsyncIteratorMethod(obj);
}

export function getAsyncIterator<TValue>(
  asyncIterable: AsyncIterable<TValue>,
): AsyncIterator<TValue>;
export function getAsyncIterator(asyncIterable: any): void | AsyncIterator<any>;

/**
 * If the provided object implements the AsyncIterator protocol, its
 * AsyncIterator object is returned. Otherwise returns undefined.
 *
 * @example
 *
 * const getAsyncIterator = require('iterall').getAsyncIterator
 * const asyncIterator = getAsyncIterator(myStream)
 * asyncIterator.next().then(console.log) // { value: 1, done: false }
 * asyncIterator.next().then(console.log) // { value: 2, done: false }
 * asyncIterator.next().then(console.log) // { value: 3, done: false }
 * asyncIterator.next().then(console.log) // { value: undefined, done: true }
 *
 * @template T the type of each iterated value
 * @param {AsyncIterable<T>} asyncIterable
 *   An AsyncIterable object which is the source of an AsyncIterator.
 * @return {AsyncIterator<T>} new AsyncIterator instance.
 */
export function getAsyncIterator(asyncIterable: any) {
  const method = getAsyncIteratorMethod(asyncIterable);
  if (method) {
    return method.call(asyncIterable);
  }
}

export function getAsyncIteratorMethod<TValue>(
  asyncIterable: AsyncIterable<TValue>,
): () => AsyncIterator<TValue>;
export function getAsyncIteratorMethod(
  asyncIterable: any,
): void | (() => AsyncIterator<any>);

/**
 * If the provided object implements the AsyncIterator protocol, the method
 * responsible for producing its AsyncIterator object is returned.
 *
 * This is used in rare cases for performance tuning. This method must be called
 * with obj as the contextual this-argument.
 *
 * @example
 *
 * const getAsyncIteratorMethod = require('iterall').getAsyncIteratorMethod
 * const method = getAsyncIteratorMethod(myStream)
 * if (method) {
 *   const asyncIterator = method.call(myStream)
 * }
 *
 * @template T the type of each iterated value
 * @param {AsyncIterable<T>} asyncIterable
 *   An AsyncIterable object which defines an `@@asyncIterator` method.
 * @return {function(): AsyncIterator<T>} `@@asyncIterator` method.
 */
export function getAsyncIteratorMethod(asyncIterable: any) {
  if (asyncIterable != null) {
    const method =
      (SYMBOL_ASYNC_ITERATOR && asyncIterable[SYMBOL_ASYNC_ITERATOR]) ||
      asyncIterable["@@asyncIterator"];
    if (typeof method === "function") {
      return method;
    }
  }
}

export function createAsyncIterator<TValue>(
  collection: AsyncIterable<TValue> | Iterable<Promise<TValue> | TValue>,
): AsyncIterator<TValue>;
export function createAsyncIterator(collection: {
  length: number;
}): AsyncIterator<any>;
export function createAsyncIterator(collection: any): void | AsyncIterator<any>;

/**
 * Similar to {@link getAsyncIterator}, this method returns a new AsyncIterator
 * given an AsyncIterable. However it will also create an AsyncIterator for a
 * non-async Iterable as well as non-Iterable Array-like collection, such as
 * Array in a pre-ES2015 environment.
 *
 * `createAsyncIterator` is complimentary to `forAwaitEach`, but allows a
 * buffering "pull"-based iteration as opposed to `forAwaitEach`'s
 * "push"-based iteration.
 *
 * `createAsyncIterator` produces an AsyncIterator for non-async Iterables as
 * described in the ECMAScript proposal [Async-from-Sync Iterator Objects](https://tc39.github.io/proposal-async-iteration/#sec-async-from-sync-iterator-objects).
 *
 * > Note: Creating `AsyncIterator`s requires the existence of `Promise`.
 * > While `Promise` has been available in modern browsers for a number of
 * > years, legacy browsers (like IE 11) may require a polyfill.
 *
 * @example
 *
 * const createAsyncIterator = require('iterall').createAsyncIterator
 *
 * const myArraylike = { length: 3, 0: 'Alpha', 1: 'Bravo', 2: 'Charlie' }
 * const iterator = createAsyncIterator(myArraylike)
 * iterator.next().then(console.log) // { value: 'Alpha', done: false }
 * iterator.next().then(console.log) // { value: 'Bravo', done: false }
 * iterator.next().then(console.log) // { value: 'Charlie', done: false }
 * iterator.next().then(console.log) // { value: undefined, done: true }
 *
 * @template T the type of each iterated value
 * @param {AsyncIterable<T>|Iterable<T>|{ length: number }} source
 *   An AsyncIterable, Iterable, or Array-like object to produce an Iterator.
 * @return {AsyncIterator<T>} new AsyncIterator instance.
 */
export function createAsyncIterator(source: any) {
  if (source != null) {
    const asyncIterator = getAsyncIterator(source);
    if (asyncIterator) {
      return asyncIterator;
    }
    const iterator = createIterator(source);
    if (iterator) {
      // @ts-expect-error - AsyncFromSyncIterator has prototype
      return new AsyncFromSyncIterator(iterator);
    }
  }
}

// When the object provided to `createAsyncIterator` is not AsyncIterable but is
// sync Iterable, this simple wrapper is created.
function AsyncFromSyncIterator(iterator: any) {
  // @ts-expect-error - see below
  this._i = iterator;
}

// Note: all AsyncIterators are themselves AsyncIterable.
AsyncFromSyncIterator.prototype[$$asyncIterator] = function () {
  return this;
};

// A simple state-machine determines the IteratorResult returned, yielding
// each value in the Array-like object in order of their indicies.
AsyncFromSyncIterator.prototype.next = function (value: any) {
  return unwrapAsyncFromSync(this._i, "next", value);
};

AsyncFromSyncIterator.prototype.return = function (value: any) {
  return this._i.return
    ? unwrapAsyncFromSync(this._i, "return", value)
    : Promise.resolve({ value: value, done: true });
};

AsyncFromSyncIterator.prototype.throw = function (value: any) {
  return this._i.throw
    ? unwrapAsyncFromSync(this._i, "throw", value)
    : Promise.reject(value);
};

function unwrapAsyncFromSync(iterator: any, fn: any, value: any) {
  let step: any;
  return new Promise(function (resolve) {
    step = iterator[fn](value);
    resolve(step.value);
  }).then(function (value) {
    return { value: value, done: step.done };
  });
}

export function forAwaitEach<TCollection extends AsyncIterable<any>>(
  collection: TCollection,
  callbackFn: (
    value: ResolvedOf<TCollection>,
    index: number,
    collection: TCollection,
  ) => any,
  thisArg?: any,
): Promise<void>;
export function forAwaitEach<TCollection extends Iterable<any>>(
  collection: TCollection,
  callbackFn: (
    value: ResolvedOf<TCollection>,
    index: number,
    collection: TCollection,
  ) => any,
  thisArg?: any,
): Promise<void>;
export function forAwaitEach<TCollection extends { length: number }>(
  collection: TCollection,
  callbackFn: (value: any, index: number, collection: TCollection) => any,
  thisArg?: any,
): Promise<void>;

/**
 * Given an object which either implements the AsyncIterable protocol or is
 * Array-like, iterate over it, calling the `callback` at each iteration.
 *
 * Use `forAwaitEach` where you would expect to use a [for-await-of](https://tc39.github.io/proposal-async-iteration/#sec-for-in-and-for-of-statements) loop.
 *
 * Similar to [Array#forEach][], the `callback` function accepts three
 * arguments, and is provided with `thisArg` as the calling context.
 *
 * > Note: Using `forAwaitEach` requires the existence of `Promise`.
 * > While `Promise` has been available in modern browsers for a number of
 * > years, legacy browsers (like IE 11) may require a polyfill.
 *
 * @example
 *
 * const forAwaitEach = require('iterall').forAwaitEach
 *
 * forAwaitEach(myIterable, function (value, index, iterable) {
 *   console.log(value, index, iterable === myIterable)
 * })
 *
 * @example
 *
 * // ES2017:
 * for await (let value of myAsyncIterable) {
 *   console.log(await doSomethingAsync(value))
 * }
 * console.log('done')
 *
 * // Any JavaScript environment:
 * forAwaitEach(myAsyncIterable, function (value) {
 *   return doSomethingAsync(value).then(console.log)
 * }).then(function () {
 *   console.log('done')
 * })
 *
 * @template T the type of each iterated value
 * @param {AsyncIterable<T>|Iterable<Promise<T> | T>|{ length: number }} source
 *   The AsyncIterable or array to iterate over.
 * @param {function(T, number, object)} callback
 *   Function to execute for each iteration, taking up to three arguments
 * @param [thisArg]
 *   Optional. Value to use as `this` when executing `callback`.
 */
export function forAwaitEach(source: any, callback: any, thisArg: any) {
  const asyncIterator = createAsyncIterator(source) as AsyncIterator<any>;
  if (asyncIterator) {
    let i = 0;
    return new Promise<void>(function (resolve, reject) {
      function next() {
        asyncIterator
          .next()
          .then(function (step: any) {
            if (!step.done) {
              Promise.resolve(callback.call(thisArg, step.value, i++, source))
                .then(next)
                .catch(reject);
            } else {
              resolve();
            }
            // Explicitly return null, silencing bluebird-style warnings.
            return null;
          })
          .catch(reject);
        // Explicitly return null, silencing bluebird-style warnings.
        return null;
      }
      next();
    });
  }
}

type ValueOf<TCollection> = TCollection extends Iterable<infer TValue>
  ? TValue
  : never;

type ResolvedOf<TCollection> = TCollection extends AsyncIterable<infer TValue>
  ? TValue
  : TCollection extends Iterable<infer U>
  ? U extends Promise<infer TValue>
    ? TValue
    : U
  : never;
