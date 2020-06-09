# @leonardpauli/utils
*Personal JS utility library*

__NOTE, TODO:__
- *(unstable branch, WIP merging old with new)*
- *(only see this section + src)*
- clean up
- ensure browser + nodejs compatible
- prefer existing libs (eg. rambda + chalk + readline + koa + request/node-fetch + etc) (or not? goal is towards rim)
- (prefer existing libs when working with others, as community support etc) (though still, goal is towards rim)
- add testing + usage example + etc
- publish to npm? or always use through github?

__Usage:__
- mkdir my_app && cd "$_"
- npm init -y
- npm i github:leonardpauli/js-utils#jun2020
- vi main.js

		const {dlog} = require('@leonardpauli/utils/src/log.js')
		dlog({at: 'hello', some: 222})

- node main.js
- *(then, to allow editing + debugging:)*
- (cd .. && git clone git@github.com:leonardpauli/js-utils.git && cd js-utils && npm link)
- npm link @leonardpauli/utils

__Usage old:__
- `npm i @leonardpauli/utils`
- `import x from '@leonardpauli/utils/lib/y'`
- *(see `module/src/*` + `*.test.js` for examples)*
 
__Note:__
- use eg. `npm i ramda` for basic/fundamental FP helpers
- this repo is for more specific utils

### Contribute

Feel free to fork and send PR's :)

Copyright © Leonard Pauli, 2018

Licence: GNU Affero General Public License v3.0 or later.
For commersial / closed-source / custom licencing needs, please contact us.
