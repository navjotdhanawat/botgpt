#!/usr/bin/env node

import readline from "readline";
import fs from "fs";
import { Configuration, OpenAIApi } from "openai";
import { hideLoader, showLoader } from "./util.mjs";
import { initCli, clearCredentials } from "./que.mjs";

const credentials = await initCli();

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

async function generateResponse(input) {
  messages.push({
    role: "user",
    content: input,
  });
  try {
    showLoader();
    const res = await openai.createChatCompletion(
      {
        model: "gpt-3.5-turbo",
        messages: messages,
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
        clearCredentials();
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
