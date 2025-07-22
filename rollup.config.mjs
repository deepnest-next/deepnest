import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { minify } from 'rollup-plugin-swc-minify'

export default {
  input: 'main/util/geometryutil.ts',
  output: {
    file: 'build/util/umd/geometryutil.umd.js',
    format: 'umd',
    name: 'GeometryUtil',
    sourcemap: true
  },
  treeshake:true,
  plugins: [
    nodeResolve({}),
    typescript({
      tsconfig: './tsconfig.umd.json',
      compilerOptions: {
        declaration: false,
        target: 'es5',
        module: 'esnext', // Using esnext for Rollup to handle modules
      }
    }),
    minify()
  ]
};
