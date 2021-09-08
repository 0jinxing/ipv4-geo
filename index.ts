import got from "got";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";

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

  const outputDir = path.resolve(process.cwd(), "output");
  if (!existsSync(outputDir)) await fs.mkdir(outputDir);

  for (let geo of group.values()) {
    const text = list
      .filter(([cur]) => cur === geo)
      .map((item) => `${item[2]}/${32 - Math.log(+item[3]) / Math.log(2)}`)
      .join("\n");

    const filename = path.resolve(outputDir, `${geo}-ip.txt`);

    const t = fs.writeFile(filename, text, { encoding: "utf-8" });

    tl.push(t);
  }
  await Promise.all(tl);
})();
