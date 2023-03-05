class Loader {
  constructor() {
    this.interval = null;
  }

  show() {
    let count = 0;

    this.interval = setInterval(() => {
      process.stdout.write(`\r${".".repeat(count)}`);
      count = (count + 1) % 4;
    }, 500);
  }

  hide() {
    clearInterval(this.interval);
    process.stdout.write("\r \r");
  }
}

class Message {
  constructor() {
    this.index = 0;
    this.intervalId = null;
  }

  init(message) {
    const typeMessage = () => {
      process.stdout.write(message[this.index]);
      this.index++;

      if (this.index === message.length) {
        process.stdout.write("\n");
        clearInterval(this.intervalId);
      }
    };

    this.intervalId = setInterval(typeMessage, 50);
  }
}

export { Loader, Message };
