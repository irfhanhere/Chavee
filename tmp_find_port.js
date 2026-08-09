import net from 'net';

const checkPort = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // Port is in use (something is listening on it)
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(false); // Port is free
    });
    server.listen(port, 'localhost');
  });
};

(async () => {
  for (let port = 5173; port <= 5180; port++) {
    const inUse = await checkPort(port);
    if (inUse) {
      console.log(`Port ${port} is active.`);
    }
  }
})();
