import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Settlement {
	fromUserId: string;
	toUserId: string;
	amount: number;
	id: string;
}

interface SettlementCardProps {
	settlements: Settlement[];
	title: string;
	currentUserId: string;
	getMemberName: (userId: string) => string;
	currency: string;
}

const SettlementCard: React.FC<SettlementCardProps> = ({ settlements, title, currentUserId, getMemberName, currency }) => (
	<Card className="bg-gradient-to-br from-[#2B5278] to-[#242F3D] border-none shadow-lg text-[#F5F5F5]">
		<CardHeader className="pb-2">
			<CardTitle className="text-[#F5F5F5] text-xl">{title}</CardTitle>
		</CardHeader>
		<CardContent>
			{settlements.length > 0 ? (
				<ul className="space-y-2">
					{settlements.map((settlement) => (
						<li
							key={settlement.id}
							className={`bg-[#17212B] p-3 rounded-lg flex items-center justify-between ${settlement.fromUserId === currentUserId || settlement.toUserId === currentUserId
								? 'border-2 border-[#5EBBF0]'
								: ''
								}`}
						>
							<div className="flex items-center space-x-2">
								<span className={`text-sm ${settlement.fromUserId === currentUserId ? 'font-bold uppercase' : ''}`}>
									{getMemberName(settlement.fromUserId)}
								</span>
								<ArrowRight className="h-4 w-4 text-[#8E99A4]" />
								<span className={`text-sm ${settlement.toUserId === currentUserId ? 'font-bold uppercase' : ''}`}>
									{getMemberName(settlement.toUserId)}
								</span>
							</div>
							<span className={`font-semibold ${settlement.fromUserId === currentUserId
								? 'text-red-500'
								: settlement.toUserId === currentUserId
									? 'text-emerald-500'
									: 'text-[#F5F5F5]'
								}`}>
								{currency}{settlement.amount.toFixed(2)}
							</span>
						</li>
					))}
				</ul>
			) : (
				<p className="text-[#A8B8C7] text-sm text-center">You are all caught up!</p>
			)}
		</CardContent>
	</Card>
);

export default SettlementCard;