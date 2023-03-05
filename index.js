import readline from "readline";
import fs from "fs";
import { Configuration, OpenAIApi } from "openai";
import { Loader } from "./util.mjs";
import CLI from "./init.mjs";

const cli = new CLI();

class ChatBot {
  constructor() {
    this.credentials = null;
    this.configuration = null;
    this.openai = null;
    this.messages = [];
    this.rl = null;
    this.loader = null;
  }

  async init() {
    this.loader = new Loader();
    this.credentials = await cli.init();
    this.configuration = new Configuration({
      apiKey: this.credentials?.apiKey,
    });
    this.openai = new OpenAIApi(this.configuration);
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.rl.on("line", (input) => {
      this.generateResponse(input);
    });

    this.generateResponse(
      `My name is ${this.credentials.username}. Please act as my personal assistant. Start conversation with "Hello [MY_NAME], How can I assist you today?"`
    );
  }

  async generateResponse(input) {
    this.messages.push({
      role: "user",
      content: input,
    });

    try {
      this.loader.show();
      const res = await this.openai.createChatCompletion(
        {
          model: "gpt-3.5-turbo",
          messages: this.messages,
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

      this.loader.hide();
      let response;
      res.data.on("data", (data) => {
        const lines = data
          .toString()
          .split("\n")
          .filter((line) => line.trim() !== "");

        for (const line of lines) {
          const message = line.replace(/^data: /, "");
          if (message === "[DONE]") {
            this.messages.push({
              role: "system",
              content: response,
            });
            process.stdout.write(`\n`);
            this.rl.prompt(true);
            return; // Stream finished
          }
          try {
            const chunk = JSON.parse(message).choices[0].delta.content || "";
            response += chunk;
            process.stdout.write(`\x1b[31m${chunk}\x1b[0m`);
          } catch (error) {
            console.error(
              "Could not JSON parse stream message",
              message,
              error
            );
          }
        }
      });
    } catch (error) {
      this.loader.hide();
      if (error.response?.status) {
        console.error(error.response.status, error.message);
        if (error.response.status === 401) {
          cli.clearCredentials();
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
}

const bot = new ChatBot();
bot.init();
