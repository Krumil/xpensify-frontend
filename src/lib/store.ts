import { create } from 'zustand';

interface GroupMember {
	id: string;
	tgId: string;
	username: string;
	firstName: string;
	lastName: string;
}

interface Settlement {
	id: string;
	fromUserId: string;
	toUserId: string;
	amount: number;
}

interface GroupDetailsData {
	group: {
		id: number;
		tgId: string;
		name: string;
		description: string | null;
		currency: string;
		members: GroupMember[];
	};
	totalExpenses: number;
	averagePerPerson: number;
	settlements: Settlement[];
}

interface GroupStore {
	groupData: GroupDetailsData | null;
	setGroupData: (data: GroupDetailsData) => void;
}

export const useGroupStore = create<GroupStore>((set) => ({
	groupData: null,
	setGroupData: (data) => set({ groupData: data }),
}));