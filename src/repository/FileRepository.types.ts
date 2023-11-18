import type mysql from 'mysql2';

export interface DBUnprocessedFileResult extends mysql.RowDataPacket {
  id: number;
  path: string;
}
