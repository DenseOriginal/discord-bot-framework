import { HandlerClass } from '../handler';
import { ListenerClass } from '../listener';
import { Client, Message } from 'discord.js';
import { container } from 'tsyringe';
import { constructor } from 'tsyringe/dist/typings/types';

export interface BootstrapOptions {
  /**
   * @description
   * The token that the bot should use to authenticate with
   */
  token: string;

  /**
   * @description
   * The prefix the bot listens for
   */
  prefix: string;

  /**
   * @description
   * Should the bot react to being pinged
   * If this is active pinging the bot acts as a valid prefix
   * And bypasses the set prefix
   *
   * @default false
   */
  usePingAsPrefix?: boolean;

  /**
   * @description
   * Any listeners that should be hooked to the clients events
   */
  listners?: constructor<any>[];
}

export function bootstrap(mainHandler: constructor<any>, options: BootstrapOptions, client = new Client()): Client {
  Reflect.defineMetadata('discord:client', client, global);

  const handler: HandlerClass = container.resolve(mainHandler);
  client.on('message', (message: Message) => {
    // Quit if message doesn't start with prefix
    // And options.usePingAsPrefix is false
    if (!message.content.startsWith(options.prefix) && !options.usePingAsPrefix) return;

    // Find the bot id
    // Quit if message doesn't startwith botIdTag AND that we wan't to use a ping as prefix
    // And message doesn't start prefix as we still wan't to use that
    const botIdTag = '<@!' + client.user?.id + '>';
    if (!message.content.startsWith(botIdTag) && options.usePingAsPrefix && !message.content.startsWith(options.prefix))
      return;

    // Remove the prefix of botIdTag
    const input = message.content.slice(
      (message.content.startsWith(options.prefix) ? options.prefix : botIdTag).length,
    );

    handler.run(message, input.trim());
  });

  options?.listners?.forEach((constructor: constructor<ListenerClass>) => {
    const listener = container.resolve(constructor);
    client.on(listener.event, listener.listener);
  });

  client.login(options.token);

  return client;
}
