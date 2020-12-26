# viewer

Currently, this contains a `docker-compose.yml` to build all (except reflib, but we'll add that later) the repos for the "Specify" web app and serve them together.

During dev or with updates, it may be prudent to start from scratch (assuming things haven't changed requiring us to persist data in volumes). You can do so by running the following to spin down the current app including any possible dangling services, networks, and volumes

`docker-compose -f nginx-proxy-compose.yaml -f docker-compose.yml down --remove-orphans --volumes`

To spin it up with nginx and ssl included, you can add the `nginx-proxy-compose.yml` compose file alonside the default one like so:

`docker-compose -f docker-compose.yml -f nginx-proxy-compose.yaml up ...`

To spin up a dev version with hot-reloading of Viewer in specific, you can add the `docker-compose.dev.yml` file as well. Taking into account what was mentioned above, the command to run this in dev mode with nginx/ssl might look like this:

`docker-compose -f docker-compose.yml -f docker-compose.dev.yml -f nginx-proxy-compose.yaml up --force-recreate --build`

Note\* Running `nginx-proxy-compose.yaml` a bunch of times will build up the Let's Encrypt ratelimit for the specified domain. We only get 50 a week, so it may be prudent to spin that compose file up/down separately from the rest and/or leave their volumes alone once the certs are initially created.

## deploy

on first deploy: `docker-compose -f nginx-proxy-compose.yaml -f docker-compose.yml up -d`
on subsequent deploys, you don't want to restart nginx and letsencrypt as it uses up the letsencrypt ratelimit bucket: `docker-compose up -d --build --force-recreate` 
You may also want to remove the viewer_build volume before starting it up to ensure changes are actually rebuilt `docker-compose down --volume; docker volume rm viewer_build`. 