export type DivvyType = 'trip' | 'roommate' | 'couple' | 'event' | 'other';
export type MemberRole = 'admin' | 'member';

export type Divvy = {
  id: string;
  name: string;
  description: string | null;
  creatorid: string;
  type: DivvyType;
  createdat: string;
  endedat: string | null;
  isarchived: boolean;
  archivesuggested: boolean;
  archivesuggestedat: string | null;
  lastglobalconfirmationat: string | null;
};

export type DivvyMember = {
  id: string;
  divvyid: string;
  userid: string;
  email: string;
  role: MemberRole;
  joinedat: string;
};
