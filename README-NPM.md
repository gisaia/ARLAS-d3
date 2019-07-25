# ARLAS-d3

[![Build Status](https://api.travis-ci.org/gisaia/ARLAS-d3.svg?branch=develop)](https://travis-ci.org/gisaia/ARLAS-d3)
[![npm version](https://badge.fury.io/js/arlas-d3.svg)](https://badge.fury.io/js/arlas-d3)

## About

ARLAS-d3 is a library that provides a set of d3 components : Charts .

## Install

To install this library in your web app project add the dependency in your package.json :

```shell
$ npm install --save arlas-d3
```

## Documentation

Please find the documentation of all the d3 components [here](http://docs.arlas.io/arlas-tech/current/classes/_donuts_abstractdonut_.abstractdonut/)

## Build

To build the project you need to have installed
- [Node](https://nodejs.org/en/) version >= 8.0.0 
- [npm](https://github.com/npm/npm) version >= 5.2.0

Then, clone the project

```shell
$ git clone https://github.com/gisaia/ARLAS-d3
```

Move to the folder

```shell
$ cd ARLAS-d3
```

Install all the project's dependencies

```shell
$ npm install
```

Build the project with `tsc` and `gulp` :

```shell
$ npm run build-release
```

The build artifacts will be generated in the `dist/` directory. 

## Contributing

Please read [CONTRIBUTING.md](https://github.com/gisaia/ARLAS-d3/blob/master/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

# Versioning :

We use [SemVer](http://semver.org/) for versioning : `x.y.z`.

- `x` : Incremented as soon as a new component is added or a major/breaking change is occured
- `y` : Incremented as soon as a parameter is added or modified
- `z` : Incremented as soon as the `ARLAS-d3` implementation receives a fix or an enhancement.

## Authors

* **Gisaïa** - *Initial work* - [Gisaïa](http://gisaia.fr/)

See also the list of [contributors](https://github.com/gisaia/ARLAS-d3/graphs/contributors) who participated in this project.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE.txt](LICENSE.txt) file for details