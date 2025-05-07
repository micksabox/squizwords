import { usePartySocket } from 'partysocket/react';
import { useState } from 'react';

export const useSquizwordsParty = (gameSlug: string = 'linktotheproofs') => {

  const [connectionCount, setConnectionCount] = useState(0);

  const ws = usePartySocket({
    // Run npx partykit dev to start the partykit server in dev mode
    host: import.meta.env.VITE_PARTYKIT_HOST || "localhost:1999",
    party: "page",
    room: gameSlug,

    // in addition, you can provide socket lifecycle event handlers
    // (equivalent to using ws.addEventListener in an effect hook)
    onOpen() {
      // console.log('connected');
    },
    onMessage(e) {
      // console.log('message', e.data);

      try { 
        const data = JSON.parse(e.data);
        setConnectionCount(data.connections[gameSlug]);
      } catch (error) {
        console.error('error', error);
      }
    },
    onClose() {
      // console.log('closed');
    },
    onError(e) {
      // console.log('error');
    },
  });

  ws.onopen = () => {
    // Subscribe to the connection count of the game and request the initial connection count
    ws.send(JSON.stringify({
      type: 'subscribe',
      links: [gameSlug]
    }));
  };

  return {
    connectionCount,
    ws,
  };
};
