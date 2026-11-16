import type { ServerResponse } from 'http';
import type UserRepository from '../repository/UserRepository';
import type { ProcessedTripExpense } from '../utils/expenseParser';

const HEARTBEAT_INTERVAL_MS = 25_000;

/** Maps each expense event name to the shape of its `data` payload. */
export interface ExpenseEventMap {
  'expense.added': { tripId: number; expenses: ProcessedTripExpense[] };
  'expense.updated': { tripId: number; expense: ProcessedTripExpense };
  'expense.deleted': { tripId: number; expenseId: number };
}

export type ExpenseEventName = keyof ExpenseEventMap;

/**
 * In-memory fan-out for Server-Sent Events. Connections are keyed by user;
 * trip membership is resolved at publish time so membership changes apply
 * immediately. This only works while the app runs as a single process (pm2
 * fork mode). Cluster mode would need a shared pub/sub such as Redis.
 */
interface Connection {
  res: ServerResponse;
  clientId?: string;
}

class EventHub {
  private connections = new Map<number, Set<Connection>>();
  private userRepository: UserRepository;

  constructor({ userRepository }: ContainerCradle) {
    this.userRepository = userRepository;

    const heartbeat = setInterval(() => this.broadcastRaw(': heartbeat\n\n'), HEARTBEAT_INTERVAL_MS);
    heartbeat.unref();
  }

  /**
   * Registers an open SSE response. The connection removes itself when the
   * response closes (the documented signal for a dropped client).
   */
  subscribe(userId: number, res: ServerResponse, clientId?: string) {
    let set = this.connections.get(userId);

    if (!set) {
      set = new Set();
      this.connections.set(userId, set);
    }

    const connection: Connection = { res, clientId };

    set.add(connection);

    res.once('close', () => this.remove(userId, connection));
  }

  /** Idempotent: safe to call more than once for the same connection. */
  private remove(userId: number, connection: Connection) {
    // Look the set up now rather than capturing it, so a stale call can never
    // delete a newer set created for the same user in the meantime.
    const set = this.connections.get(userId);

    if (!set) {
      return;
    }

    set.delete(connection);

    if (!set.size) {
      this.connections.delete(userId);
    }
  }

  /**
   * Sends an event to every connection of every trip member, except connections
   * whose clientId matches `excludeClientId` (the client that made the change).
   * Other clients of the same user still receive it. Never throws.
   */
  async publishExpenseEvent<E extends ExpenseEventName>({
    tripId,
    event,
    data,
    excludeClientId,
  }: {
    tripId: number;
    event: E;
    data: ExpenseEventMap[E];
    excludeClientId?: string;
  }) {
    try {
      const memberIds = await this.userRepository.getUserIdsForTrip(tripId);
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

      for (const userId of memberIds) {
        this.connections.get(userId)?.forEach((connection) => {
          if (excludeClientId && connection.clientId === excludeClientId) {
            return;
          }

          this.write(userId, connection, message);
        });
      }
    } catch (err) {
      console.error('Failed to publish event', event, err);
    }
  }

  private broadcastRaw(message: string) {
    this.connections.forEach((set, userId) => set.forEach((connection) => this.write(userId, connection, message)));
  }

  private write(userId: number, connection: Connection, message: string) {
    const { res } = connection;

    // Safety net in case a close event was ever missed: drop dead entries
    // instead of leaving them in the map forever.
    if (res.writableEnded || res.destroyed) {
      this.remove(userId, connection);
      return;
    }

    res.write(message);
  }
}

export default EventHub;
