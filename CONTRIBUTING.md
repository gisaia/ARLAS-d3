# Contributing to ARLAS-d3

ARLAS-d3 is an open source project and there are many ways to contribute.

## Bug reports

If you think you have found a bug in ARLAS-d3, first make sure that it has not been already addressed in our
[issues list](https://github.com/gisaia/ARLAS-d3/issues).

If not, provide as much information as you can to help us reproduce your bug :

- Add error messages to the issue desctiption.
- Add a screenshot to the issue description if the bug has visual effects.
- Describe the maneuver that triggers the bug.

Keep in mind that we will fix your problem faster if we can easily reproduce it.

## Feature requests

If you think a component lacks a feature, do not hesitate to open an issue on our
[issues list](https://github.com/gisaia/ARLAS-d3/issues) on GitHub which describes what you need, why you need it,
and how it should work.

## Contributing code and documentation changes

If you want to submit a bugfix or a feature implementation, first find or open an issue about it on our
[issues list](https://github.com/gisaia/ARLAS-d3/issues)

#### Prerequisites

You need Node/npm or yarn to be installed.
Codebase follows [Visual Studio Code](https://code.visualstudio.com/) default formatting rules.

#### Fork and clone the repository

You will need to fork the main ARLAS-d3 repository and clone it to your local machine. See
[github help page](https://help.github.com/articles/fork-a-repo) for help.

#### Submitting your changes

When your code is ready, you will have to :

- rebase your repository.
- run `npm run tslint`, `npm run build-release` and `mkdocs.sh` and make sure they all pass.
- [submit a pull request](https://help.github.com/articles/using-pull-requests) with a proper title and a mention to
the corresponding issue (eg "fix #1234").
- never force push your branch after submitting, if you need to sync with official repository, you should better merge
master into your branch.
