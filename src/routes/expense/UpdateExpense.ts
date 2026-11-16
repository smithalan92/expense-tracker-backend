import { FastifyInstance } from 'fastify';
import type EventHub from '../../lib/EventHub';
import CurrencyRepository from '../../repository/CurrencyRepository';
import ExpenseRepository, { UpdatedExpenseParams } from '../../repository/ExpenseRepository';
import TripRepository from '../../repository/TripRepository';
import { parseExpenseForResponse, ProcessedTripExpense } from '../../utils/expenseParser';
import { NewExpenseData } from './AddExpenses';

class UpdateExpenseRoute {
  expenseRepository: ExpenseRepository;
  currencyRepository: CurrencyRepository;
  tripRepository: TripRepository;
  eventHub: EventHub;

  constructor({ expenseRepository, currencyRepository, tripRepository, eventHub }: ContainerCradle) {
    this.expenseRepository = expenseRepository;
    this.currencyRepository = currencyRepository;
    this.tripRepository = tripRepository;
    this.eventHub = eventHub;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Params: UpdateExpenseParams;
      Body: Partial<NewExpenseData>;
      Reply: PossibleErrorResponse<UpdateExpenseResponse>;
    }>({
      method: 'PATCH',
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
        const updateData: UpdatedExpenseParams = req.body;

        const [existingExpense] = await this.expenseRepository.findExpensesForTrip({ expenseIds: [expenseId] });

        if (!existingExpense) {
          return reply.code(404).send({ error: 'Not found' });
        }

        const [trip] = await this.tripRepository.getTrips({ userId, tripIds: [existingExpense.tripId] });

        if (!trip) {
          return reply.code(400).send({ error: 'Trip not found' });
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

        void this.eventHub.publishExpenseEvent({
          tripId: existingExpense.tripId,
          event: 'expense.updated',
          data: { tripId: existingExpense.tripId, expense: processedExpense },
          excludeClientId: req.requestContext.get('clientId'),
        });

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
