import mysql from 'mysql2';

export interface DBExpenseResult extends mysql.RowDataPacket {
  id: number;
  amount: number;
  currencyId: number;
  currencyCode: string;
  currencyName: string;
  euroAmount: number;
  localDateTime: Date;
  description: string;
  categoryId: number;
  categoryName: string;
  cityId: number;
  cityName: string;
  cityTimeZone: string;
  countryId: number;
  countryName: string;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  firstName: string;
}

export interface NewExpenseRecord {
  tripId: number;
  amount: number;
  currencyId: number;
  euroAmount: number;
  localDateTime: string;
  description: string;
  categoryId: number;
  cityId: number;
  userId: number;
}

export interface DBExpenseCategoryBreakdownForTripResult extends mysql.RowDataPacket {
  categoryName: string;
  totalEuroAmount: number;
}

export interface DBExpenseByUserBreakdownForTripResult extends mysql.RowDataPacket {
  userFirstName: string;
  totalEuroAmount: number;
}

export interface DBGetExpensiveTripDayResult extends mysql.RowDataPacket {
  localDate: string;
  totalEuroAmount: number;
}

export interface DBGetCountryBreakdownResult extends mysql.RowDataPacket {
  name: string;
  euroTotal: number;
  localTotal: number;
  localCurrency: string;
}

export interface DBGetCityBreakdownResult extends DBGetCountryBreakdownResult {}

export interface DBGetDailyCostBreakdownResult extends mysql.RowDataPacket {
  localDate: string;
  euroTotal: number;
}

export interface DBExpenseCategoryBreakdownForTripByUserResult extends DBExpenseCategoryBreakdownForTripResult {
  userId: number;
}

export interface ExpenseCategoryBreakdownForTripByUser {
  [key: string]: Array<Omit<DBExpenseCategoryBreakdownForTripResult, 'constructor'>>;
}

export interface UpdateExpenseParmas {
  amount?: number;
  currencyId?: number;
  euroAmount?: number;
  localDateTime?: string;
  description?: string;
  categoryId?: number;
  cityId?: number;
}

export interface DBGetSingleExpenseResult extends mysql.RowDataPacket {
  id: number;
  amount: number;
  currencyId: number;
  euroAmount: number;
  localDateTime: Date;
  description: string;
  categoryId: number;
  cityId: number;
  countryId: number;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  updatedByUserId: number | null;
}

export interface DBHourlyExpenseBreakdownResult extends mysql.RowDataPacket {
  hour: number;
  total: number;
}

export interface ParsedHourlyExpenseResult {
  hour: string;
  total: number;
}
