import { FastifyInstance } from 'fastify';
import ExpenseRepository from '../../repository/ExpenseRepository';

class DeleteExpenseRoute {
  expenseRepository: ExpenseRepository;

  constructor({ expenseRepository }: ContainerCradle) {
    this.expenseRepository = expenseRepository;
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

        const [existingExpense] = await this.expenseRepository.findExpensesForTrip({ expenseIds: [expenseId], userId });

        if (!existingExpense) {
          return reply.code(404).send({ error: 'Trip or expense not found' });
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
