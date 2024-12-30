import { FastifyInstance } from 'fastify';
import CurrencyRepository__V2 from '../../repository/CurrencyRepository__V2';
import ExpenseRepository__V2, { NewExpenseRecord } from '../../repository/ExpenseRepository__V2';
import TripRepository__V2 from '../../repository/TripRepository__V2';
import { parseExpenseForResponse, ProcessedTripExpense } from '../../utils/expenseParser';

class AddExpensesRoute {
  expenseRepository: ExpenseRepository__V2;
  currencyRepository: CurrencyRepository__V2;
  tripRepository: TripRepository__V2;

  constructor({ expenseRepositoryV2, currencyRepositoryV2, tripRepositoryV2 }: ContainerCradle) {
    this.expenseRepository = expenseRepositoryV2;
    this.currencyRepository = currencyRepositoryV2;
    this.tripRepository = tripRepositoryV2;
  }

  configure(server: FastifyInstance) {
    server.route<{
      Params: AddExpenseForTripParams;
      Body: AddExpenseForTripBody;
      Reply: PossibleErrorResponse<AddExpensesResponse>;
    }>({
      method: 'POST',
      url: '/v2/expenses/:tripId/add',
      handler: async (req, reply) => {
        const { tripId } = req.params;
        const userId = req.requestContext.get('userId')!;
        const [trip] = await this.tripRepository.getTrips({ userId, tripIds: [tripId] });

        if (!trip) {
          return reply.code(400).send({ error: 'Trip not found' });
        }

        const { expenses } = req.body;

        if (!expenses || !expenses.length) {
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
            userId: current.userId!,
            createdByUserId: userId,
          };

          acc.push(expense);
          return acc;
        }, []);

        const expenseIds = await this.expenseRepository.addExpensesForTrip(expensesToAdd);

        const createdExpenses = await this.expenseRepository.findExpensesForTrip({ tripId, expenseIds });

        const processedExpenses = createdExpenses.map(parseExpenseForResponse);

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
  userId: number;
}

export interface AddExpenseForTripBody {
  expenses: NewExpenseData[];
}

interface AddExpensesResponse {
  expenses: ProcessedTripExpense[];
}
