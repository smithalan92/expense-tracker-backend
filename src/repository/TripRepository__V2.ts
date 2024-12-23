import type mysql from 'mysql2';
import type DBAgent from '../lib/DBAgent';

class TripRepository__V2 {
  dbAgent: DBAgent;

  constructor({ dbAgent }: ContainerCradle) {
    this.dbAgent = dbAgent;
  }

  async findTripById({ userId, tripId }: { userId: number; tripId: number }): Promise<DBTripResult | null> {
    const [result] = await this.dbAgent.runQuery<DBTripResult[]>({
      query: `
        SELECT t.id, t.name, t.startDate, t.endDate, t.status, f.path as filePath, (SELECT ROUND(SUM(euroAmount), 2) FROM trip_expenses WHERE tripId = ?) as totalExpenseAmount
        FROM user_trips ut
        LEFT JOIN trips t ON t.id = ut.tripId
        LEFT JOIN trip_expenses te ON te.tripId = t.id
        LEFT JOIN files f on f.id = t.fileId
        WHERE ut.userId = ?
        AND t.id = ?
        AND t.status = 'active'
        GROUP BY t.id;
      `,
      values: [tripId, userId, tripId],
    });

    return result ?? null;
  }
}

export default TripRepository__V2;

export interface DBTripResult extends mysql.RowDataPacket {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'deleted';
  filePath: string | null;
  totalExpenseAmount: number;
}
