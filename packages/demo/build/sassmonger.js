const { makeFilemonger } = require("@filemonger/main");
const { writeFile } = require("@filemonger/helpers");
const { join, parse, relative } = require("path");
const { Observable } = require("rxjs");
const sass = Observable.bindNodeCallback(require("node-sass").render);

module.exports = makeFilemonger((entrypoint$, srcDir, destDir) => {
  return entrypoint$.flatMap(entrypoint =>
    sass({ file: join(srcDir, entrypoint) }).flatMap(result => {
      const parts = parse(entrypoint);
      const file = join(destDir, parts.dir, parts.name) + ".css";

      return writeFile(file, result.css).mapTo(relative(destDir, file));
    })
  );
});