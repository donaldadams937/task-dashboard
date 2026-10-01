# UnbeltedTech

UnbeltedTech is a laptop-first desktop AI builder. Describe an application and its OpenAI-powered agent creates a dedicated project, writes the implementation, installs dependencies, runs tests and builds, and repairs failures.

## Safety model

- The OpenAI API key is encrypted with Electron `safeStorage` and remains in the main process.
- The renderer has no Node.js access and communicates through a narrow context-isolated preload bridge.
- File operations are restricted to the active project workspace.
- Commands run without a shell and are limited to `git`, `node`, `npm`, and `npx`.
- Agent runs stop after 30 model/tool steps and command runs time out after two minutes.

Generated applications can execute third-party package scripts through `npm` or `npx`. Review generated code before using it with sensitive data or distributing it.

## Run locally

Requires Node.js 20 or newer and an OpenAI API key.

```powershell
npm install
npm start
```

On first launch, open Settings, enter the API key, choose an OpenAI model, and select the directory where applications should be created.

## Build a Windows installer

```powershell
npm run package
```

The installer is written to `release/`.

## Development commands

- `npm start` — run Vite and Electron together
- `npm run start:web` — preview the renderer without desktop capabilities
- `npm test` — run component and workspace-policy tests
- `npm run build` — build the renderer
- `npm run package:dir` — create an unpacked desktop application
