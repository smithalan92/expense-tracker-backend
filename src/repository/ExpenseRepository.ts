/* eslint-disable @typescript-eslint/no-floating-promises */
import { type OkPacket } from 'mysql2';
import { CATEGORY_IDS } from '../constants';
import type DBAgent from '../lib/DBAgent';
import knex from '../lib/knex';
import { type ContainerCradle } from '../lib/types';
import { get12HourTimeFromHour } from '../utils/time';
import {
  type DBExpenseByUserBreakdownForTripResult,
  type DBExpenseCategoryBreakdownForTripByUserResult,
  type DBExpenseCategoryBreakdownForTripResult,
  type DBExpenseResult,
  type DBGetCityBreakdownResult,
  type DBGetCountryBreakdownResult,
  type DBGetDailyCostBreakdownResult,
  type DBGetExpensiveTripDayResult,
  type DBGetSingleExpenseResult,
  type DBHourlyExpenseBreakdownResult,
  type ExpenseCategoryBreakdownForTripByUser,
  type GetTripExpenseStatsOptions,
  type NewExpenseRecord,
  type ParsedHourlyExpenseResult,
  type UpdateExpenseParams,
} from './ExpenseRepository.types';

class ExpenseRepository {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  async findExpensesForTrip(tripId: number) {
    const results = await this.dbAgent.runQuery<DBExpenseResult[]>({
      query: `
        SELECT
          te.id,
          te.amount,
          te.currencyId,
          cu.code as currencyCode,
          cu.name as currencyName,
          te.euroAmount,
          te.localDateTime,
          te.description,
          te.categoryId,
          ca.name as categoryName,
          te.cityId,
          ci.name as cityName,
          ci.timezoneName as cityTimeZone,
          co.id as countryId,
          co.name as countryName,
          te.createdAt,
          te.updatedAt,
          us.id as userId,
          us.firstName,
          us.lastName
        FROM trip_expenses te
        JOIN expense_categories ec ON te.categoryId = ec.id
        JOIN currencies cu ON cu.id=te.currencyId
        JOIN expense_categories ca ON ca.id = te.categoryId
        JOIN cities ci ON ci.id = te.cityId
        JOIN countries co ON co.id = ci.countryId
        JOIN users us ON te.userId = us.id
        WHERE te.tripId = ?
        ORDER BY localDateTime DESC;
      `,
      values: [tripId],
    });

    return results;
  }

  async getExpense(expenseId: number, userId: number) {
    const [result] = await this.dbAgent.runQuery<DBGetSingleExpenseResult[]>({
      query: `
        SELECT te.*
        FROM trip_expenses te
        JOIN user_trips ut ON ut.tripId = te.tripId
        JOIN trips t ON t.id = te.tripId
        WHERE te.id = ?
        AND ut.userId = ?
        AND t.status = 'active';
      `,
      values: [expenseId, userId],
    });

    return result;
  }

  async addExpenseForTrip(expense: NewExpenseRecord) {
    const query = knex('trip_expenses')
      .insert({
        tripId: expense.tripId,
        amount: expense.amount,
        currencyId: expense.currencyId,
        euroAmount: expense.euroAmount,
        localDateTime: expense.localDateTime,
        description: expense.description,
        categoryId: expense.categoryId,
        cityId: expense.cityId,
        userId: expense.userId,
        createdByUserId: expense.createdByUserId,
      })
      .toQuery();

    const result = await this.dbAgent.runQuery<OkPacket>({
      query,
    });

    if (!result.insertId) {
      throw new Error('Failed to insert new expense');
    }
  }

  async updateExpenseForTrip(tripId: number, expenseId: number, userId: number, params: UpdateExpenseParams) {
    let query = knex('trip_expenses')
      .where('id', expenseId)
      .where('tripId', tripId)
      .update('updatedByUserId', userId)
      .update('updatedAt', knex.raw('NOW()'));

    if (params.amount) query = query.update('amount', params.amount);
    if (params.euroAmount) query = query.update('euroAmount', params.euroAmount);
    if (params.currencyId) query = query.update('currencyId', params.currencyId);
    if (params.localDateTime) query = query.update('localDateTime', params.localDateTime);
    if (params.description) query = query.update('description', params.description);
    if (params.categoryId) query = query.update('categoryId', params.categoryId);
    if (params.cityId) query = query.update('cityId', params.cityId);
    if (params.userId) query = query.update('userId', params.userId);

    const sql = query.toQuery();

    const result = await this.dbAgent.runQuery<OkPacket>({
      query: sql,
    });

    if (result.changedRows !== 1) {
      console.log(params);
      throw new Error('Failed to update expense');
    }
  }

  async deleteExpenseForTrip(tripId: number, expenseId: number) {
    return this.dbAgent.runQuery<OkPacket>({
      query: `
        DELETE FROM trip_expenses
        WHERE tripId = ?
        AND id = ?
      `,
      values: [tripId, expenseId],
    });
  }

  async getTripExpenseStats({ tripId }: { tripId: number }, options: GetTripExpenseStatsOptions) {
    const [
      categoryBreakdown,
      categoryByUserBreakdown,
      userBreakdown,
      mostExpenseDay,
      leastExpensiveDay,
      countryBreakdown,
      cityBreakdown,
      dailyCostBreakdown,
      hourlySpendingBreakdown,
    ] = await Promise.all([
      this.getExpenseCategoryBreakdownForTrip(tripId, options),
      this.getExpenseCategoryBreakdownByUser(tripId, options),
      this.getExpenseByUserBreakdownForTrip(tripId, options),
      this.getMostExpensiveTripDay(tripId, options),
      this.getLeastExpensiveTripDay(tripId, options),
      this.getExpenseByCountryBreakdownForTrip(tripId, options),
      this.getExpenseByCityBreakdownForTrip(tripId, options),
      this.getDailyCostBreakdownForTrip(tripId, options),
      this.getHourlySpendingBreakdown(tripId, options),
    ]);

    return {
      categoryBreakdown,
      categoryByUserBreakdown,
      userBreakdown,
      mostExpenseDay,
      leastExpensiveDay,
      countryBreakdown,
      cityBreakdown,
      dailyCostBreakdown,
      hourlySpendingBreakdown,
    };
  }

  private async getExpenseCategoryBreakdownForTrip(tripId: number, options: GetTripExpenseStatsOptions) {
    const query = knex('trip_expenses')
      .select('ec.name as categoryName', knex.raw('ROUND(SUM(te.euroAmount), 2) as totalEuroAmount'))
      .from('trip_expenses AS te')
      .join('expense_categories AS ec', 'ec.id', '=', 'te.categoryId')
      .where('te.tripId', tripId)
      .groupBy('ec.id')
      .orderBy('totalEuroAmount', 'desc');

    if (!options.includeFlights) {
      query.where('te.categoryId', '!=', CATEGORY_IDS.FLIGHTS);
    }

    if (!options.includeHotels) {
      query.where('te.categoryId', '!=', CATEGORY_IDS.ACCOMMODATION);
    }

    const result = await this.dbAgent.runQuery<DBExpenseCategoryBreakdownForTripResult[]>({
      query: query.toQuery(),
    });

    return result;
  }

  private async getExpenseByUserBreakdownForTrip(tripId: number, options: GetTripExpenseStatsOptions) {
    const query = knex('trip_expenses')
      .select('u.firstName as userFirstName', knex.raw('ROUND(SUM(te.euroAmount), 2) as totalEuroAmount'))
      .from('trip_expenses AS te')
      .join('users AS u', 'u.id', '=', 'te.userId')
      .where('te.tripId', tripId)
      .groupBy('u.id')
      .orderBy('totalEuroAmount', 'desc');

    if (!options.includeFlights) {
      query.where('te.categoryId', '!=', CATEGORY_IDS.FLIGHTS);
    }

    if (!options.includeHotels) {
      query.where('te.categoryId', '!=', CATEGORY_IDS.ACCOMMODATION);
    }

    const result = await this.dbAgent.runQuery<DBExpenseByUserBreakdownForTripResult[]>({
      query: query.toQuery(),
    });

    return result;
  }

  private async getMostExpensiveTripDay(tripId: number, options: GetTripExpenseStatsOptions) {
    const query = knex('trip_expenses')
      .select(knex.raw("DATE_FORMAT(localDateTime, '%Y-%m-%d') as localDate"), knex.raw('ROUND(SUM(te.euroAmount), 2) as totalEuroAmount'))
      .from('trip_expenses AS te')
      .where('te.tripId', tripId)
      .groupBy('localDate')
      .orderBy('totalEuroAmount', 'desc')
      .limit(1);

    if (!options.includeFlights) {
      query.where('te.categoryId', '!=', CATEGORY_IDS.FLIGHTS);
    }

    if (!options.includeHotels) {
      query.where('te.categoryId', '!=', CATEGORY_IDS.ACCOMMODATION);
    }

    const result = await this.dbAgent.runQuery<DBGetExpensiveTripDayResult[]>({
      query: query.toQuery(),
    });

    return result[0];
  }

  private async getLeastExpensiveTripDay(tripId: number, options: GetTripExpenseStatsOptions) {
    const query = knex('trip_expenses')
      .select(knex.raw("DATE_FORMAT(localDateTime, '%Y-%m-%d') as localDate"), knex.raw('ROUND(SUM(te.euroAmount), 2) as totalEuroAmount'))
      .from('trip_expenses AS te')
      .where('te.tripId', tripId)
      .groupBy('localDate')
      .orderBy('totalEuroAmount', 'asc')
      .limit(1);

    if (!options.includeFlights) {
      query.where('te.categoryId', '!=', CATEGORY_IDS.FLIGHTS);
    }

    if (!options.includeHotels) {
      query.where('te.categoryId', '!=', CATEGORY_IDS.ACCOMMODATION);
    }

    const result = await this.dbAgent.runQuery<DBGetExpensiveTripDayResult[]>({
      query: query.toQuery(),
    });

    return result[0];
  }

  private async getExpenseByCountryBreakdownForTrip(tripId: number, options: GetTripExpenseStatsOptions) {
    const query = knex('trip_expenses')
      .select(
        'co.name',
        knex.raw('TRUNCATE(SUM(te.euroAmount), 2) as euroTotal'),
        knex.raw('TRUNCATE(SUM(te.amount), 2) as localTotal'),
        'cu.code as localCurrency',
      )
      .from('trip_expenses AS te')
      .leftJoin('cities AS c', 'c.id', '=', 'te.cityId')
      .leftJoin('countries AS co', 'co.id', '=', 'c.countryId')
      .leftJoin('currencies AS cu', 'cu.id', '=', 'te.currencyId')
      .where('te.tripId', tripId)
      .groupBy('co.id')
      .orderBy('te.localDateTime');

    if (!options.includeFlights) {
      query.where('te.categoryId', '!=', CATEGORY_IDS.FLIGHTS);
    }

    if (!options.includeHotels) {
      query.where('te.categoryId', '!=', CATEGORY_IDS.ACCOMMODATION);
    }

    const results = await this.dbAgent.runQuery<DBGetCountryBreakdownResult[]>({
      query: query.toQuery(),
    });

    return results;
  }

  private async getExpenseByCityBreakdownForTrip(tripId: number, options: GetTripExpenseStatsOptions) {
    const query = knex('trip_expenses')
      .select(
        'c.name',
        knex.raw('TRUNCATE(SUM(te.euroAmount), 2) as euroTotal'),
        knex.raw('TRUNCATE(SUM(te.amount), 2) as localAmount'),
        'cu.code as localCurrency',
      )
      .from('trip_expenses AS te')
      .leftJoin('cities AS c', 'c.id', '=', 'te.cityId')
      .leftJoin('countries AS co', 'co.id', '=', 'c.countryId')
      .leftJoin('currencies AS cu', 'cu.id', '=', 'te.currencyId')
      .where('te.tripId', tripId)
      .groupBy('c.id')
      .orderBy('te.localDateTime');

    if (!options.includeFlights) {
      query.where('te.categoryId', '!=', CATEGORY_IDS.FLIGHTS);
    }

    if (!options.includeHotels) {
      query.where('te.categoryId', '!=', CATEGORY_IDS.ACCOMMODATION);
    }

    const results = await this.dbAgent.runQuery<DBGetCityBreakdownResult[]>({
      query: query.toQuery(),
    });

    return results;
  }

  private async getDailyCostBreakdownForTrip(tripId: number, options: GetTripExpenseStatsOptions) {
    const query = knex('trip_expenses')
      .select(knex.raw("DATE_FORMAT(localDateTime, '%Y-%m-%d') as localDate"), knex.raw('TRUNCATE(SUM(te.euroAmount), 2) as euroTotal'))
      .from('trip_expenses AS te')
      .where('te.tripId', tripId)
      .groupBy(knex.raw('YEAR(te.localDateTime), MONTH(te.localDateTime), DAY(te.localDateTime)'))
      .orderBy('localDate', 'asc');

    if (!options.includeFlights) {
      query.where('te.categoryId', '!=', CATEGORY_IDS.FLIGHTS);
    }

    if (!options.includeHotels) {
      query.where('te.categoryId', '!=', CATEGORY_IDS.ACCOMMODATION);
    }

    const results = await this.dbAgent.runQuery<DBGetDailyCostBreakdownResult[]>({
      query: query.toQuery(),
    });

    return results;
  }

  private async getExpenseCategoryBreakdownByUser(tripId: number, options: GetTripExpenseStatsOptions) {
    const query = knex('trip_expenses')
      .select('ec.name AS categoryName', knex.raw('ROUND(SUM(te.euroAmount), 2) as totalEuroAmount'), 'te.userId')
      .from('trip_expenses AS te')
      .join('expense_categories AS ec', 'ec.id', '=', 'te.categoryId')
      .where('te.tripId', tripId)
      .groupBy('ec.id', 'te.userId')
      .orderBy('userId', 'totalEuroAmount', 'desc');

    if (!options.includeFlights) {
      query.where('te.categoryId', '!=', CATEGORY_IDS.FLIGHTS);
    }

    if (!options.includeHotels) {
      query.where('te.categoryId', '!=', CATEGORY_IDS.ACCOMMODATION);
    }

    const results = await this.dbAgent.runQuery<DBExpenseCategoryBreakdownForTripByUserResult[]>({
      query: query.toQuery(),
    });

    return results.reduce<ExpenseCategoryBreakdownForTripByUser>((acc, current) => {
      if (acc[current.userId]) {
        acc[current.userId].push({
          categoryName: current.categoryName,
          totalEuroAmount: current.totalEuroAmount,
        });
      } else {
        acc[current.userId] = [
          {
            categoryName: current.categoryName,
            totalEuroAmount: current.totalEuroAmount,
          },
        ];
      }
      return acc;
    }, {});
  }

  private async getHourlySpendingBreakdown(tripId: number, options: GetTripExpenseStatsOptions) {
    const query = knex('trip_expenses')
      .select(knex.raw('HOUR(localDateTime) as hour'), knex.raw(' ROUND(SUM(euroAmount), 2) as total'))
      .from('trip_expenses')
      .where('tripId', tripId)
      .groupBy(knex.raw('HOUR(localDateTime)'))
      .orderBy('hour', 'asc');

    if (!options.includeFlights) {
      query.where('categoryId', '!=', CATEGORY_IDS.FLIGHTS);
    }

    if (!options.includeHotels) {
      query.where('categoryId', '!=', CATEGORY_IDS.ACCOMMODATION);
    }

    const results = await this.dbAgent.runQuery<DBHourlyExpenseBreakdownResult[]>({
      query: query.toQuery(),
    });

    const parsedResults: ParsedHourlyExpenseResult[] = [];

    for (let i = 0; i < 24; i++) {
      const { total } = results.find(({ hour }) => hour === i) ?? {};
      const hour = get12HourTimeFromHour(i);

      if (total) parsedResults[i] = { hour, total };
      else parsedResults[i] = { hour, total: 0 };
    }

    return parsedResults;
  }
}
export default ExpenseRepository;
