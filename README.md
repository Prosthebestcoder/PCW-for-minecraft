# PCW-for-minecraft
By beondspace


## Dependency installation

If your environment enforces a private npm mirror, run installs with an explicit registry override:

```bash
npm install --registry=$NPM_REGISTRY_URL
```

If installs fail with `403 Forbidden`, confirm your network policy allows access to your configured registry and that no global deprecated `http-proxy` npm config is injected. This repository ships a local `.npmrc` with explicit registry defaults so installs are deterministic.
