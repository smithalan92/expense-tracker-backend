import mysql from "mysql2/promise";

export interface DBUserResult extends mysql.RowDataPacket {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}
