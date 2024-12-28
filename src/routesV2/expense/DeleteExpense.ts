import { FastifyInstance } from 'fastify';
import ExpenseRepository__V2 from '../../repository/ExpenseRepository__V2';

class DeleteExpenseRoute {
  expenseRepository: ExpenseRepository__V2;

  constructor({ expenseRepositoryV2 }: ContainerCradle) {
    this.expenseRepository = expenseRepositoryV2;
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
