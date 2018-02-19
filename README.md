# Filemonger

## Introduction

A filemonger is a function which represents a transformation that may be applied
to a stream of files. Being executed lazily, one can compose a pipeline of
filemongers to be run at a later time, or to be further composed with other
compound filemongers.

### Using filemongers

```ts
import {
  typescriptmonger,
  passthrumonger,
  babelmonger,
  closurecompilermonger
} from "some-cool-package";
import { compilerOptions } from "./tsconfig";

const matchesDts = f => !!f.match(/d\.ts$/);
const matchesJs = f => !!f.match(/\.js$/);
const opts = { compilerOptions };

const compoundmonger = typescriptmonger("**/*.ts", opts).multicast(
  file$ => passthrumonger(file$.filter(matchesDts)),
  file$ => babelmonger(file$.filter(matchesJs)).bind(closurecompilermonger)
);

compoundmonger.run("./src", "./dist", (err, files) => {
  console.log("Output files:");
  files.forEach(console.log);
});
```

### Creating a filemonger

```ts
import makeFilemonger from "@filemonger/main";
import { f, copyFile } from "@filemonger/helpers";

export const passthrumonger = makeFilemonger((file$, srcDir, destDir, opts) =>
  file$.flatMap(file =>
    copyFile(
      f.fullPath(f.abs(join(srcDir, file))),
      f.fullPath(f.abs(join(destDir, file)))
    ).map(file => f.fullPath(f.rel(relative(destDir, file))))
  )
);
```

## Installation

To get the basics:

```sh
yarn add [-D] @filemonger/main
```

But you probably also want some helper functions if you're creating a
filemonger:

```sh
yarn add [-D] @filemonger/helpers
```

## API

### Making a filemonger

Read files from `srcDir`, transform them, and place the new files in the
`destDir`, returning a stream of the new file paths which may or may not have
changed. `file$` is an Rxjs stream of file paths relative to the `srcDir`.
`opts` is the option object passed in through the filemonger invocation as the
second argument. If no options were passed then `opts` will be an empty object.

```ts
const mrcoolicemonger = makeFilemonger((file$, srcDir, destDir, opts) => {
  // Do stuff
});
```

### Invoking a filemonger

Invoking a filemonger (i.e. instantiating it) gives us an interface which
we can use to compose this instance with other filemonger instances. The
instantiation of a filemonger captures a particular stream of files, and maybe
some options. Specifying a source directory and destination directory happens
later.

```ts
mrcoolicemonger("img/**/*.jpg");
```

### Composing filemongers

```ts
icyhotstunnazmonger("img/**/*.jpg")
  .merge(mrcoolicemonger("img/**/*.jpg"))
  .bind(imgcompressmonger);
```

#### `#bind()`

Binds one filemonger to another, essentially linking them together.

```ts
firstmonger().bind(file$ => secondmonger(file$));
// or simply
firstmonger().bind(secondmonger);
```

All the output files from `firstmonger` get piped into `secondmonger` when the
pipeline is run. After `bind`ing we are left with a new filemonger instance that
can be further composed.

#### `#merge()`

Merges one filemonger instance with another. Useful for funneling multiple
sources into the same pipeline.

```ts
firstmonger().merge(secondmonger());
```

Unlike with `#bind()`, `#merge()` requires a filemonger instance be provided
rather than a filemonger instance factory. This is because we are merging two
different streams which are responsible for their own source.

#### `#multicast()`

Sends the same file stream to multiple other filemongers. You can use this to
split processing into multiple branches. `#multicast()` will merge these
branches back into a single pipeline for you.

```ts
firstmonger().multicast(secondmonger, thirdmonger);
```

### Running filemongers

There are two ways to run a filemonger pipeline, the `#run()` and `#unit()`
methods. `#run()` does not expose the file stream and allows for a callback to
be provided which is called upon completion. This is the recommended API for
general filemonger usage. `#unit()` is a lower-level API to be used in the
creation of filemongers and returns an unsubscribed Rxjs stream of files.

#### `#run()`

```ts
firstmonger()
  .multicast(secondmonger, thirdmonger)
  .run("./src", "./dist", (err, files) => {
    console.log("Donezo");
    console.log("Output files:");
    files.forEach(console.log);
  });
```

#### `#unit()`

```ts
const loggingmonger = makeFilemonger((file$, srcDir, destDir, opts) => {
  if (typeof opts.monger !== "function") {
    throw new Error("BAD");
  }

  return opts
    .monger(file$, opts)
    .unit(srcDir, destDir)
    .do(console.log);
});
```
