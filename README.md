# viewer

Currently, this contains a `docker-compose.yml` to build all (except reflib, but we'll add that later) the repos for the "Specify" web app and serve them together.

During dev or with updates, it may be prudent to start from scratch (assuming things haven't changed requiring us to persist data in volumes). You can do so by running the following to spin down the current app including any dangling services and networks

`docker-compose down --remove-orphans`

To be extra sure, you can remove the volumes created like so (replace `viewer` with the directory name this is in)

`docker volume rm viewer_build viewer_certs viewer_root viewer_share viewer_sock viewer_vhost`

or maybe better done via:

`docker-compose -f docker-compose.yml -f nginx-proxy-compose.yaml -f docker-compose.dev.yml down --volumes`

To spin it up with nginx and ssl included, you can add the `nginx-proxy-compose.yml` compose file alonside the default one like so: `docker-compose -f docker-compose.yml -f nginx-proxy-compose.yaml up ...`

To spin up a dev version with hot-reloading of Viewer in specific, you can add the `docker-compose.dev.yml` file as well. Taking into account what was mentioned above, the command to run this in dev mode with nginx/ssl might look like `docker-compose -f docker-compose.yml -f docker-compose.dev.yml -f nginx-proxy-compose.yaml up --force-recreate --build`
