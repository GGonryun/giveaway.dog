# Style Guide

## Coding Principles

**Don't future-proof.** Build only what's needed for near-term goals. "Build assuming your code will be deleted in six months." Still build for reliability and quality — just don't develop toward unscheduled future use cases.

**Reuse code.** When 2+ things use the same logic, create an abstraction.

**Use libraries.** Use 3rd-party libraries for common tasks: caching, retries with backoff, collection manipulation (e.g. lodash).

**Write libraries.** For non-business-logic functionality without a 3rd-party implementation, create an abstract, well-unit-tested implementation.

**Avoid unnecessary abstractions.** Don't abstract until 2+ things reuse the code. When that point arrives, don't copy-paste — create an abstraction instead.

**Avoid mutable state.** Utility methods that change state should return a copy with modified properties. Prefer:

- `filter`/`map` over `for` loops with `push`
- Spread (`[...a, ...b]`, `{...a, ...b}`) over clone + mutate
- Early returns over `let data; try { data = ... }` patterns

**Integrations: general over specific.** Only rely on core integration functionality — advanced features (e.g. expiry grants, user provisioning) won't exist in all systems. Handle these in first-party code that generalizes across integrations.

**Prefer factory functions over classes.** Factory functions have less boilerplate, more intuitive method-value behavior, and simpler mocking. Use classes when:

- You need partially-implemented inheritance via `abstract` (consider higher-order functions first: `const hoc = (fn: (args: A) => T): B => { … }`)
- Object instantiation is in a hot loop
- You need runtime type disambiguation

| Use case            | Solution         |
| ------------------- | ---------------- |
| Data                | Plain objects    |
| Service             | Factory function |
| Concrete strategy   | Factory function |
| Abstract strategies | Classes          |

**Avoid type casts.**

**Testing.** Happy path for deep functionality. Complete unit tests for modular functionality.

## Patterns

**Selectively mapping a collection.** Define a type-guard predicate, then chain `filter` + `map`. Use `partition` to map both truthy and falsy results. Use `compact` instead of filtering by `isDefined`.

```ts
const isMy = (v: General): v is My => v.type === "my";
values.filter(isMy).map((my) => ...);
compact(partials).map((defined) => ...);
```

**Load integration config:** `ResourcePool.checkedGet(tenantId, integration, use)`

**Check installation:** `installedItem(use, config, id)`

**Type union from values** — single source of truth; adding to `Values` automatically updates `Value`:

```ts
const Values = [value1, value2] as const; // plural of the type name
type Value = (typeof Values)[number];
const isFooAValue = isa(Values, foo);
```

**Exhaustive switch/ternary.** Use `assertNever` so unhandled cases fail at type-check time:

```ts
switch (obj.key) {
  case value1: return ...;
  case value2: return ...;
  default: throw assertNever(obj);
}
// ternary form:
obj.key === value1 ? ... : obj.key === value2 ? ... : assertNever(obj);
```

## Naming

**Prefixes:**

| Prefix     | Use                                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `build`    | Updates the state of a `Builder`; avoid using in place of `new`                                                                 |
| `create`   | Creates a value in a store/map; throws if already exists; avoid using in place of `new` or `set`                                |
| `fetch`    | Retrieves from an external system (not caches/DBs); see `send`                                                                  |
| `filter`   | Returns all values in a collection fulfilling a predicate                                                                       |
| `find`     | Returns first matching value or `undefined`                                                                                     |
| `from`     | Inverts a `to` function                                                                                                         |
| `get`      | Reads a single value from a store/cache (`undefined` if missing); use `For` if the store is internal to the function; see `set` |
| `has`      | Boolean ownership or collection membership                                                                                      |
| `is`       | Boolean type check or type-guard function; return type should be `is T`                                                         |
| `list`     | Reads a collection from a store/cache; use `query` if selected by complex conditions                                            |
| `load`     | Reads from a filesystem                                                                                                         |
| `make`     | **Avoid**; use `new` or `set` instead                                                                                           |
| `new`      | Factory function that creates another function or object; returned value should always be the created value                     |
| `parse`    | String → structured data; see `render`                                                                                          |
| `query`    | Complex store query; implies potential computational overhead over `list`/`get`                                                 |
| `render`   | Structured data → string/image; see `parse`                                                                                     |
| `send`     | Sends to an external system (not caches/DBs); see `fetch`                                                                       |
| `set`      | Sets a value in a store; succeeds regardless of existing value; see `create`, `get`, `update`                                   |
| `to`       | Translates a value to another representation                                                                                    |
| `update`   | Updates an existing store value; throws if missing; see `create`, `get`, `set`                                                  |
| `validate` | Throws if value fails a predicate; return type `asserts is T` when validating type; see `verify`                                |
| `verify`   | Returns boolean predicate result; see `validate`                                                                                |

**Suffixes:**

| Suffix    | Use                                                                                                |
| --------- | -------------------------------------------------------------------------------------------------- |
| `Builder` | Stateful object that constructs another object in multiple steps (each step prefixed with `build`) |
| `Client`  | Object whose properties are functions that call an API                                             |
| `Context` | Object whose properties are references to shared data used across multiple functions               |
| `Driver`  | Object whose properties abstract business logic into client logic                                  |
| `For`     | Function returning a value from an internal store; see `get`                                       |
| `Handler` | Function performing a specific unit of work, typically within a `Service`                          |
| `Service` | Long-lived stateless object with a start/stop lifecycle                                            |

**No Hungarian notation.** Don't suffix types with `Type` or values with their type name. VSCode already communicates symbol kinds. Exceptions — use these specific shorthands only:

```ts
const listLength = list.length;    // interning array length
const objectSize = object.size;    // interning object size
for (let iArray = 0; ...) { ... }  // array index variable
```

## Textual Style

**Destructuring.** Destructure on a single line when extracting from objects/tuples. Use multiple destructuring statements when unnesting would create a multi-line statement. Always destructure tuples; inline field access is OK for objects accessed only a couple of times.

```ts
const [{ context, tenantId }, service, command] = data;
const { environment } = context;
```

**Single-line when it fits.** Remove newlines after opening `{`/`[` to keep object/array literals on one line. Omit braces on single-line `if`/`else`; use braces if it doesn't fit on one line.

```ts
const obj = { x: 1, y: "a" };
if (condition) return;
if (condition) {
  // longer logic
}
```

**Newlines between functions.** Separate functions with a blank line. Exception: a closure variable may be grouped with its closure (no blank line between them).

```ts
let scopedVar = 6;
const closure = () => {
  scopedVar = ...;
};
```
