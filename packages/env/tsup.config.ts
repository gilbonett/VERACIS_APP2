import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/*'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node18',
  outDir: 'dist',
  minify: false,
})
