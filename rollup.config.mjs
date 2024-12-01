import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';

export default [
  {
    input: 'sidepanel/index.js',
    output: {
      dir: 'dist/sidepanel',
      format: 'es',
    },
    plugins: [
      nodeResolve({
        jsnext: true,
        main: true,
        browser: true
      }),
      commonjs(),
      copy({
        targets: [
          {
            src: ['manifest.json', 'background.js', 'sidepanel', 'images'],
            dest: 'dist'
          }
        ]
      })
    ],
    watch: {
      include: ['**/*', 'sidepanel/index.html'],
    }
  }
];
