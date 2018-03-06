import { resolve } from "path";
import {
  BindOperator,
  Filemonger,
  IDict,
  Run,
  Transform,
  WriteTo,
  IFilemonger,
  Opaque
} from "@filemonger/types";
import * as helpers from "./helpers";
import { Observable } from "rxjs";

const { f, tmp } = helpers;

export { helpers };

const isSubscribable = (thing: any): thing is Observable<Opaque> =>
  thing && thing.subscribe;

const isPromise = (thing: any): thing is Promise<Opaque> => thing && thing.then;

export const make = <Opts extends IDict<any>>(
  transform: Transform<Opts>
): Filemonger<Opts> => (srcDir = "", opts = Object.create({})) => {
  const writeTo: WriteTo = (destDir: string) => {
    const resolvedSrcDir = f.dir(f.abs(resolve(srcDir)));
    const resolvedDestDir = f.dir(f.abs(resolve(destDir)));
    const result = transform(resolvedSrcDir, resolvedDestDir, opts);

    if (isSubscribable(result)) {
      return result.map(() => {});
    }

    if (isPromise(result)) {
      return Observable.fromPromise(result).map(() => {});
    }

    return Observable.of(result).map(() => {});
  };

  const run: Run = (destDir, done = () => {}) =>
    writeTo(destDir).subscribe({ complete: done, error: done });

  const bind: BindOperator = factory =>
    make((_, destDir) =>
      tmp(tmpDir =>
        writeTo(tmpDir).mergeMap(() => factory(tmpDir).writeTo(destDir))
      )
    )();

  return {
    bind,
    writeTo,
    run
  };
};

export const merge = (...instances: IFilemonger[]): IFilemonger =>
  make((_, destDir) =>
    Observable.combineLatest(instances.map(m => m.writeTo(destDir)))
  )();
