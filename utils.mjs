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
