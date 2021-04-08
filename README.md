## Motivation 

Sometimes, we need to preview the latest UI effects while modifying the HTML file (for example, when dealing with legal documents). Ordinary static resource server just simply lists all the files in the current folder, which can not meet our needs. Maybe webpack-dev-server can meet our needs, but we may need to build a complex environment. To make the implementation lighter and easier to use, I implemented a command-line tool called `server-anywhere`. Of course, you can also use it as a simple static resource server. It's just that's not the main motivation to implement this tool.

## Usage

```sh
$ npm i server-anywhere -g
$ cd some/path/to/directory
# default port is 3000
$ server-anywherer 

# or you can pass a port
$ server-anywherer -p 8080
```

## Licese

MIT