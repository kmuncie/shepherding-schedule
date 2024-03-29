# Shepherding Schedule

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) to make the TypeScript language service aware of `.vue` types.

If the standalone TypeScript plugin doesn't feel fast enough to you, Volar has also implemented a [Take Over Mode](https://github.com/johnsoncodehk/volar/discussions/471#discussioncomment-1361669) that is more performant. You can enable it by the following steps:

1. Disable the built-in TypeScript Extension
    1) Run `Extensions: Show Built-in Extensions` from VSCode's command palette
    2) Find `TypeScript and JavaScript Language Features`, right click and select `Disable (Workspace)`
2. Reload the VSCode window by running `Developer: Reload Window` from the command palette.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## JSON Structure

The main JSON structure consists of an array of objects, each representing an individual
(either a shepherd or a sheep). Each object contains the following keys:

   - id: A unique identifier for the individual.
   - name: The full name of the individual.
   - location: The location where the individual is based.
   - role: The role of the individual, either "shepherd" or "sheep".
   - mostRecentMeeting: An object that holds information about the most recently completed meeting.
   - meetings: An array of meeting objects related to this individual.

### Most Recent Meeting Object (mostRecentMeeting)

   - quarter: The quarter of the year when the meeting occurred.
   - year: The year when the meeting occurred.
   - shepherdName: The name of the shepherd who conducted the meeting.

### Meeting Object (meetings)

Each meeting object contains the following keys:

   - id: A unique identifier for the meeting.
   - shepherdId: The unique ID of the shepherd.
   - sheepId: The unique ID of the sheep.
   - quarter: The quarter of the year when the meeting occurs.
   - year: The year when the meeting occurs.
   - completed: A boolean indicating whether the meeting has been completed.
   - completedDate: A string representing the date when the meeting was marked complete (in ISO format).
