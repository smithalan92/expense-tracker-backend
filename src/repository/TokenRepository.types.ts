import type mysql from 'mysql2/promise';

export interface DBFindValidTokenResult extends mysql.RowDataPacket {
  token: string;
  expiry: string;
}

export interface CreateUserTokenResult {
  token: string;
  expiry: string;
}

export interface DBUserIDForTokenResult extends mysql.RowDataPacket {
  id: number;
}
