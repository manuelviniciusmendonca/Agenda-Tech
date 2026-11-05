# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

## Login and signup links

The landing page sends login and signup calls to the app's `/login` and
`/cadastro` routes. During development, it defaults to the frontend at
`http://localhost:5173`. If the app uses another address, set `VITE_APP_URL`.
For production, set `VITE_APP_URL` to the app's public base URL when it is
hosted on a different origin (for example, `VITE_APP_URL=https://app.example.com`).
If both are hosted on the same origin, the current origin is used automatically.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
