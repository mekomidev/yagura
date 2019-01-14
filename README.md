[![Yagura Logo](logo.png)](http://dev.mekomidev.com/yagura)

  Yagura is a TypeScript web framework for [Node.js](http://nodejs.org), built with modern technologies in mind.

## Features

  * Modularity-oriented 
  * Based on the MVC paradigm
  * Promise-based API
  * Stack functionality
    * Per-controller with class inheritance
    * Per-app with Overlays

### Controllers

### Overlays

## Philosophy

> Yagura is the Japanese word for "pagoda"

The project was born from a web development reality where many projects share single features, but code is hard to share without taking time to create an NPM module.

Yagura solves this by allowing developers to stack functionality on a per-controller basis, by making it as easy as inheriting a class!

The same principle can also be applied app-wide, where you can stack "extensions" (called *Overlays*) to an app just by editing a JSON config file! (or specifying so in the source code)

## Docs & Community

  * [Website and Documentation](http://dev.mekomidev.com/yagura) (*coming soon!*)
  * [Wiki](https://github.com/mekomidev/yagura/wiki) (*coming soon!*)
  * [Online community forum](https://dev.mekomidev.com/forum/category/10/yagura) for support and discussion (*coming soon!*)

### Security Issues

If you discover a security vulnerability in Yagura, please see [Security Policies and Procedures](SECURITY.md).

## Quick Start

  The quickest way to get started with Yagura is to create a new Node.js project with Yagura as a dependency:

```bash
$ npm install yagura
```

  Write a simple example:
```js
// Future example
```

  Start the server:

```bash
$ npm start
```

## Contribution guide

### Tests

  To run the test suite, first install the dependencies, then run `npm test`:

```bash
$ npm install --dev-dependencies
$ npm test
```

## People

The original author of Yagura is [James Kerber](https://github.com/kerberjg)

[List of all contributors](https://github.com/mekomidev/yagura/graphs/contributors)

## License

  [MIT License](LICENSE)

