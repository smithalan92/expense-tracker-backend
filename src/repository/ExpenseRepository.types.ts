import mysql from 'mysql2';

export interface DBExpenseResult extends mysql.RowDataPacket {
  id: number;
  name: string;
  amount: number;
  euroAmount: number;
  currencyCode: string;
  date: string;
  description: string;
  categoryId: number;
  categoryName: string;
}
