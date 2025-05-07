// https://github.com/partykit/example-link-counter/tree/main
import type * as Party from "partykit/server";

// not used in this example
export default class Server implements Party.Server {}

Server satisfies Party.Worker;