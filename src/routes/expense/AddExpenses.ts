import { FastifyInstance } from 'fastify';
import type EventHub from '../../lib/EventHub';
import CurrencyRepository from '../../repository/CurrencyRepository';
import ExpenseRepository, { NewExpenseRecord } from '../../repository/ExpenseRepository';
import TripRepository from '../../repository/TripRepository';
import { parseExpenseForResponse, ProcessedTripExpense } from '../../utils/expenseParser';

class AddExpensesRoute {
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
      Params: AddExpenseForTripParams;
      Body: AddExpenseForTripBody;
      Reply: PossibleErrorResponse<AddExpensesResponse>;
    }>({
      method: 'POST',
      url: '/v2/expenses/:tripId/add',
      // Fastify doesn't coerce params without a schema, so without this `tripId`
      // would be a string at runtime despite being typed as a number.
      schema: {
        params: {
          type: 'object',
          properties: { tripId: { type: 'integer' } },
          required: ['tripId'],
        },
      },
      handler: async (req, reply) => {
        const { tripId } = req.params;
        const userId = req.requestContext.get('userId')!;
        const [trip] = await this.tripRepository.getTrips({ userId, tripIds: [tripId] });

        if (!trip) {
          return reply.code(400).send({ error: 'Trip not found' });
        }

        const { expenses } = req.body;

        if (!expenses?.length) {
          return reply.code(400).send({ error: 'No expenses provided' });
        }

        const currencyIds = expenses.map((e) => e.currencyId);

        const currenciesWithFXRates = await this.currencyRepository.getFXRatesForCurrencies(currencyIds);

        const expensesToAdd = expenses.reduce<NewExpenseRecord[]>((acc, current) => {
          const currency = currenciesWithFXRates.find((c) => c.id === current.currencyId);

          if (!currency) {
            throw new Error(`Failed to find currency ${current.currencyId}`);
          }

          const euroAmount = parseFloat((current.amount / currency.exchangeRate).toFixed(2));

          const expense: NewExpenseRecord = {
            tripId,
            amount: current.amount,
            currencyId: currency.id,
            euroAmount,
            localDateTime: current.localDateTime,
            description: current.description,
            categoryId: current.categoryId,
            cityId: current.cityId,
            userIds: current.userIds,
            createdByUserId: userId,
            latlong: current.latlong ?? null,
          };

          acc.push(expense);
          return acc;
        }, []);

        const expenseIds = await this.expenseRepository.addExpensesForTrip(expensesToAdd);

        const createdExpenses = await this.expenseRepository.findExpensesForTrip({ tripId, expenseIds });

        const processedExpenses = createdExpenses.map(parseExpenseForResponse);

        void this.eventHub.publishExpenseEvent({
          tripId,
          event: 'expense.added',
          data: { tripId, expenses: processedExpenses },
          excludeClientId: req.requestContext.get('clientId'),
        });

        return reply.status(201).send({
          expenses: processedExpenses,
        });
      },
    });
  }
}

export default AddExpensesRoute;

export interface AddExpenseForTripParams {
  tripId: number;
}

export interface NewExpenseData {
  localDateTime: string;
  cityId: number;
  amount: number;
  currencyId: number;
  categoryId: number;
  description: string;
  userIds: number[];
  latlong?: string;
}

export interface AddExpenseForTripBody {
  expenses: NewExpenseData[];
}

interface AddExpensesResponse {
  expenses: ProcessedTripExpense[];
}
