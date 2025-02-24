# New Space Monorepo

This is a monorepo repository that includes all new space services, powered by [Turborepo](https://turbo.build/repo/docs) under the hood.

- [New Space Monorepo](#new-space-monorepo)
  - [Getting Started 🎬](#getting-started-)
  - [Prerequisites 🔧](#prerequisites-)
  - [Building 🏗️](#building-️)
  - [Testing 🧪](#testing-)
  - [Core concepts 🧠](#core-concepts-)
    - [Package types 📦](#package-types-)
    - [Internal Packages 📂](#internal-packages-)
    - [Package and Task Graphs 📊](#package-and-task-graphs-)
    - [Versioning 🔢](#versioning-)
      - [Tips on using changesets 💡](#tips-on-using-changesets-)
      - [How to handle versioning 📝](#how-to-handle-versioning-)
    - [Remote Caching 🌐](#remote-caching-)
      - [Enable Remote Caching 🔧](#enable-remote-caching-)
  - [Useful Links 🔗](#useful-links-)

## Getting Started 🎬

- Clone the repository:

over https:
```bash
git clone https://github.com/Green2Moon/new-space.git
```

over ssh:
```bash
git clone git@github.com:Green2Moon/new-space.git
```

- Install dependencies:

```bash
cd new-space

corepack enable
pnpm install
```

## Prerequisites 🔧

It's recommended to have turbo installed globally:

```bash
pnpm install turbo --global
```

## Building 🏗️

To build all apps and packages, run the following command:

```bash
pnpm build
```

## Testing 🧪

You should be able to run unit tests for all the services out of the box.
To run unit tests for all apps and packages, run the following command:

```bash
pnpm test
```

*Notice*: It creates a mongo container for the tests to run, so make sure you have docker desktop open.

## Core concepts 🧠

These are a must read to better understand how the monorepo is structured and how to work with it.

### Package types 📦
In Turborepo, we talk about two types of packages:

- Application Packages (package in your workspace that will be deployed from your workspace), under `apps/`
- Library Packages, aka Internal Packages (Packages that contain code that you intend to share around your workspace), under `packages/`

read more about this topic in the [Turborepo documentation](https://turbo.build/repo/docs/package-types/)

### Internal Packages 📂
Internal packages are one of the core concepts in Turborepo. A more in depth explanation on how to share your code inside a Turborepo project can be found [here](https://turbo.build/repo/docs/core-concepts/internal-packages)
Make sure you understand the differences between:
- `Just-in-Time Packages`
- `Compiled Packages`
- `Publishable Packages`

In this Turborepo setup we will be using `Compiled Packages` to share code between the different applications for several reasons:
- The build outputs will be cached by Turborepo once they're added to the outputs key of the task, allowing you to have overall faster build times.
- `Just In Time Pacakges` strategy can only be used when the package is going to be used in tooling that uses a bundler or natively understands TypeScript, which means our apps will need to have a bundler (like `vite` or `webpack`) to bundle the internal packages as well since `tsc` can't bundle the packages inside `node_modules`.

### Package and Task Graphs 📊

To understand how packages depend on each other and how tasks are executed in Turborepo, you need to understand the concept of Package and Task Graphs. Read about this topic in the [Turborepo documentation](https://turbo.build/repo/docs/core-concepts/package-and-task-graph)

### Versioning 🔢

This repo uses [Changesets](https://github.com/changesets/changesets) which is a tool for managing versioning and changelogs
with a focus on multi-package repositories.

The changesets tool is extremely powerful in monorepos.

Terminology you need to know to better understand how changesets work [here](https://github.com/changesets/changesets/blob/main/docs/dictionary.md)

Important changesets behaviors that you must know:
- [How changesets are combined](https://github.com/changesets/changesets/blob/main/docs/decisions.md#how-changesets-are-combined)
- [How dependencies are bumped](https://github.com/changesets/changesets/blob/main/docs/decisions.md#how-dependencies-are-bumped)

#### Tips on using changesets 💡

1. You can add more than one changeset to a pull request when:

- You want to release multiple packages with different changelog entries
- You have made multiple changes to a package that should each be called out separately

2. Not every change requires a changeset

#### How to handle versioning 📝

When working and making changes on your feature branch  that should cause a new version to be released, commit the changes with a changeset added to the commit (Adding changeset on the commit that creates the change is a good practice, but it's okay to add the changeset on the last commit of the branch).

1. Add new changeset with the command:

```bash
  pnpm add-change
```

  Choose the packages you want to add a changeset for, and then choose the type of change you want to make (`major`, `minor`, `patch`).

  Add a summary of your changes and commit the changeset. A good idea of what should be in a changeset is:

  - WHAT the change is
  - WHY the change was made

  Then commit your code.

2. When merging the pull request the [release](./.github/workflows/release.yaml) workflow will create a new pull request with the title `Version Packages` and run inside it the `pnpm release` script. When the pull request is merged it will bump the version of the packages and create a new **git** tag and push it.

3. The pushed tags will trigger the [ci](./.github/workflows/ci.yaml) workflow which will run tests and static checks and build the packages and push the **docker image** to the registry.
*Notice*: The ci pipeline ignores internal packages tags (using regex to ignore the `@new-space` prefix), and only builds and pushes the docker image for the apps.

**Boom**!!🤯🤯🤯 you have released a new image version of your package, easy isn't it?
You can now deploy it where the application runs.

### Remote Caching 🌐

Turborepo can use a technique known as [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

This repo uses a Remote Cache Server which is deployed on our cloud provider. We use an open source project you can reference [ducktors/turborepo-remote-cache](https://github.com/ducktors/turborepo-remote-cache) which uses `fastify` under the hood and integrates with a given cloud storage that stores the results of your tasks. This can save enormous amounts of time by preventing duplicated work across your entire organization.

Good to know: By default, Turborepo will cache locally.

#### Enable Remote Caching 🔧

First you need to get the `TURBO_TOKEN` from the cloud provider where the Remote Cache Server is deployed.

Then, run the following command to add the following environment variables to your shell profile (replace `<TURBO_TOKEN>` with the token you got):

```bash
echo "
# turbo cache server creds
export TURBO_API="https://turbo-remote-cache.lemonplant-40f8d990.westeurope.azurecontainerapps.io"
export TURBO_TOKEN=<TURBO_TOKEN>
export TURBO_TEAM="new-space"
" >> ~/.zshrc
```
Then to reload your shell profile configuration, run:

```bash
source ~/.zshrc
```

Now when you try to build the project again you should see that the remote cache is enabled.
Try to run build: 

```bash
pnpm build
```

## Useful Links 🔗

Learn more:

- [Tasks](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
- [Caching](https://turbo.build/repo/docs/core-concepts/caching)
- [Filtering](https://turbo.build/repo/docs/core-concepts/monorepos/filtering)
- [Configuration Options](https://turbo.build/repo/docs/reference/configuration)
- [CLI Usage](https://turbo.build/repo/docs/reference/command-line-reference)
- [PNPM Workspaces](https://pnpm.io/workspaces)
- [Changesets](https://github.com/changesets/changesets)
- [Vitest](https://vitest.dev/)
- [Biome](https://biomejs.dev/)
