import * as child_process from "node:child_process";
import * as fs from "node:fs";

const raw = child_process.execSync(`curl -s -H "Accept: application/vnd.github+json" https://api.github.com/repos/SAP/abap-file-formats/contents/file-formats`);
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
  console.log(t);
  const versions = [];
  for (let version = 1; version < 100; version++) {
    const url = `https://raw.githubusercontent.com/SAP/abap-file-formats/main/file-formats/${t}/${t}-v${version}.json`;
    const raw = child_process.execSync(`curl -s -H "Accept: application/vnd.github+json" ${url}`);
    if (raw.toString().startsWith("404")) {
      console.log("\t v" + version + " not found");
      break;
    } else {
      console.log("\t v" + version + " found");
    }
    versions.push(raw.toString());
  }

  let write = versions[0];
  if (versions.length > 2) {
    throw "todo, more than 2 versions";
  } else if (versions.length === 2) {
    const schema = {
      "$schema": "http://json-schema.org/draft-04/schema#",
      "type": "object",
      "definitions": {
        "ver1": JSON.parse(versions[0]),
        "ver2": JSON.parse(versions[1]),
        "unknown": {
          "type": "object",
          "properties": {
            "unknownVersion": {
              "type": "string",
              "pattern": "Uknown Schema Version"
            }
          },
          "additionalProperties": false,
          "required": ["unknownVersion"]
        }
      },
      "properties": {
        "formatVersion": {
          "type": "string"
        }
      },
      "if": {
        "properties": {
          "formatVersion": {
            "const": "1"
          }
        }
      },
      "then": {
        "$ref": "#/definitions/ver1"
      },
      "else": {
        "if": {
          "properties": {
            "formatVersion": {
              "const": "2"
            }
          }
        },
        "then": {
          "$ref": "#/definitions/ver2"
        },
        "else": {
          "$ref": "#/definitions/unknown"
        }
      }
    }
    write = JSON.stringify(schema, null, 2);
  }
  fs.writeFileSync(`schemas/${t}.json`, write);

  pack.contributes.jsonValidation.push({
    fileMatch: `*.${t}.json`,
    url: `https://raw.githubusercontent.com/abaplint/vscode-abap-file-formats/main/schemas/${t}.json`
  });
}

fs.writeFileSync(filename, JSON.stringify(pack, null, 2));