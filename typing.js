const message = "Hello, world!";
let index = 0;

function typeMessage() {
  process.stdout.write(message[index]);
  index++;

  if (index === message.length) {
    process.stdout.write("\n");
    clearInterval(intervalId);
  }
}

const intervalId = setInterval(typeMessage, 100);
