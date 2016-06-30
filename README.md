 <img src="assets/images/sugo-cloud-banner.png" alt="Title Banner"
                    height="148"
                    style="height:148px"
/>


<!---
This file is generated by ape-tmpl. Do not update manually.
--->

<!-- Badge Start -->
<a name="badges"></a>

[![Build Status][bd_travis_com_shield_url]][bd_travis_com_url]
[![npm Version][bd_npm_shield_url]][bd_npm_url]
[![JS Standard][bd_standard_shield_url]][bd_standard_url]

[bd_repo_url]: https://github.com/realglobe-Inc/sugo-cloud
[bd_travis_url]: http://travis-ci.org/realglobe-Inc/sugo-cloud
[bd_travis_shield_url]: http://img.shields.io/travis/realglobe-Inc/sugo-cloud.svg?style=flat
[bd_travis_com_url]: http://travis-ci.com/realglobe-Inc/sugo-cloud
[bd_travis_com_shield_url]: https://api.travis-ci.com/realglobe-Inc/sugo-cloud.svg?token=aeFzCpBZebyaRijpCFmm
[bd_license_url]: https://github.com/realglobe-Inc/sugo-cloud/blob/master/LICENSE
[bd_codeclimate_url]: http://codeclimate.com/github/realglobe-Inc/sugo-cloud
[bd_codeclimate_shield_url]: http://img.shields.io/codeclimate/github/realglobe-Inc/sugo-cloud.svg?style=flat
[bd_codeclimate_coverage_shield_url]: http://img.shields.io/codeclimate/coverage/github/realglobe-Inc/sugo-cloud.svg?style=flat
[bd_gemnasium_url]: https://gemnasium.com/realglobe-Inc/sugo-cloud
[bd_gemnasium_shield_url]: https://gemnasium.com/realglobe-Inc/sugo-cloud.svg
[bd_npm_url]: http://www.npmjs.org/package/sugo-cloud
[bd_npm_shield_url]: http://img.shields.io/npm/v/sugo-cloud.svg?style=flat
[bd_standard_url]: http://standardjs.com/
[bd_standard_shield_url]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg

<!-- Badge End -->


<!-- Description Start -->
<a name="description"></a>

Cloud server of SUGOS

<!-- Description End -->


<!-- Overview Start -->
<a name="overview"></a>


SUGO-Cloud works as a hub to connect [SUGO-Spots][sugo_spot_url] and [SUGO-Terminals][sugo_terminal_url].



<!-- Overview End -->


<!-- Sections Start -->
<a name="sections"></a>

<!-- Section from "doc/guides/00.Requirements.md.hbs" Start -->

<a name="section-doc-guides-00-requirements-md"></a>
Requirements
-----

<a href="https://nodejs.org">
  <img src="assets/images/nodejs-banner.png"
       alt="banner"
       height="40"
       style="height:40px"
  /></a>
<a href="https://docs.npmjs.com/">
  <img src="assets/images/npm-banner.png"
       alt="banner"
       height="40"
       style="height:40px"
  /></a>

+ [Node.js ( >=6 )][node_download_url]
+ [npm ( >=3 )][npm_url]

[node_download_url]: https://nodejs.org/en/download/
[npm_url]: https://docs.npmjs.com/


<!-- Section from "doc/guides/00.Requirements.md.hbs" End -->

<!-- Section from "doc/guides/01.Installation.md.hbs" Start -->

<a name="section-doc-guides-01-installation-md"></a>
Installation
-----

```bash
$ npm install sugo-cloud --save
```


<!-- Section from "doc/guides/01.Installation.md.hbs" End -->

<!-- Section from "doc/guides/02.Usage.md.hbs" Start -->

<a name="section-doc-guides-02-usage-md"></a>
Usage
---------

```javascript
#!/usr/bin/env node

/**
 * This is an example to setup cloud server
 */

'use strict'

const sugoCloud = require('sugo-cloud')

const co = require('co')

co(function * () {
  // Start sugo-cloud server
  let cloud = yield sugoCloud({
    // Options
    port: 3000
  })

  console.log(`SUGO Cloud started at port: ${cloud.port}`)

  return cloud
}).catch((err) => { /* ... */ })

```

| URL | Description |
| --- | ----------- |
| `/spots` | WebSocket namespace for [SUGO-Spots][sugo_spot_url] |
| `/terminals` | WebSocket namespace for [SUGO-Terminals][sugo_terminal_url] |
| `/observers` | WebSocket namespace for [SUGO-Observers][sugo_observer_url] |


<!-- Section from "doc/guides/02.Usage.md.hbs" End -->

<!-- Section from "doc/guides/03.Advanced Usage.md.hbs" Start -->

<a name="section-doc-guides-03-advanced-usage-md"></a>
Advanced Usage
---------

```javascript
#!/usr/bin/env node

/**
 * This is an example to setup cloud server with advanced options
 */

'use strict'

const sugoCloud = require('sugo-cloud')

const co = require('co')

co(function * () {
  let cloud = yield sugoCloud({
    port: 3000,
    // HTTP route handler with koa
    endpoints: {
      '/api/user/:id': {
        'GET': (ctx) => {
          let { id } = ctx.params
          /* ... */
          ctx.body = { /* ... */ }
        }
      }
    },
    // Custom koa middlewares
    middlewares: [
      co.wrap(function * customMiddleware (ctx, next) {
        /* ... */
        yield next()
      })
    ],
    // Directory to server static files
    public: [
      'public'
    ],
    // Using redis server as storage
    storage: {
      // Redis setup options (see https://github.com/NodeRedis/node_redis)
      redis: {
        host: '127.0.0.1',
        port: '6379',
        db: 1
      }
    }
  })

  console.log(`SUGO Cloud started at port: ${cloud.port}`)

  return cloud
}).catch((err) => console.error(err))

```


<!-- Section from "doc/guides/03.Advanced Usage.md.hbs" End -->


<!-- Sections Start -->


<!-- LICENSE Start -->
<a name="license"></a>

License
-------
This software is released under the [Apache-2.0 License](https://github.com/realglobe-Inc/sugo-cloud/blob/master/LICENSE).

<!-- LICENSE End -->


<!-- Links Start -->
<a name="links"></a>

Links
------

+ [sugos][sugos_url]
+ [sugo-spot][sugo_spot_url]
+ [sugo-terminal][sugo_terminal_url]
+ [sugo-observer][sugo_observer_url]
+ [JSON API][json_api_url]
+ [Koa][koa_url]

[sugos_url]: https://github.com/realglobe-Inc/sugos
[sugo_spot_url]: https://github.com/realglobe-Inc/sugo-spot
[sugo_terminal_url]: https://github.com/realglobe-Inc/sugo-terminal
[sugo_observer_url]: https://github.com/realglobe-Inc/sugo-observer
[json_api_url]: http://jsonapi.org
[koa_url]: https://github.com/koajs/koa

<!-- Links End -->
