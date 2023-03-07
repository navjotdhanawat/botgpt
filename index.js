#!/usr/bin/env node

import readline from "readline";
import { Configuration, OpenAIApi } from "openai";
import { hideLoader, showLoader } from "./utils.mjs";
import { initCli, clearCredentials } from "./cli.mjs";
import figlet from "figlet";
import path from "path";
import os from "os";

const filepath = path.join(os.tmpdir(), "settings.json");

const model = "gpt-3.5-turbo";
const credentials = await initCli(filepath);

const configuration = new Configuration({
  apiKey: credentials?.apiKey,
});
const openai = new OpenAIApi(configuration);

let messages = [];
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.on("line", (input) => {
  generateResponse(input);
});

// Listen for the keypress event on the stdin stream
process.stdin.on("keypress", (key, info) => {
  if (info.ctrl && info.name === "r") {
    messages = [];
  }
});

// Enable listening for keys on the stdin stream
process.stdin.setRawMode(true);
process.stdin.resume();

process.stdout.write(
  `${figlet.textSync("BOT GPT", {
    font: "Delta Corps Priest 1",
    horizontalLayout: "default",
    verticalLayout: "default",
    width: 100,
    whitespaceBreak: true,
  })}\n`
);
process.stdout.write(
  `${figlet.textSync("Welcome to Chat GPT CLI Bot  ", {
    font: "Calvin S",
    horizontalLayout: "fitted",
    verticalLayout: "fitted",
    width: 100,
    whitespaceBreak: true,
  })}\n`
);

async function generateResponse(input) {
  if (!input) {
    rl.prompt(true);
    return;
  }
  messages.push({
    role: "user",
    content: input,
  });
  try {
    showLoader();
    const res = await openai.createChatCompletion(
      {
        model,
        messages,
        // temperature: 0.5,
        max_tokens: 500,
        // top_p: 1,
        // frequency_penalty: 0,
        // presence_penalty: 0.6,
        // stop: ["\n"],
        stream: true,
      },
      { responseType: "stream" }
    );

    hideLoader();
    process.stdout.write(`Bot: `);
    let response;
    res.data.on("data", (data) => {
      const lines = data
        .toString()
        .split("\n")
        .filter((line) => line.trim() !== "");

      for (const line of lines) {
        const message = line.replace(/^data: /, "");
        if (message === "[DONE]") {
          messages.push({
            role: "system",
            content: response,
          });
          process.stdout.write(`\n`);
          rl.prompt(true);
          return; // Stream finished
        }
        try {
          const chunk = JSON.parse(message).choices[0].delta.content || "";
          if (chunk === "\n\n") continue;

          response += chunk;
          process.stdout.write(`\x1b[31m${chunk}\x1b[0m`);
        } catch (error) {
          console.error("Could not JSON parse stream message", message, error);
        }
      }
    });
  } catch (error) {
    hideLoader();
    if (error.response?.status) {
      console.error(error.response.status, error.message);
      if (error.response.status === 401) {
        clearCredentials(filepath);
      }
      error.response.data.on("data", (data) => {
        const message = data.toString();
        try {
          const parsed = JSON.parse(message);
          console.error("An error occurred during OpenAI request: ", parsed);
        } catch (error) {
          console.error("An error occurred during OpenAI request: ", message);
        }
      });
    } else {
      console.error("An error occurred during OpenAI request", error);
    }
    process.exit();
  }
}

generateResponse(
  `My name is ${credentials.username}. Please act as my personal assistant. Start conversation with "Hello [MY_NAME], How can I assist you today?"`
);
