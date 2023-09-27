#! /usr/bin/env node

import WritableStream = NodeJS.WritableStream;
import * as fs from "fs";

import { Command } from 'commander';

import { Schema, } from "./model";
import { avroToTypeScript } from "./index";

interface Opts {
  input?: string;
  output?: string;
}

main();

async function main() {
  const program = new Command();
  program
    .option("-i, --input <file>", "Input file. If not present, defaults to STDIN")
    .option("-o, --output <file>", "Output file. If not present, defaults to STDOUT");

  const opts = program.parse(process.argv).opts();
  const schema = await readSchema(opts);
  const ts = avroToTypeScript(schema).split("\n");

  await writeTypes(opts, ts);
}

function readSchema(opts: Opts): Promise<Schema> {
  const stream = opts.input ? fs.createReadStream(opts.input) : process.stdin;
  stream.setEncoding("utf-8");

  return new Promise((resolve, reject) => {
    const chunks = [];

    stream.on("error", reject);

    stream.on("data", (chunk) => {
      chunks.push(chunk);
    });

    stream.on("end", () => {
      resolve(JSON.parse(chunks.join("")))
    });
  });
}

function writeTypes(opts: Opts, data: string[]): Promise<void> {
  const stream = opts.output ? fs.createWriteStream(opts.output, { encoding: "utf-8" }) : process.stdout;

  return writeToStream(stream, data);
}

function writeToStream(stream: WritableStream, data: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    let isFull = false;

    stream.once("error", (err) => {
      // we don't care about draining any more.
      stream.removeAllListeners("drain");

      reject(err);
    });

    for (let lineNumber = 0; lineNumber < data.length; lineNumber++) {
      const line = data[lineNumber];
      isFull = !(stream.write(`${line}\n`));

      if (isFull) {
        stream.once("drain", () => {
          // remove the previously assigned error handler as we don't need it now
          stream.removeAllListeners("error");

          // add 1 because we've written the current line
          writeToStream(stream, data.slice(lineNumber + 1))
            .then(resolve, reject);
        });

        return;
      }
    }

    resolve();
  });
}
