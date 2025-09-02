[19:35:28.611] Running build in Washington, D.C., USA (East) – iad1
[19:35:28.612] Build machine configuration: 4 cores, 8 GB
[19:35:28.628] Cloning github.com/yudikuse/qwip (Branch: main, Commit: 6cded3a)
[19:35:28.872] Cloning completed: 243.000ms
[19:35:30.698] Restored build cache from previous deployment (7jxFm6du8cVtRvFFwvSdGR7BFv6h)
[19:35:31.257] Running "vercel build"
[19:35:31.667] Vercel CLI 46.1.1
[19:35:31.974] Installing dependencies...
[19:35:44.664] 
[19:35:44.664] up to date in 12s
[19:35:44.664] 
[19:35:44.664] 158 packages are looking for funding
[19:35:44.664]   run `npm fund` for details
[19:35:44.708] Detected Next.js version: 15.0.2
[19:35:44.712] Running "npm run vercel-build"
[19:35:44.830] 
[19:35:44.830] > qwip-mvp@0.1.0 vercel-build
[19:35:44.830] > prisma db push && prisma generate && next build
[19:35:44.830] 
[19:35:45.262] Prisma schema loaded from prisma/schema.prisma
[19:35:45.265] Datasource "db": PostgreSQL database "postgres", schema "public" at "db.prisma.io:5432"
[19:35:46.596] 
[19:35:46.597] The database is already in sync with the Prisma schema.
[19:35:46.597] 
[19:35:46.597] Running generate... (Use --skip-generate to skip the generators)
[19:35:46.731] [2K[1A[2K[GRunning generate... - Prisma Client
[19:35:46.814] [2K[1A[2K[G✔ Generated Prisma Client (v5.22.0) to ./node_modules/@prisma/client in 81ms
[19:35:46.814] 
[19:35:47.380] Prisma schema loaded from prisma/schema.prisma
[19:35:47.581] 
[19:35:47.581] ✔ Generated Prisma Client (v5.22.0) to ./node_modules/@prisma/client in 58ms
[19:35:47.581] 
[19:35:47.581] Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
[19:35:47.581] 
[19:35:47.581] Tip: Interested in query caching in just a few lines of code? Try Accelerate today! https://pris.ly/tip-3-accelerate
[19:35:47.581] 
[19:35:47.603] ┌─────────────────────────────────────────────────────────┐
[19:35:47.603] │  Update available 5.22.0 -> 6.15.0                      │
[19:35:47.603] │                                                         │
[19:35:47.604] │  This is a major update - please follow the guide at    │
[19:35:47.604] │  https://pris.ly/d/major-version-upgrade                │
[19:35:47.604] │                                                         │
[19:35:47.604] │  Run the following to update                            │
[19:35:47.605] │    npm i --save-dev prisma@latest                       │
[19:35:47.605] │    npm i @prisma/client@latest                          │
[19:35:47.605] └─────────────────────────────────────────────────────────┘
[19:35:48.715]    ▲ Next.js 15.0.2
[19:35:48.715] 
[19:35:48.742]    Creating an optimized production build ...
[19:35:56.509]  ✓ Compiled successfully
[19:35:56.516]    Linting and checking validity of types ...
[19:36:03.019] Failed to compile.
[19:36:03.019] 
[19:36:03.020] ./src/app/api/ads/route.ts:53:7
[19:36:03.020] Type error: Type '{ description: string; priceCents: number; city: string; uf: string; lat: number; lng: number; radiusKm: number; expiresAt: Date; isActive: boolean; }' is not assignable to type '(Without<AdCreateInput, AdUncheckedCreateInput> & AdUncheckedCreateInput) | (Without<AdUncheckedCreateInput, AdCreateInput> & AdCreateInput)'.
[19:36:03.020]   Type '{ description: string; priceCents: number; city: string; uf: string; lat: number; lng: number; radiusKm: number; expiresAt: Date; isActive: boolean; }' is not assignable to type 'Without<AdUncheckedCreateInput, AdCreateInput> & AdCreateInput'.
[19:36:03.020]     Type '{ description: string; priceCents: number; city: string; uf: string; lat: number; lng: number; radiusKm: number; expiresAt: Date; isActive: boolean; }' is missing the following properties from type 'AdCreateInput': title, centerLat, centerLng, seller
[19:36:03.021] 
[19:36:03.021] [0m [90m 51 |[39m[0m
[19:36:03.021] [0m [90m 52 |[39m     [36mconst[39m ad [33m=[39m [36mawait[39m prisma[33m.[39mad[33m.[39mcreate({[0m
[19:36:03.021] [0m[31m[1m>[22m[39m[90m 53 |[39m       data[33m,[39m[0m
[19:36:03.021] [0m [90m    |[39m       [31m[1m^[22m[39m[0m
[19:36:03.021] [0m [90m 54 |[39m       select[33m:[39m { id[33m:[39m [36mtrue[39m }[33m,[39m[0m
[19:36:03.021] [0m [90m 55 |[39m     })[33m;[39m[0m
[19:36:03.021] [0m [90m 56 |[39m[0m
[19:36:03.084] Error: Command "npm run vercel-build" exited with 1
