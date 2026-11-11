import { defineConfig } from 'vite';

function markdownUtf8(server) {
  server.middlewares.use((req, res, next) => {
    // Static Markdown needs an explicit charset for direct browser navigation.
    if (/\.md$/i.test((req.url || '').split('?')[0])) {
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    }
    next();
  });
}

export default defineConfig({
  plugins: [{
    name: 'markdown-utf8',
    configureServer: markdownUtf8,
    configurePreviewServer: markdownUtf8,
  }],
});
