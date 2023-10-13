import * as child_process from "node:child_process";
import * as fs from "node:fs";

const raw = child_process.execSync(`curl -H "Accept: application/vnd.github+json" https://api.github.com/repos/SAP/abap-file-formats/contents/file-formats`);
const json = JSON.parse(raw);
const types = [];
for (const row of json) {
  if (row.type === "dir") {
    types.push(row.name);
  }
}

const filename = "./package.json";
const pack = JSON.parse(fs.readFileSync(filename, "utf-8").toString());

pack.contributes.jsonValidation = [];
for (const t of types) {
  pack.contributes.jsonValidation.push({
    fileMatch: `*.${t}.json`,
    url: `https://raw.githubusercontent.com/SAP/abap-file-formats/main/file-formats/${t}/${t}-v1.json`
  });
}

fs.writeFileSync(filename, JSON.stringify(pack, null, 2));