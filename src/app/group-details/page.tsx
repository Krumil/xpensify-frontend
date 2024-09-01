'use client'

import React from 'react';
import { ArrowLeft, DollarSign, Users, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGroupStore } from '@/lib/store';
import { useMainButton, withMainButton } from '@telegram-apps/sdk-react';
import { motion } from 'framer-motion';

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
		<div className="flex flex-col min-h-screen bg-gradient-to-br from-[#0E1621] to-[#1A2735] text-[#F5F5F5]">
			<header className="bg-[#17212B] p-4 sticky top-0 z-10 shadow-lg flex items-center">
				<motion.button
					whileHover={{ scale: 1.1 }}
					whileTap={{ scale: 0.9 }}
					onClick={() => router.back()}
					className="mr-4 p-2 rounded-full bg-[#2B5278] hover:bg-[#3A6D9A] focus:outline-none focus:ring-2 focus:ring-[#5EBBF0] transition-all duration-300"
				>
					<ArrowLeft className="h-6 w-6" />
				</motion.button>
				<motion.h1
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#5EBBF0] to-[#A1E3FF]"
				>
					{group.name || 'Group Details'}
				</motion.h1>
			</header>

			<main className="flex-grow p-6 space-y-8">
				<motion.section
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-[#17212B] rounded-2xl p-6 shadow-2xl"
				>
					<h2 className="text-2xl font-semibold text-[#5EBBF0] mb-6 flex items-center">
						Expense Summary
					</h2>
					<div className="grid grid-cols-1 gap-6">
						<motion.div
							whileHover={{ scale: 1.05 }}
							className="bg-gradient-to-br from-[#242F3D] to-[#2B3A4D] p-6 rounded-xl shadow-lg"
						>
							<p className="text-sm text-[#8E99A4] mb-2">Total Expenses</p>
							<p className="text-3xl font-bold text-[#5EBBF0]">
								{group.currency} {totalExpenses.toFixed(2)}
							</p>
						</motion.div>
						<motion.div
							whileHover={{ scale: 1.05 }}
							className="bg-gradient-to-br from-[#242F3D] to-[#2B3A4D] p-6 rounded-xl shadow-lg"
						>
							<p className="text-sm text-[#8E99A4] mb-2">Average per Person</p>
							<p className="text-3xl font-bold text-[#5EBBF0]">
								{group.currency} {averagePerPerson.toFixed(2)}
							</p>
						</motion.div>
					</div>
				</motion.section>

				<motion.section
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-[#17212B] rounded-2xl p-6 shadow-2xl"
				>
					<h2 className="text-2xl font-semibold text-[#5EBBF0] mb-6">Members</h2>
					<ul className="space-y-4">
						{group.members.map((member, index) => (
							<motion.li
								key={member.id}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.1 }}
								className="flex items-center bg-gradient-to-r from-[#242F3D] to-[#2B3A4D] p-4 rounded-xl shadow-md"
							>
								<Users className="h-8 w-8 text-[#5EBBF0] mr-4" />
								<span className="text-lg">{member.username}</span>
							</motion.li>
						))}
					</ul>
				</motion.section>

				<motion.section
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className="bg-[#17212B] rounded-2xl p-6 shadow-2xl"
				>
					<h2 className="text-2xl font-semibold text-[#5EBBF0] mb-6">Settlements</h2>
					{settlements.length > 0 ? (
						<ul className="space-y-4">
							{settlements.map((settlement, index) => (
								<motion.li
									key={index}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: index * 0.1 }}
									className="bg-gradient-to-r from-[#242F3D] to-[#2B3A4D] p-5 rounded-xl shadow-md flex items-center justify-between"
								>
									<div className="flex items-center">
										<DollarSign className="h-8 w-8 text-green-400 mr-3" />
										<span className="text-lg">{getMemberName(settlement.fromUserId)}</span>
									</div>
									<ArrowRight className="h-6 w-6 text-[#8E99A4] mx-4" />
									<div className="flex items-center">
										<span className="text-lg">{getMemberName(settlement.toUserId)}</span>
										<span className="ml-3 font-semibold text-xl text-green-400">
											{group.currency} {settlement.amount.toFixed(2)}
										</span>
									</div>
								</motion.li>
							))}
						</ul>
					) : (
						<p className="text-[#8E99A4] text-lg text-center">No settlements needed.</p>
					)}
				</motion.section>
			</main>
		</div>
	);
};

export default withMainButton('mainButton', true, GroupDetails);