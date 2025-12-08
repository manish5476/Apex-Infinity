export interface Channel {
  _id: string;
  organizationId: string;
  name?: string;
  type: 'public' | 'private' | 'dm';
  members?: string[];
  isActive?: boolean;
}
