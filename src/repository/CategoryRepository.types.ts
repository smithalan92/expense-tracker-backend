import mysql from 'mysql2';

export interface DBGetCategoriesResult extends mysql.RowDataPacket {
  id: number;
  name: string;
}
