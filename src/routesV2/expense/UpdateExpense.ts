import { FastifyInstance } from 'fastify';
import CurrencyRepository__V2 from '../../repository/CurrencyRepository__V2';
import ExpenseRepository__V2, { UpdatedExpenseParams } from '../../repository/ExpenseRepository__V2';
import TripRepository__V2 from '../../repository/TripRepository__V2';
import { parseExpenseForResponse, ProcessedTripExpense } from '../../utils/expenseParser';
import { NewExpenseData } from './AddExpenses';

class UpdateExpenseRoute {
  expenseRepository: ExpenseRepository__V2;
  currencyRepository: CurrencyRepository__V2;
  tripRepository: TripRepository__V2;

  constructor({ expenseRepositoryV2, currencyRepositoryV2, tripRepositoryV2 }: UpdateExpenseRouteParams) {
    this.expenseRepository = expenseRepositoryV2;
    this.currencyRepository = currencyRepositoryV2;
    this.tripRepository = tripRepositoryV2;
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

interface UpdateExpenseRouteParams {
  expenseRepositoryV2: ExpenseRepository__V2;
  currencyRepositoryV2: CurrencyRepository__V2;
  tripRepositoryV2: TripRepository__V2;
}

export interface UpdateExpenseParams {
  expenseId: number;
}

interface UpdateExpenseResponse {
  expense: ProcessedTripExpense;
}
