**WS-WORKER** -is a minimalistic tool for executing *ES6* scripts on a remote machine in the same LAN and parsing execution results on localhost. 

One instance of **WS-WORKER** is run at a remote machine as a "server" (in the "daemon" manner). It creates a WebSocket server on specified port (default is 45020). The other instance is executed once or repeatedly at localhost as a "client".

Server instance is started without command-line switches:
```shell script
node <path_to_ws_worker>/ws-worker.js
``` 

Client instance is started the following way
```shell script
node <path_to_ws_worker>/ws-worker.js --command=<command> --url=<ws://path_to_ws_server>:<ws_server_port> --ifResult=<true_part_command> --ifNoResult=<false_part_command>
```

`--command` argument is mandatory for a client. It determines the script to be run **on a remote machine**. If set as a plain string like `--command=myCommand`, the client will look for a `./scripts/myCommand.js` script (path relative to *ws-worker* installation). If set in the format of a file name with a relative or absolute path, the client will look for the script file accordingly.
Alias: `--run`.

`--url` argument is optional. If specified, the client will only try to connect to the specified *ws://XXX.XXX.XXX.XXX:YYYY* address. Otherwise, the client will search for any instance of server on the local/vpn networks it is connected to. The latter possibility is handy for e.g. connecting to a laptop computer that is brought in and moved away and has its IP assigned dynamically.

`--ifResult` argument is optional. If specified, it represents a script to be run **on the local machine** after a command is sent to a server and a truthy (non-empty) response is received. Aliases: `--ifTrue`, `--ifYes`.

`--ifNoResult` argument is optional. If specified, it represents a script to be run **on the local machine** in case no valid remote sever found, or else a command is set to a server and a falsy (empty) response is received. Aliases: `--ifFalse`, `--ifNo`.

There are several scripts to be used with `--command`, `--ifResult`, and `--ifNoResult` stored in ./scripts folder. Others can be created manually. Each must follow the node.js importable modules' pattern. If you use third-part required modules there, make sure thay are installed as global dependencies on a machine that wil serve as "server".

User can control several generic settings through the `config.json` file. Some of them are:
- `background_worker_port` to specify which port server will work on;
- `allowed_background_worker_hostnames` to specify computer name(-s) service may run on. This is to marshal multiple **ws-worker** servers operating in the same LAN. The client, when looking for an appropriate server, will always pick the first one that satisfies the criteria;
- `allowed_client_hostnames` to specify which clients this particular server will accept. This is a bit of a security feature to prevent other users' client from manipulating "my own" **ws-worker** unintentionally.   

A real-life use case is a command that checks that an AEM server is available on LAN and then sets "aemhost" alias in the local operation system's HOSTS file to the IP of AEM server instance:
```shell script
node ws-worker.js --command=isAemRunning --ifTrue=setAemHost --ifFalse=removeAemHost
```
This one can be run via in-built Windows scheduler or cron periodically. If remote AEM server instance is available, "aemhost" alias is switched to its IP. Otherwise, "aemhost" is switched back to 127.0.0.1.
