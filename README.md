# ARLAS-d3 :

![Build Status](https://img.shields.io/travis/gisaia/ARLAS-d3/develop.svg?label=develop)

## About :
ARLAS-d3 is a library that provides a set of d3 components : Charts .

## Prerequisites :

[Node](https://nodejs.org/en/) version 8.0.0

```
$ sudo npm install n -g
$ sudo n 8.0.0
```
[npm](https://github.com/npm/npm) version 5.2.0
````
$ npm install npm@5.2.0 -g
````

## Installing :

To install this library in your npm web app project add the dependency in your package.json :
```
$ npm install arlas-d3 --save
```
## Build :
Clone project

```
$ git clone https://github.com/gisaia/ARLAS-d3
```

Move into the folder

```
$ cd ARLAS-d3
```

Get all project's dependencies

```
$ npm install
```

Build the project with ngc and gulp :

```
$ npm run build-release
```

The build artifacts will be stored in the `dist/` directory. 


## Documentation : 
// TODO

## Contributing :

- Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

# Versioning :

We use our own versioning schema which looks like x.y.z where :

- `x` : Incremented as soon as the `ARLAS Server API` changes
- `y` : Incremented as soon as an `ARLAS-d3` interface change
- `z` : Incremented as soon as the `ARLAS-d3` implementation receives a fix

# Authors :

- Gisaia - initial work - [Gisaïa](http://gisaia.fr/) 

See also the list of [contributors](https://github.com/gisaia/ARLAS-d3/graphs/contributors) who participated in this project.

# License : 

This project is licensed under the Apache License, Version 2.0 - see the [LICENSE.txt](LICENSE.txt) file for details.

# Acknowledgments : 

This project has been initiated and is maintained by Gisaïa
