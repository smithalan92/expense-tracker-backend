import { FastifyInstance } from 'fastify';
import type EventHub from '../../lib/EventHub';
import ExpenseRepository from '../../repository/ExpenseRepository';
import type TripRepository from '../../repository/TripRepository';

class DeleteExpenseRoute {
  expenseRepository: ExpenseRepository;
  tripRepository: TripRepository;
  eventHub: EventHub;

  constructor({ expenseRepository, tripRepository, eventHub }: ContainerCradle) {
    this.expenseRepository = expenseRepository;
    this.tripRepository = tripRepository;
    this.eventHub = eventHub;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Params: DeleteExpenseParams;
      Reply: PossibleErrorResponse;
    }>({
      method: 'DELETE',
      url: '/v2/expenses/:expenseId',
      // Fastify doesn't coerce params without a schema, so without this `expenseId`
      // would be a string at runtime despite being typed as a number.
      schema: {
        params: {
          type: 'object',
          properties: { expenseId: { type: 'integer' } },
          required: ['expenseId'],
        },
      },
      handler: async (req, reply) => {
        const { expenseId } = req.params;
        const userId = req.requestContext.get('userId')!;

        const [existingExpense] = await this.expenseRepository.findExpensesForTrip({ expenseIds: [expenseId] });

        if (!existingExpense) {
          return reply.code(404).send({ error: 'Not found' });
        }

        const [trip] = await this.tripRepository.getTrips({ userId, tripIds: [existingExpense.tripId] });

        if (!trip) {
          return reply.code(400).send({ error: 'Trip not found' });
        }

        await this.expenseRepository.deleteExpense(expenseId);

        void this.eventHub.publishExpenseEvent({
          tripId: existingExpense.tripId,
          event: 'expense.deleted',
          data: { tripId: existingExpense.tripId, expenseId },
          excludeClientId: req.requestContext.get('clientId'),
        });

        return reply.status(204).send();
      },
    });
  }
}

export default DeleteExpenseRoute;

export interface DeleteExpenseParams {
  expenseId: number;
}
