import { type Event } from 'nostr-tools';
import { type Settings } from '../../models';
import defaultFederation from '../../../static/federation.json';
import { websocketClient, WebsocketConnection, WebsocketState } from '../Websocket';

interface RoboPoolEvents {
  onevent: (event: Event) => void;
  oneose: () => void;
}

class RoboPool {
  constructor(settings: Settings, origin: string) {
    this.network = settings.network ?? 'mainnet';

    this.relays = [];
    const federationRelays = Object.values(defaultFederation)
      .map((coord) => {
        const url: string = coord[this.network][settings.selfhostedClient ? 'onion' : origin];

        if (!url) return undefined;

        return `ws://${url.replace(/^https?:\/\//, '')}/nostr`;
      })
      .filter((item) => item !== undefined);
    if (settings.host) {
      const hostNostr = `ws://${settings.host.replace(/^https?:\/\//, '')}/nostr`;
      if (federationRelays.includes(hostNostr)) {
        this.relays.push(hostNostr);
      }
    }
    while (this.relays.length < 3) {
      const randomRelay =
        federationRelays[Math.floor(Math.random() * Object.keys(federationRelays).length)];
      if (!this.relays.includes(randomRelay)) {
        this.relays.push(randomRelay);
      }
    }
  }

  public relays: string[];
  public network: string;

  public webSockets: Record<string, WebsocketConnection | null> = {};
  private readonly messageHandlers: Array<(url: string, event: MessageEvent) => void> = [];

  connect = (): void => {
    this.relays.forEach((url: string) => {
      if (Object.keys(this.webSockets).find((wUrl) => wUrl === url)) return;

      this.webSockets[url] = null;

      const connectRelay = () => {
        websocketClient.open(url).then((connection) => {
          console.log(`Connected to ${url}`);

          connection.onMessage((event) => {
            this.messageHandlers.forEach((handler) => {
              handler(url, event);
            });
          });

          connection.onError((error) => {
            console.error(`WebSocket error on ${url}:`, error);
          });

          connection.onClose(() => {
            console.log(`Disconnected from ${url}`);
          });

          this.webSockets[url] = connection;
        });
      };
      connectRelay();
    });
  };

  close = (): void => {
    Object.values(this.webSockets).forEach((ws) => {
      ws?.close();
    });
    this.webSockets = {};
  };

  sendMessage = (message: string): void => {
    const send = (url: string, message: string): void => {
      const ws = this.webSockets[url];

      if (!ws || ws.getReadyState() === WebsocketState.CONNECTING) {
        setTimeout(send, 500, url, message);
      } else if (ws.getReadyState() === WebsocketState.OPEN) {
        ws.send(message);
      }
    };

    Object.keys(this.webSockets).forEach((url) => {
      send(url, message);
    });
  };

  subscribeBook = (events: RoboPoolEvents): void => {
    const authors = Object.values(defaultFederation)
      .map((f) => f.nostrHexPubkey)
      .filter((item) => item !== undefined);

    const request = ['REQ', 'subscribeBook', { authors, kinds: [38383], '#n': [this.network] }];

    this.messageHandlers.push((_url: string, messageEvent: MessageEvent) => {
      const jsonMessage = JSON.parse(messageEvent.data);
      if (jsonMessage[0] === 'EVENT') {
        events.onevent(jsonMessage[2]);
      } else if (jsonMessage[0] === 'EOSE') {
        events.oneose();
      }
    });
    this.sendMessage(JSON.stringify(request));
  };
}

export default RoboPool;
