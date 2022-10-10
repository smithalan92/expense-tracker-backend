export interface DBTripResult {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'deleted';
}
