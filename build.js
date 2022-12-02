import { writeFile } from 'fs'
import pkg from './package/package.json' assert { type: 'json' }

delete pkg.devDependencies

writeFile('./package/package.json', JSON.stringify(pkg, undefined, '\t'), (err) => { })