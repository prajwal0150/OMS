# HEAVENLY PATH SUNSARI DISTRICT — Web client

React 19 + TypeScript + Redux Toolkit + Tailwind SPA that consumes the
Express/MongoDB API in `../backend`. The repository root `README.md` documents
setup, credentials, scripts and the architecture.

```bash
npm install
npm run dev      # http://localhost:5173 (proxies /api and /uploads to :5000)
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

| Path | Purpose |
| --- | --- |
| `src/fetaures/**` | Feature modules (Public site, Auth, Member portal, Admin) |
| `src/services/api` | Axios client, single-flight token refresh, error normalisation |
| `src/store` | Redux store and typed hooks |
| `src/routes` | Route table with role/permission guards |
| `src/components` | Shared UI kit (buttons, tables, modals, states) |
| `src/types` | API envelope, models and enum mirrors of the backend |

There is no public registration anywhere: accounts are provisioned by the
Super Admin (administrators) or by administrators (members).
