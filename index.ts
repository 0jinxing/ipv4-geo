import path from "path";
import { existsSync, promises as fsPromises } from "fs";
import got from "got";

(async function main() {
  const { body: text } = await got.get(
    "http://ftp.apnic.net/apnic/stats/apnic/delegated-apnic-latest"
  );

  // ['CN', 'ipv4', '1.0.1.0', '256']
  const list = text
    .split(/\r?\n/)
    .filter((str) => !str.match(/^\s*#/) && !!str.trim())
    .map((t) => t.split("|").slice(1, 5))
    .filter(([, i]) => i.match(/ipv4/i));

  const group = new Set(list.map((i) => i[0]));

  const tl: Array<Promise<any>> = [];

  const distDir = path.resolve(process.cwd(), "dist");
  if (!existsSync(distDir)) await fsPromises.mkdir(distDir);

  for (let geo of group.values()) {
    const text = list
      .filter(([cur]) => cur === geo)
      .map((item) => `${item[2]}/${32 - Math.log(+item[3]) / Math.log(2)}`)
      .join("\n");

    const filename = path.resolve(distDir, `${geo}.txt`);

    const t = fsPromises.writeFile(filename, text, { encoding: "utf-8" });

    tl.push(t);
  }
  await Promise.all(tl);
})();
