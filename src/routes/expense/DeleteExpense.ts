import { FastifyInstance } from 'fastify';
import ExpenseRepository from '../../repository/ExpenseRepository';
import type TripRepository from '../../repository/TripRepository';

class DeleteExpenseRoute {
  expenseRepository: ExpenseRepository;
  tripRepository: TripRepository;

  constructor({ expenseRepository, tripRepository }: ContainerCradle) {
    this.expenseRepository = expenseRepository;
    this.tripRepository = tripRepository;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Params: DeleteExpenseParams;
      Reply: PossibleErrorResponse;
    }>({
      method: 'DELETE',
      url: '/v2/expenses/:expenseId',
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

        return reply.status(204).send();
      },
    });
  }
}

export default DeleteExpenseRoute;

export interface DeleteExpenseParams {
  expenseId: number;
}
