import { make, helpers } from "@filemonger/main";
import { OpaqueStream, Filemonger } from "@filemonger/types";
import { join } from "path";
import { Observable } from "rxjs";
import { transformFile, TransformOptions } from "babel-core";

const babel = Observable.bindNodeCallback(transformFile);
const { filesInDir, writeFile, f } = helpers;

export const babelmonger: Filemonger<TransformOptions> = make(
  (srcDir, destDir, opts) => {
    const options =
      Object.keys(opts).length > 0 ? { ...opts, babelrc: false } : opts;

    return filesInDir(srcDir, f.pat("**/*.js"))
      .mergeMap(file =>
        babel(join(srcDir, file), options).mergeMap(({ code, map }) => {
          const files: OpaqueStream[] = [];

          if (code) {
            files.push(writeFile(f.fullPath(f.abs(join(destDir, file))), code));
          }

          if (map) {
            files.push(
              writeFile(
                f.fullPath(f.abs(join(destDir, `${file}.map`))),
                JSON.stringify(map as any)
              )
            );
          }

          return Observable.forkJoin(files);
        })
      )
      .concat(Observable.of(null))
      .last();
  }
);
