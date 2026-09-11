import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// https://vitest.dev/config/
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    root: "./",
    environment: "node",

    include: ["src/**/*.spec.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/*.e2e-spec.ts"],

    isolate: true,
    passWithNoTests: false,
    testTimeout: 5_000,
    hookTimeout: 5_000,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,

    reporters: process.env.CI
      ? ["default", ["junit", { outputFile: "reports/junit.xml" }]]
      : ["default"],

    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "**/*.spec.ts",
        "**/*.e2e-spec.ts",
        "**/test/**",
        "**/*.module.ts",
        "**/main.ts",
        "**/*.dto.ts",
      ],
    },
  },
  plugins: [
    swc.vite({
      jsc: {
        target: "es2022",
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
      },
      module: { type: "es6" },
    }),
  ],
});
