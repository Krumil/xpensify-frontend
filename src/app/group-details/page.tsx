'use client'

import React from 'react';
import { ArrowLeft, DollarSign, Users, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGroupStore } from '@/lib/store';
import { useMainButton, withMainButton } from '@telegram-apps/sdk-react';

const GroupDetails = () => {
	const router = useRouter();
	const { groupData } = useGroupStore();
	const mainButton = useMainButton();

	React.useEffect(() => {
		mainButton.setParams({
			text: 'Settle Expenses',
			isVisible: true,
		});

		mainButton.enable();
		mainButton.on('click', () => {
			mainButton.disable();
			mainButton.showLoader();
			mainButton.setText('Processing...');
			console.log('Settling expenses...');
			setTimeout(() => {
				mainButton.setText('Settled');
				mainButton.hideLoader();
				mainButton.enable();
			}, 2000); // 2 seconds delay
		});

		return () => {
			mainButton.hide();
		};
	}, [mainButton]);

	if (!groupData) {
		return <div className="flex items-center justify-center h-screen bg-[#0E1621] text-[#F5F5F5]">Loading...</div>;
	}

	const { group, totalExpenses, averagePerPerson, settlements } = groupData;

	const getMemberName = (userId: string) => {
		const member = group.members.find(m => m.tgId === userId);
		if (member && (member.username || member.firstName || member.lastName)) {
			return member.username || `${member.firstName || ''} ${member.lastName || ''}`.trim();
		}
		return userId || 'Unknown';
	};

	return (
		<div className="flex flex-col min-h-screen bg-[#0E1621] text-[#F5F5F5]">
			<header className="bg-[#17212B] p-4 sticky top-0 z-10 shadow-md flex items-center">
				<button
					onClick={() => router.back()}
					className="mr-4 p-2 rounded-full bg-[#2B5278] hover:bg-[#3A6D9A] focus:outline-none focus:ring-2 focus:ring-[#5EBBF0] transition-all duration-300"
				>
					<ArrowLeft className="h-6 w-6" />
				</button>
				<h1 className="text-2xl font-bold text-[#5EBBF0]">{group.name || 'Group Details'}</h1>
			</header>

			<main className="flex-grow p-4 space-y-6">
				<section className="bg-[#17212B] rounded-lg p-6 shadow-lg">
					<h2 className="text-xl font-semibold text-[#5EBBF0] mb-4">Expense Summary</h2>
					<div className="grid grid-cols-2 gap-4">
						<div className="bg-[#242F3D] p-4 rounded-lg">
							<p className="text-sm text-[#8E99A4]">Total Expenses</p>
							<p className="text-2xl font-bold text-[#5EBBF0]">
								{group.currency} {totalExpenses.toFixed(2)}
							</p>
						</div>
						<div className="bg-[#242F3D] p-4 rounded-lg">
							<p className="text-sm text-[#8E99A4]">Average per Person</p>
							<p className="text-2xl font-bold text-[#5EBBF0]">
								{group.currency} {averagePerPerson.toFixed(2)}
							</p>
						</div>
					</div>
				</section>

				<section className="bg-[#17212B] rounded-lg p-6 shadow-lg">
					<h2 className="text-xl font-semibold text-[#5EBBF0] mb-4">Members</h2>
					<ul className="space-y-2">
						{group.members.map((member) => (
							<li key={member.id} className="flex items-center bg-[#242F3D] p-3 rounded-lg">
								<Users className="h-6 w-6 text-[#5EBBF0] mr-3" />
								<span>{member.username}</span>
							</li>
						))}
					</ul>
				</section>

				<section className="bg-[#17212B] rounded-lg p-6 shadow-lg">
					<h2 className="text-xl font-semibold text-[#5EBBF0] mb-4">Settlements</h2>
					{settlements.length > 0 ? (
						<ul className="space-y-3">
							{settlements.map((settlement, index) => (
								<li key={index} className="bg-[#242F3D] p-4 rounded-lg flex items-center justify-between">
									<div className="flex items-center">
										<DollarSign className="h-6 w-6 text-[#5EBBF0] mr-2" />
										<span>{getMemberName(settlement.fromUserId)}</span>
									</div>
									<ArrowRight className="h-6 w-6 text-[#8E99A4]" />
									<div className="flex items-center">
										<span>{getMemberName(settlement.toUserId)}</span>
										<span className="ml-2 font-semibold text-[#5EBBF0]">
											{group.currency} {settlement.amount.toFixed(2)}
										</span>
									</div>
								</li>
							))}
						</ul>
					) : (
						<p className="text-[#8E99A4]">No settlements needed.</p>
					)}
				</section>
			</main>
		</div>
	);
};

export default withMainButton('mainButton', true, GroupDetails);