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
