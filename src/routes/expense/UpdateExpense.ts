import { FastifyInstance } from 'fastify';
import CurrencyRepository from '../../repository/CurrencyRepository';
import ExpenseRepository, { UpdatedExpenseParams } from '../../repository/ExpenseRepository';
import TripRepository from '../../repository/TripRepository';
import { parseExpenseForResponse, ProcessedTripExpense } from '../../utils/expenseParser';
import { NewExpenseData } from './AddExpenses';

class UpdateExpenseRoute {
  expenseRepository: ExpenseRepository;
  currencyRepository: CurrencyRepository;
  tripRepository: TripRepository;

  constructor({ expenseRepository, currencyRepository, tripRepository }: ContainerCradle) {
    this.expenseRepository = expenseRepository;
    this.currencyRepository = currencyRepository;
    this.tripRepository = tripRepository;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Params: UpdateExpenseParams;
      Body: Partial<NewExpenseData>;
      Reply: PossibleErrorResponse<UpdateExpenseResponse>;
    }>({
      method: 'PATCH',
      url: '/v2/expenses/:expenseId',
      handler: async (req, reply) => {
        const { expenseId } = req.params;
        const userId = req.requestContext.get('userId')!;
        const updateData: UpdatedExpenseParams = req.body;

        const [existingExpense] = await this.expenseRepository.findExpensesForTrip({ expenseIds: [expenseId], userId });

        if (!existingExpense) {
          return reply.code(404).send({ error: 'Trip or expense not found' });
        }

        const hasValidUpdateData = !!Object.values(updateData).find((v) => v !== null && v !== undefined);

        if (!hasValidUpdateData) {
          return reply.code(400).send({ error: 'Not valid update data provided' });
        }

        if (updateData.amount || updateData.currencyId) {
          const amount = updateData.amount ?? existingExpense.amount;
          const currencyId = updateData.currencyId ?? existingExpense.currencyId;
          const currencyToEurFXRate = await this.currencyRepository.getCurrencyFXRate(currencyId);
          updateData.euroAmount = parseFloat((amount / currencyToEurFXRate).toFixed(2));
        }

        await this.expenseRepository.updateExpenseForTrip({
          expenseId,
          userId,
          params: updateData,
        });

        const [expense] = await this.expenseRepository.findExpensesForTrip({ expenseIds: [expenseId] });

        const processedExpense = parseExpenseForResponse(expense);

        return reply.status(200).send({
          expense: processedExpense,
        });
      },
    });
  }
}

export default UpdateExpenseRoute;

export interface UpdateExpenseParams {
  expenseId: number;
}

interface UpdateExpenseResponse {
  expense: ProcessedTripExpense;
}
