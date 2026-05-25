export type ScheduledCard = {
  id: string;
  title: string;
  scheduledStart: string;
  scheduledEnd: string | null;
  stateKey: string;
  columnName: string;
  assigneeName: string | null;
  customerName: string | null;
  customerAddress: string | null;
};
