import fs from "fs";
import readline from "readline";
import { once } from "events";

const initCli = async (filePath) => {
  // Define the list of questions and their default answers
  const questions = [
    { id: "username", text: "What is your name?", defaultAnswer: "" },
    { id: "apiKey", text: "Open AI API Key?", defaultAnswer: "" },
  ];

  // Read the user input from the file, if it exists
  let credentials = {};
  if (fs.existsSync(filePath)) {
    credentials = JSON.parse(fs.readFileSync(filePath));
  }

  if (credentials.apiKey && credentials.username) {
    return credentials;
  }

  // Create a new readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Ask each question in sequence
  const askQuestions = async () => {
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const credentialsValue =
        credentials[question.id] || question.defaultAnswer;

      const answer = await new Promise((resolve) => {
        rl.question(`\x1b[31m ${question.text}\x1b[0m `, resolve);
      });

      credentials[question.id] = answer;
    }

    // Save the user input to the file
    fs.writeFileSync(filePath, JSON.stringify(credentials));

    // Close the readline interface
    rl.close();
    return credentials;
  };

  // Listen for the "SIGINT" event to close the readline interface
  once(process, "SIGINT", () => {
    rl.close();
  });

  // Ask the questions and handle the user's input
  return await askQuestions();
};

const clearCredentials = () => {
  fs.unlinkSync(filePath);
};

export { initCli, clearCredentials };
