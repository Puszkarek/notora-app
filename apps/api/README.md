# Deploy

## Fly.io

Right now we don't have a CI/CD pipeline, so we need to deploy manually. To do that, we need to install the fly.io CLI:

```bash
curl -L https://fly.io/install.sh | sh
```

Then, we need to login:

```bash
flyctl auth login
```

And finally, we can deploy the app:

```bash
flyctl deploy --no-cache --config ./fly.prod.toml --dockerfile ./Dockerfile.api.prod
```

### Possible errors

- If the deploy is not working properly you might need to clear the docker cache. To do that, just run the following command:

```bash
docker buildx prune -f
```

- To debug you can try to run the command:

```bash
docker build -t rma-api  -f Dockerfile.api.alpha .
```

# Prisma

## How to run

First, let's create a docker container with the database:

```bash
docker run -d --name rma -p 5455:5432 -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=admin postgres
```

Then, in order to compile the project, we need to run a command to generate our types from prisma schema:

```bash
npm run prisma:generate
```

Then we also gonna need to setup the database URL in the `.env` file. You can copy the `.env.example` file and rename it to `.env` and then set the `DATABASE_URL` variable.

We gonnna have two variables in the `.env` file:

- `DATABASE_URL`: The URL to the main database.
- `SHADOW_DATABASE_URL`: The URL to the shadow database (just need to be set if you are performing a migration).

## How to migrate (an empty database)

First we need to know somethings about prisma migrations:

1. Prisma use a shadow database for a safety migration. So, if the migration fail, the prod database doesn't be affected.
2.

And finally, run the migration command:

```bash
npm run prisma:migrate
```

#### Seeding the database

After create your development database, you can seed it with some data. To do that, you just need to run the following command:

```bash
npm run prisma:seed
```

## How to migrate (an existing database)

### TODO
