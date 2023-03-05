let interval;

export const showLoader = () => {
  let count = 0;

  interval = setInterval(() => {
    process.stdout.write(`\r${".".repeat(count)}`);
    count = (count + 1) % 4;
  }, 500);
};

export const hideLoader = () => {
  clearInterval(interval);
  process.stdout.write("\r \r");
};

export const initMessage = (message) => {
  let index = 0;
  const typeMessage = () => {
    process.stdout.write(message[index]);
    index++;

    if (index === message.length) {
      process.stdout.write("\n");
      clearInterval(intervalId);
    }
  };

  const intervalId = setInterval(typeMessage, 50);
};
