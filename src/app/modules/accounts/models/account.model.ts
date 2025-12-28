export interface Account {
  _id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense' | 'other';
  parent: string | null;
  isGroup: boolean;
  debitTotal?: number;
  creditTotal?: number;
  rawBalance?: number;
  balance?: number;
  computedBalance?: number;
  children?: Account[];
}
