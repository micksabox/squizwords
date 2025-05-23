// https://github.com/partykit/example-link-counter/tree/main
import type * as Party from "partykit/server";
import type {
  PageConnectionsUpdate,
  PageConnectionsSummary,
  PageConnectionsSubscribe,
} from "./counter.js";

// we want only one party instance to count across all rooms
const GLOBAL_COUNTER_ID = "all-pages";
const CLEANUP_ALARM_DELAY = 1000 * 60 * 60; // 1 hour

export default class PageConnectionsServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  options: Party.ServerOptions = {
    hibernate: true,
  };

  async onRequest(req: Party.Request) {
    // The counter party updates this party by sending HTTP requests
    if (req.method === "POST") {
      const request = await req.json<PageConnectionsUpdate>();
      if (request.action === "update") {
        this.handleConnectionsUpdateMessage(request);
      }
    }

    return new Response("Bad request", { status: 400 });
  }

  /** Handle when the counter party sends an update to a page connection count */
  async handleConnectionsUpdateMessage(request: PageConnectionsUpdate) {
    const connections = await this.room.storage.get<PageConnectionsSummary>(
      "connections"
    );
    // if we aren't tracking connections for this page, it means there are no
    // interested subscribers, so we can ignore this message.
    if (connections) {
      // update connection counts
      connections[request.id] = request.connectionCount;
      await this.saveLinkConnections(connections);

      // broadcast to listeners
      this.room.broadcast(JSON.stringify({ type: "update", connections }));
    }

    return new Response("OK");
  }

  async onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {
    // when a client connects to this party, update the counter party
    await this.sendConnectionCountUpdateToCounter();
  }

  onClose(connection: Party.Connection) {
    // when a client disconnects, update the counter party
    this.sendConnectionCountUpdateToCounter();
  }

  async onMessage(data: string, sender: Party.Connection) {
    const message = JSON.parse(data);
    // when client sends "subscribe" message with links to other pages, subscribe to
    // the connection count changes in any of those pages.
    if (message.type === "subscribe") {
      const linkConnections = await this.subscribeToConnectionEventsFromCounter(
        message.links
      );

      // send the initial connection counts to the client
      sender.send(
        JSON.stringify({ type: "update", connections: linkConnections })
      );
    }
  }

  async onAlarm() {
    // if we don't have any subscribers, purge the cache, otherwise try again later
    if ([...this.room.getConnections()].length === 0) {
      await this.room.storage.delete("connections");
    } else {
      await this.room.storage.setAlarm(Date.now() + CLEANUP_ALARM_DELAY);
    }
  }

  async saveLinkConnections(linkConnections: PageConnectionsSummary) {
    // save connections locally
    await this.room.storage.put("connections", linkConnections);
    // purge cache after a period of inactivity
    await this.room.storage.setAlarm(Date.now() + CLEANUP_ALARM_DELAY);
  }

  async subscribeToConnectionEventsFromCounter(links: string[]) {
    const request = await this.room.context.parties.counter
      .get(GLOBAL_COUNTER_ID)
      .fetch({
        method: "POST",
        body: JSON.stringify(<PageConnectionsSubscribe>{
          action: "subscribe",
          subscriberId: this.room.id,
          subscribeToRoomIds: links,
        }),
      });

    const connections = (await request.json()) as PageConnectionsSummary;
    await this.saveLinkConnections(connections);

    return connections;
  }

  async sendConnectionCountUpdateToCounter() {
    const connectionCount = [...this.room.getConnections()].length;
    await this.room.context.parties.counter.get(GLOBAL_COUNTER_ID).fetch({
      method: "POST",
      body: JSON.stringify({
        action: "update",
        id: this.room.id,
        connectionCount,
      } satisfies PageConnectionsUpdate),
    });
  }
}

PageConnectionsServer satisfies Party.Worker;