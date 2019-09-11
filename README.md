[![Yagura Logo](logo.png)](http://dev.mekomidev.com/yagura)

  A solid, event-based layered web framework - written in TypeScript for [Node.js](http://nodejs.org)


[![npm (scoped)](https://img.shields.io/npm/v/@yagura/yagura)](https://npmjs.com/@yagura/yagura)
![Travis (.com)](https://img.shields.io/travis/com/mekomidev/yagura)
[![Coverage Status](https://coveralls.io/repos/github/mekomidev/yagura/badge.svg?branch=master)](https://coveralls.io/github/mekomidev/yagura?branch=master)
<!-- [![npm](https://img.shields.io/npm/dm/@yagura/yagura)](https://npmjs.com/@yagura/yagura) -->

## Features

  * Promise-based asynchronous API in TypeScript
  * Modular and stackable **event-based** structure
    * Stack your `Overlay`s
    * Process an event as it trickles down through each `Overlay` sequentially
    * Process events in parallel by using a `ParallelScaffold`
  * Dependency management
    * Implement `Service`s and inject dependencies through the `ServiceContainer`
  * Distributed event processing ([**upcoming** in v0.3.0](https://github.com/mekomidev/yagura/wiki/Roadmap))


## Philosophy

> Yagura (櫓, 矢倉) is the Japanese word for "tower" or "scaffold"

In a reality where the nature of software development is becoming increasingly more iterative, it's becoming harder and harder to foresee how much complexity the project will require, which in turn leads to either under- or over-engineering.

**Solution:** build your application as a modular event-handling tower, where, as events trickle from the top, each Overlay can provide:
 - Data processing
 - Routing
 - Middleware
 - Additional functionality
 - Backwards compatibility for bottom layers

...and more! By laying out your code in a clear, *sequential event processing scaffold*, you can freely* and easily add/remove entire parts of an application while maintaining integrity

(<sub><sup>*as long as you've decoupled it properly; we're not responsible for developers writing an entire real-time "BigData" processing service with an HTTP API as a single Overlay. Always follow good programming practices!</sup></sub>)

## Docs & Community

<!--   * [Website and Documentation](http://dev.mekomidev.com/yagura) (*coming soon!*)
  * [Wiki](https://github.com/mekomidev/yagura/wiki) (*coming soon!*)
  * [Online community forum](https://dev.mekomidev.com/forum/category/10/yagura) for support and discussion (*coming soon!*) -->

### Security issues

If you discover a security vulnerability in Yagura, please see [Security Policies and Procedures](SECURITY.md).

## Getting started

  The quickest way to get started with Yagura is to create a new Node.js project with Yagura as a dependency:

```bash
$ npm install @yagura/yagura
```

Check out **Yagura's extension packages** to develop specific types of applications:

 - [`@yagura/http`](https://github.com/mekomidev/yagura-http) HTTP server and API development tools (supports `HTTP/2`!)
 - [`@yagura/realtime`](https://github.com/mekomidev/yagura-realtime) base Overlays for realtime-based server development (such as *MQTT*, *WebSockets*, *raw sockets (TCP/UDP)*, etc.)
 <!-- - [`@yagura/mqtt`](https://github.com/mekomidev/yagura-mqtt) MQTT broker and event router -->
  <!-- - [`@yagura/parallel`](https://github.com/mekomidev/yagura-parallel) set of tools for distributed event processing; to be used with the [`seirou`](https://github.com/mekomidev/seirou) event dispatch server -->

## Contribution guide

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
