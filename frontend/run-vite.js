import { createServer } from 'vite';

(async () => {
  try {
    const server = await createServer({
      root: process.cwd(),
      logLevel: 'info'
    });
    await server.listen();
    server.printUrls();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
