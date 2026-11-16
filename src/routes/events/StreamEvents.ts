import { FastifyInstance } from 'fastify';
import type { OutgoingHttpHeaders } from 'http';
import type EventHub from '../../lib/EventHub';

class StreamEventsRoute {
  eventHub: EventHub;

  constructor({ eventHub }: ContainerCradle) {
    this.eventHub = eventHub;
  }

  configure(server: FastifyInstance) {
    server.route({
      method: 'GET',
      url: '/v2/events',
      handler: (req, reply) => {
        const userId = req.requestContext.get('userId')!;
        const clientId = req.requestContext.get('clientId');

        // Take over the raw response so Fastify doesn't try to end it.
        reply.hijack();

        // Hijacking skips Fastify's header flushing, so carry over headers
        // already set on the reply (e.g. CORS) ourselves.
        reply.raw.writeHead(200, {
          ...(reply.getHeaders() as OutgoingHttpHeaders),
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache, no-transform',
          connection: 'keep-alive',
          // Stop nginx from buffering the stream
          'x-accel-buffering': 'no',
        });

        reply.raw.write(': connected\n\n');

        // The hub removes the connection itself when the response closes.
        this.eventHub.subscribe(userId, reply.raw, clientId);
      },
    });
  }
}

export default StreamEventsRoute;
