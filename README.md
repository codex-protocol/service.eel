# Codex Protocol | Ethereum Event Listener (aka "EEL") _(service.eel)_

![](https://i.imgur.com/C1A28tc.jpg)

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> A simple service that listens for events emitted by Codex Protocol smart contracts on the Ethereum blockchain.

This service sequentially processes blocks on the Ethereum blockchain, listening for events emitted by Codex Protocol smart contracts. It then logs those events to a MongoDB server for arbitrary consumption by other Codex Protocol applications (e.g. the [Codex Registry API](https://github.com/codex-protocol/service.codex-registry-api).)

## Table of Contents

- [Security](#security)
- [Install](#install)
  - [Clone & Set Up Required Repositories](#clone--set-up-required-repositories)
  - [Dependencies](#dependencies)
  - [Configure](#configure)
- [Usage](#usage)
- [Maintainers](#maintainers)
- [Contribute](#contribute)
- [License](#license)


## Security

This project requires the use of some "secret" variables that should be tailored to your development environment and never committed to the repository. These variables are read by [dotenv](https://www.npmjs.com/package/dotenv) and should be defined in a file called `.env` in the project root.

After cloning the repository, duplicate and rename `.env.example` to `.env`, then tailor the variables to your local environment accordingly:

```bash
$ cp .env.example .env
$ vi .env
```

`.env.example` has suitable local development defaults for most variables. Descriptions for each variable are listed in [.env.example](.env.example).

## Install

For EEL to be able to index for events, it first needs to know which contract addresses to look up events for. All Codex Protocol smart contracts are centralized in the [ethereum-service](https://github.com/codex-protocol/npm.ethereum-service) repository. To populate the ethereum-service repository with your locally-deployed contracts and get EEL up and running, follow these steps:

### Clone & Set Up Required Repositories

1. First, clone this repository and all dependency repositories (see [Dependencies](#dependencies) below for more details):

    - [contract.codex-registry](https://github.com/codex-protocol/contract.codex-registry)
    - [npm.ethereum-service](https://github.com/codex-protocol/npm.ethereum-service)
    - [service.eel](https://github.com/codex-protocol/service.eel)

    ```bash
    $ git clone https://github.com/codex-protocol/contract.codex-registry
    $ git clone https://github.com/codex-protocol/npm.ethereum-service
    $ git clone https://github.com/codex-protocol/service.eel
    ```

    **IMPORTANT NOTE:** It's necessary to have all of these repositories in the same directory, since our npm scripts assume this is the case.

1. Then install all npm packages in each repository:

    ```bash
    $ cd ../contract.codex-registry
    $ npm install

    $ cd ../npm.ethereum-service
    $ npm install

    $ cd ../service.eel
    $ npm install
    ```

1. After you've installed all npm packages, you will also need to [npm link](https://docs.npmjs.com/cli/link) the ethereum-service repository so that EEL can use your locally-deployed smart contracts:

    ```bash
    $ cd npm.ethereum-service
    $ npm link

    $ cd ../service.eel
    $ npm link @codex-protocol/ethereum-service
    ```

    Now when you deploy the smart contracts locally, EEL will be able to pull the ABIs from the linked ethereum-service repository.

    **IMPORTANT NOTE:** every time you run `npm install` in the EEL repository, you will need to re-link the ethereum-service repository. For convenience, you can simply run the npm script `npm run link-all` to link, or `npm run install-and-link` to install and link in one step. (You re-link in the EEL repository, not the ethereum-service repository.)

### Dependencies

Now you will need to install & set up some dependencies.

1. [MongoDB](https://www.mongodb.com/download-center)

    MongoDB is where EEL stores indexed events for consumption by other Codex Protocol applications. It's also used by [Agenda](https://www.npmjs.com/package/agenda) to track [jobs](src/jobs).

    On MacOS, MongoDB can be installed via [Homebrew](https://brew.sh/):

    ```bash
    $ brew install mongodb
    ```

    For other platforms, MongoDb can be downloaded directly from [the MongoDB website](https://www.mongodb.com/download-center).


1. [Ganache](http://truffleframework.com/ganache)

    Ganache is a blockchain development application that allows you to deploy & test contracts locally.

    You can download Ganache directly from [the Truffle Framework website](http://truffleframework.com/ganache).


1. Link the [ethereum-service Repository](https://github.com/codex-protocol/npm.ethereum-service)

    Make sure you've cloned the [ethereum-service repository](https://github.com/codex-protocol/npm.ethereum-service) and have `npm link`ed it so that EEL will be able to use your locally-deployed smart contracts (see [Clone & Set Up Required Repositories](#clone--set-up-required-repositories) above).

    For more information on this repository, see the [README](https://github.com/codex-protocol/npm.ethereum-service/blob/master/README.md).


1. Deploy [Codex Registry Smart Contracts](https://github.com/codex-protocol/contract.codex-registry)

    After you've set up Ganache and linked the [ethereum-service](https://github.com/codex-protocol/npm.ethereum-service) repository, you will need to deploy the Codex Registry smart contracts. Make sure Ganache is running, and then run:

    ```bash
    $ cd contract.codex-registry
    $ npm run migrate:reset
    ```

    This will make Truffle deploy the contracts to Ganache and copy over the built contract JSON files to the ethereum-service repository, where EEL will be able to read them.


### Configure

After you've installed & set up all dependencies, you should now update your `.env` file to match your local environment (for example, change the MongoDB port if you're not using the default.) See the [Security](#security) section for more details on the `.env` file.


## Usage

After you've deployed your contracts locally to Ganache, you can now start up EEL:

```bash
$ cd service.eel
$ npm start
```

Now any events emitted by the contracts you've deployed will be index in the MongoDB table `blockchainevents`. The [Codex Registry API](https://github.com/codex-protocol/service.codex-registry-api) has it's own Agenda job that will periodically process these records and do what it will with them.


## Maintainers

- [John Forrest](mailto:john@codexprotocol.com) ([@johnhforrest](https://github.com/johnhforrest))
- [Colin Wood](mailto:colin@codexprotocol.com) ([@Anaphase](https://github.com/Anaphase))
- [Shawn Price](mailto:shawn@codexprotocol.com) ([@sprice](https://github.com/sprice))


## Contribute

If you have any questions, feel free to reach out to one of the repository [maintainers](#maintainers) or simply [open an issue](https://github.com/codex-protocol/service.eel/issues/new) here on GitHub. If you have questions about Codex Protocol in general, feel free to [reach out to us Telegram!](https://t.me/codexprotocol)

[Pull Requests](https://github.com/codex-protocol/service.eel/pulls) are not only allowed, but highly encouraged! All Pull Requests must pass CI checks (if applicable) and be approved by at least one repository [maintainer](#maintainers) before being considered for merge.

Codex Labs, Inc follows the [Contributor Covenant Code of Conduct](https://contributor-covenant.org/version/1/4/code-of-conduct).


## License

[GNU Affero General Public License v3.0 or later](LICENSE) © Codex Labs, Inc
