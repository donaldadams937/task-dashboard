# Unbeltedtech AI

Unbeltedtech is a private, browser-based AI workspace for ideation, engineering,
analysis, and exploration. It runs language models directly on the user's device
with WebGPU, so it does not require an account or API key.

## Local AI models

- **UT Pro** uses Llama 3.2 3B for higher-quality responses. Its first download is
  approximately 2 GB.
- **UT Flash** uses Qwen3 0.6B for faster startup and lower memory use. Its first
  download is approximately 500 MB.

Model files are cached by the browser after the first download. Prompts and model
inference stay on the user's device.

## Browser requirements

Local inference requires WebGPU. Use a recent version of Chrome or Edge on a
compatible device. Performance and available memory depend on the device's GPU.

## Development

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

On Windows, run Vite directly if the environment-variable syntax in the start
script is unavailable:

```powershell
npx vite --port 3000
```

## Scripts

- `npm start` - Start the Vite development server
- `npm test` - Run the Vitest suite
- `npm run build` - Create a production build
- `npm run preview` - Preview the production build

## Technology

- React
- Vite
- WebLLM
- WebGPU
- Tailwind CSS
- Vitest and React Testing Library

## Privacy

Unbeltedtech does not send prompts to an inference API. Model files are downloaded
from the WebLLM model host and cached locally; all response generation runs in the
browser.
