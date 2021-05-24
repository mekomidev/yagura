[![Yagura Logo](logo.png)](http://dev.mekomidev.com/yagura)

  A modular, unopinonated event-based web framework - written in TypeScript for [Node.js](http://nodejs.org)

  This package is currently undergoing development! [Follow us on Twitter](https://twitter.com/mekomidev) for updates and release announcements!


[![npm (scoped)](https://img.shields.io/npm/v/@yagura/yagura)](https://npmjs.com/@yagura/yagura)
![Travis (.com)](https://img.shields.io/travis/com/mekomidev/yagura)
[![Coverage Status](https://coveralls.io/repos/github/mekomidev/yagura/badge.svg?branch=master)](https://coveralls.io/github/mekomidev/yagura?branch=master)
[![npm](https://img.shields.io/npm/dm/@yagura/yagura)](https://npmjs.com/@yagura/yagura)

## Why use Yagura?

  * **Write solid code**: Promise-based, strongly typed API in TypeScript
  * **Reuse your code**: Modular and flexible **event-based** structure
    * Stack your `Layer`s
    * Process an event as it trickles down through each `Layer` sequentially
    * Use `Service`s to connect your application with the outside world (DBs, other APIs, etc.)
  * **Scale your app**: distributed event processing ([**coming soon**](https://github.com/mekomidev/yagura/wiki/Roadmap))
  * **Do it your way**: Yagura gives you an unopinionated structure - you choose how to implement your solution


*Do you use Yagura? Tell us more, we'd love to learn how to make it better: [Twitter](https://twitter.com/mekomidev)*

## Philosophy

> Yagura (櫓, 矢倉) is the Japanese word for "tower" or "scaffold"

As software development keeps becoming more iterative, it's becoming harder and harder to foresee how much complexity the project will increase, which in turn leads to either under- or over-engineering.

**Solution:** build your application as a modular event-handling pipeline, where, as events trickle down, each Layer can provide:
 - Data processing
 - Routing
 - Middleware
 - Additional functionality
 - Backwards compatibility for bottom layers

...and more! By laying out your code in a clear, *sequential event processing scaffold*, you can freely* and easily add/remove entire parts of an application while maintaining integrity

(<sub><sup>*as long as you've decoupled it properly; we're not responsible for developers writing an entire real-time "BigData" processing service with an HTTP API as a single Layer. Always follow good programming practices!</sup></sub>)

## Example
```typescript
import { Yagura } from '@yagura/yagura'
import ... from '...' // roll out your own layers and services!

const app: Yagura = await Yagura.start(
  // Layers
  // quickly remove, reorder and replace each of the lines to reconfigure your pipeline with ease!
  [
      new MiddlewareLayer(),              // Generic HTTP middleware (ie. parse headers, request logging, handing multi-part...)
      new AuthenticationLayer({           // Authentication middleware (ie. verify whether user is authenticated, provide login routes...)
          requireLogin: true
      }),
      new ValidationLayer(),              // Request validation middleware (ie. verify request format, check required parameters...)
      new ResourceLayer(),                // HTTP resource layer (ie. perform queries, fetch data, elaborate response...)
      new ParsingLayer(),                 // Response parsing (ie. ensure object serialization, strip secret data, encode text according to locale...)
  ],
  // Services
  [
      new CoolLogger({                // Custom logger
          minLevel: 'debug'
      }),
      new CrashNotifier({             // Crash notification utility
          email: 'admin@example.com'
      }),
      new DatabaseConnection({        // Database access
          host: 'db.secretserver.com',
          username: 'root',
          password: 'S0meTh1ngStr0nG!',
          db: 'cool-data'
      }),
      new WebServer({                 // Simple HTTP web server
          port: 3000,
          https: true
      })
  ]
);
```

## Docs & Community

<!--   * [Website and Documentation](http://dev.mekomi.dev/yagura) (*coming soon!*)
  * [Wiki](https://github.com/mekomidev/yagura/wiki) (*coming soon!*)
  * [Online community forum](https://developers.mekomi.dev/forum/category/10/yagura) for support and discussion (*coming soon!*) -->

### Security issues

If you discover a security vulnerability in Yagura, please see [Security Policies and Procedures](SECURITY.md).

## Getting started

  The quickest way to get started with Yagura is to create a new Node.js project with Yagura as a dependency:

```bash
$ npm install @yagura/yagura
```

Check out **Yagura's extension packages** to develop specific types of applications:

 - [`@yagura/http`](https://github.com/mekomidev/yagura-http) HTTP server and API development tools (supports `HTTP/2`!)
 - [`@yagura/realtime`](https://github.com/mekomidev/yagura-realtime) base Layers for realtime-based server development (such as *MQTT*, *WebSockets*, *raw sockets (TCP/UDP)*, etc.)
 <!-- - [`@yagura/realtime-mqtt`](https://github.com/mekomidev/yagura-mqtt) MQTT broker and event router -->
  <!-- - [`@yagura/hokura`](https://github.com/mekomidev/hokura) example application implementing distributed event dispatch; -->

## Contribution guide

TBD

### Tests

  To run the test suite, first install the dependencies, then run `npm run test`:

```bash
$ npm install --devDependencies
$ npm run test
```

## People

The original author of Yagura is [James Kerber](https://github.com/kerberjg)

[List of all contributors](https://github.com/mekomidev/yagura/graphs/contributors)

## License

  [GNU GPLv3](LICENSE)
