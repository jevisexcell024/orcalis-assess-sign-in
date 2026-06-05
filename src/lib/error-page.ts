export interface ErrorPageOptions {
  /** Short reason shown under the heading (e.g. the thrown error message). */
  reason?: string;
  /** Extra hint shown in a code block (e.g. env-var setup instructions). */
  hint?: string;
}

export function renderErrorPage(opts: ErrorPageOptions = {}): string {
  const { reason, hint } = opts;

  const reasonHtml = reason
    ? `<pre class="reason">${escHtml(reason)}</pre>`
    : "";

  const hintHtml = hint
    ? `<details open><summary>How to fix</summary><pre class="hint">${escHtml(hint)}</pre></details>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 40rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1rem; }
      pre.reason { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; border-radius: 0.375rem; padding: 0.75rem 1rem; text-align: left; font-size: 0.8125rem; white-space: pre-wrap; word-break: break-all; margin: 0 0 1rem; }
      details { text-align: left; margin: 0 0 1.5rem; }
      summary { cursor: pointer; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
      pre.hint { background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 0.375rem; padding: 0.75rem 1rem; font-size: 0.8125rem; white-space: pre-wrap; word-break: break-all; margin: 0; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      ${reasonHtml}
      ${hintHtml}
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
