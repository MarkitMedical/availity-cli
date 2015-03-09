# availity-cli

[![Join the chat at https://gitter.im/Availity/availity-cli](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/Availity/availity-cli?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

> Availity Command-line Interface (CLI)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](http://opensource.org/licenses/MIT)
[![Dependency Status](https://img.shields.io/david/Availity/availity-cli.svg)](https://david-dm.org/Availity/availity-cli)
[![Issues](https://img.shields.io/github/issues/Availity/availity-cli.svg)](https://github.com/Availity/availity-cli/issues)


# Table of Contents
  * [Intro](#intro)
  * [Installation](#installation)
  * [Setup](#setup)
  * [Usage](#usage)
    * [Initialization](#initialization)
    * [Development](#development)
    * [Deployment](#deployment)
  * [Authors](#authors)
  * [Disclaimer](#disclaimer)
  * [License](#license)


## Intro
Availity Command-Line Interface (CLI) allows you, as a developer, to create applications that run on the Availity Spaces platform. The Availity CLI, `availity`, installs on your workstation and gives you commands to create applications on your machine, incorporate the Availity Spaces look and feel into your applications, and deploy them to the Availity Spaces platform. 



## Installation
* Install [node](http://nodejs.org/download/)
* In a terminal, type `npm install -g availity-cli`
* Run `availity doctor` to see any additional steps, missing dependencies, or problems

**Note**: If you don't have root access on your machine, running `npm install -g availity-cli` may fail. You can also install `availity-cli` locally; see [http://browsenpm.org/help](http://browsenpm.org/help) for instructions.


## Setup
**For Windows Users:** The Availity CLI uses command-line tools on your system like `git` and `ssh-keygen` that don't typically work well in a Windows Command Prompt. To use the Availity CLI, install [Git for Windows](https://msysgit.github.io/), which installs a Git BASH shortcut that launches a BASH shell optimized for working with Git. Use this shell to run all your Availity CLI commands.

To set up the Availity CLI for use, you must log in using your Availity credentials.

**Note:** The Availity CLI is currently in early access preview, so only certain parties have been granted Availity credentials. In the future, you will be able to register on the Availity Developer Portal to receive credentials for using the Availity CLI.

To log in, type:

```
availity login
```

After you enter your Availity credentials, the system will authenticate you. Then, it will:

* Check your system for a public SSH key
* If you don't have one, offer to create one
* Upload your public key to the Availity deployment server
* Write a configuration file to your home directory (`.availity.config.json`)

Example:

``` bash
$ availity login
User ID: xxxxxx
Password (will not display):
Logging in to Availity
Saving configuration
Uploading public key
Done!
```


## Usage
Once you have installed and set up the Availity CLI, you use it to create and deploy Availity Space applications.


### Initialization
The `availity init` command initializes either a new or an existing project.

##### Initializing a New Project

To create a new application on your local workstation, type:

```
availity init [project-name]
```

This creates a new project in the `project-name` directory.

##### Initializing an Existing Project

If you already have a project, change to your project's directory and omit the project name from the `availity init` command. For example, if I have an existing project in the `my-project` directory, I would type:

```
cd my-project
availity init
```

##### Completing the Initialization

The Availity CLI prompts you for information about your new application, and then creates a skeleton application (or configures your existing application) tailored to your responses. The prompts it gives are:

* Enter a description for your application: 
    * The description is used in the application catalog, and can be changed later.
* Enter the version of your application: (0.1.0)
    * Availity Spaces uses [semver](http://semver.org/) for versioning. You can accept the default or type a new version.
* Use our Developer Toolkit?
    * The Availity Developer Toolkit contains various tools to make web development easier. Some of the tools it includes are:
      * The Availity UIKit
      * A build mechanism using [gulp](http://gulpjs.com)
      * Live browser reloads when your application code changes
      * A mock server for REST calls
      * LESS compilation
      * See more at [the project website](https://github.com/Availity/availity-toolkit)

Example:

``` bash
$ availity init MyCoolApplication
Enter the description for your application: A really cool application that you will love
Enter the version of your application: (0.1.0)
Use our Developer Toolkit? y

Creating project MyCoolApplication
Creating directory MyCoolApplication
Saving configuration
Installing Toolkit... [=========================] 100% 0.0s

Installing packages...
Package installation complete
Project MyCoolApplication initialized
Next Steps:
* Read documentation for Availity Toolkit (https://github.com/Availity/availity-toolkit)
* Develop your application
* Use availity create to begin deploying your application
```

##### Installing the Availity UIKit

After your project initializes, if you didn't select to use our Developer Toolkit, the Availity CLI displays instructions for how to install the Availity UIKit. Installation instructions depend on which package manager you use to manage project dependencies. Installation instructions for different package managers are:

* NPM
   `npm install --save availity-uikit`
* Bower
   `bower install --save availity-uikit`
* No Package Manager
   `git submodule add git@github.com:Availity/availity-uikit.git`

##### Changing Your Answers

The initialization process creates a file in the root of your project directory called `availity.config.json`. This file contains the information you entered, in JSON format. You can edit this file in any text editor to update your project description, et al. Take care, however, to preserve the format of the file.


### Development
You develop your Availity Spaces application as you would normally develop JavaScript-only applications, and use your own source control system for storing your application source.

For more information about developing applications using the Availity UIKit and the Availity Toolkit, see the [Availity Developer Portal](https://developer.availity.com).



### Deployment
Before you can deploy an application to the Availity Spaces platform, you must create the project on the Availity deployment server. Change to the directory containing your project and type:

```
availity create
```

This command does the following:

* Checks to see if this project is a Git repository, and if not, initializes it as a Git repository
* Creates a Git remote in this repository called `availity`
* Creates this project on the [Availity Git server](https://code.availity.com)

To push your code to the Availity Git server, use the `git push` command:

```
git push -u availity master
```

You run the `availity create` command only once for a given project. You run the `git push availity master` command many times -- any time you have changes you wish to deploy.

**Note:** Don't forget to commit your code to your local Git repository before pushing to the Availity Git server.

Example:

``` bash
$ cd ~/Development/MyCoolApplication
$ availity create
Created project on Availity deployment server
```

``` bash
$ availity push -u availity master
```


## Authors

**Rob Warner** ([rob.warner@availity.com](rob.warner@availity.com))

**Robert Ventrone** ([robert.ventrone@availity.com](robert.ventrone@availity.com))



## Disclaimer
Open source software components distributed or made available in the Availity Materials are licensed to Company under the terms of the applicable open source license agreements, which may be found in text files included in the Availity Materials.


## License
Copyright (c) 2015 Availity, LLC
Released under the MIT license