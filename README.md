## Running the project

Run `npm run serve:www` and `npm run serve:api` to be able to access locally.
Navigate to `http://localhost:4200/`.

And to login in the interface with your Google account

The application will automatically reload if you change one of the source files.

P.S: You can go to `http://localhost:3333/api/ping` to check if the api is working properly, it's should return a `pong` message with 200 status

### Project Structure

We are using an file structure inspired in the [Josh Article](https://www.joshwcomeau.com/react/file-structure/), he structure use a more readable way to organize big projects.
Looks at the following structure:

```
app/
  └─ pages/
           ├─ auth-page/
                    └─ auth-form/
                               └─ auth-header/
```

Follow this pattern can be confuse to search by a specific component that we not know, besides also will fill the imports with sub-folders very very faster. Instead, we can always group the files by functionality:

```
app/
├── components/
│           ├── auth-form/
│           └─ auth-header/
└── pages/
			└── auth-page/
```

You will always know which place search by something

The final structure will look like:

```
src/
├── app/
│   ├── components/
│   ├── constants/
│   ├── directives/
│   ├── guards/
│   ├── helpers/
│   ├── guards/
│   ├── interfaces/
│   ├── pages/
│   ├── pipes/
│   ├── routes/
│   ├── services/
│   ├── stores/
│   └── utils/
├── assets/
└── styles/
```

## 💻 Build With

### Frameworks

- [NX](https://nx.dev/ 'NX') - DevTool for managing mono-repos
- [Angular](https://angular.io/ 'Angular') - Front-end framework
- [Nest.js](https://nestjs.com/ 'Nest.js') - Back-end framework

### Libraries

- [RxJS](https://rxjs.dev/ 'RxJS') - Library for reactive programming
- [NgRx](https://ngrx.io/ 'NgRx') - Provides reactive state management
- [Immutable](https://immutable-js.com/ 'Immutable') - Provides persistent Immutable data structures
- [ESLint](https://eslint.org/ 'ESLint') - Helps maintain our code quality

### Languages

- [HTML](https://developer.mozilla.org/en-US/docs/Web/HTML 'HTML')
- [SCSS](https://sass-lang.com/ 'SCSS')
- [TypeScript](https://www.typescriptlang.org/ 'TypeScript')
