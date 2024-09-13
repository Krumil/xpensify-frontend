'use client'

import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGroupStore } from '@/lib/store';
import { useMainButton, withMainButton, useBackButton } from '@telegram-apps/sdk-react';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import SettlementCard from '@/components/SettlementCard/SettlementCard';
import ExpenseSummaryCard from '@/components/ExpenseSummaryCard/ExpenseSummaryCard';
import SettlingOverlay from '@/components/SettlingOverlay/SettlingOverlay';

const GroupDetails = () => {
	const router = useRouter();
	const { groupData } = useGroupStore();
	const mainButton = useMainButton();
	const backButton = useBackButton();
	const testUserId = process.env.NEXT_PUBLIC_TEST_USER_ID;
	const currentUserId = testUserId;
	const [isSettling, setIsSettling] = useState(false);
	const [isSettled, setIsSettled] = useState(false);
	const [showSettledMessage, setShowSettledMessage] = useState(false);

	const idToNameMap: { [key: string]: string } = {
		'1509868794': 'Emma',
		'142092237': 'John',
		'5143097120': 'Olivia',
	};

	if (!currentUserId) {
		return (
			<div className="flex items-center justify-center h-screen bg-[#17212B]">
				<LoadingSpinner size="large" />
			</div>
		);
	}

	const getMemberName = (userId: string) => {
		if (userId in idToNameMap) {
			return idToNameMap[userId];
		}
		if (groupData?.group.members.find(m => m.tgId === userId)?.username === 'Krumil') {
			return 'Krumil';
		}
		return 'Unknown User';
	};

	const settleExpenses = async () => {
		mainButton.disable();
		mainButton.showLoader();
		mainButton.setText('Processing...');

		setIsSettling(true);

		if (!groupData) {
			console.error('Group data is null');
			return;
		}

		try {
			const userSettlements = groupData.settlements.filter(s => s.fromUserId === currentUserId);

			console.log('userSettlements', userSettlements);

			const response = await fetch('/api/payments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					settlements: userSettlements,
					currentUserId: currentUserId
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			console.log(`Settlements result:`, result);

			const allSettled = result.results.every((r: { status: string }) => r.status === 'success');

			// if (allSettled) {
			setIsSettled(true);
			setShowSettledMessage(true);
			setTimeout(() => setShowSettledMessage(false), 4000);
			mainButton.setText('Settled');

			const updatedSettlements = groupData.settlements.filter(
				s => !result.results.some((r: { settlementId: string }) => r.settlementId === s.id)
			);
			useGroupStore.getState().setGroupData({
				...groupData,
				settlements: updatedSettlements
			});
			// } else {
			// 	const failedSettlements = result.results.filter((r: { status: string }) => r.status === 'error');
			// 	console.error('Some settlements failed:', failedSettlements);
			// 	mainButton.setText('Partial Settlement');
			// }
		} catch (error) {
			console.error('Error settling expenses:', error);
			mainButton.setText('Settlement Failed');
		} finally {
			mainButton.hideLoader();
			mainButton.enable();
			setIsSettling(false);
		}
	};

	useEffect(() => {
		if (isSettled) {
			mainButton.disable();
			mainButton.setText('Settled');
		} else {
			mainButton.setParams({
				text: 'Settle Expenses',
				isVisible: true,
			});
			mainButton.enable();
			mainButton.on('click', settleExpenses);
		}

		return () => {
			mainButton.hide();
		};
	}, [mainButton, isSettled]);

	useEffect(() => {
		backButton.show();
		backButton.on('click', () => router.back());
	}, [backButton, router]);

	if (!groupData) {
		return (
			<div className="flex items-center justify-center h-screen bg-[#17212B]">
				<LoadingSpinner size="large" />
			</div>
		);
	}

	const { group, totalExpenses, averagePerPerson, settlements } = groupData;

	const userSettlements = settlements.filter(s => s.fromUserId === currentUserId || s.toUserId === currentUserId);
	const otherSettlements = settlements.filter(s => s.fromUserId !== currentUserId && s.toUserId !== currentUserId);

	return (
		<div className="flex flex-col min-h-screen bg-[#17212B] text-[#F5F5F5]">
			<SettlingOverlay isSettling={isSettling} isSettled={isSettled} showSettledMessage={showSettledMessage} />

			<div className="flex backdrop-blur-lg p-4 sticky top-0 z-10 shadow-lg">
				<div className="flex flex-col">
					<div className="text-2xl font-bold text-[#F5F5F5]">
						{groupData?.group.name || 'Group Details'}
					</div>
					<div className="flex items-center text-sm text-[#A8B8C7]">
						<Users className="h-4 w-4 mr-2" />
						<span>{group.members.map(member => getMemberName(member.tgId)).join(', ')}</span>
					</div>
				</div>
			</div>

			<main className="flex-grow p-4 space-y-4 max-w-4xl mx-auto w-full">
				<ExpenseSummaryCard
					totalExpenses={totalExpenses}
					averagePerPerson={averagePerPerson}
					currency={group.currency}
				/>
				<SettlementCard
					settlements={userSettlements}
					title="Your Settlements"
					currentUserId={currentUserId}
					getMemberName={getMemberName}
					currency={group.currency}
				/>
				<SettlementCard
					settlements={otherSettlements}
					title="Other Settlements"
					currentUserId={currentUserId}
					getMemberName={getMemberName}
					currency={group.currency}
				/>
			</main>
		</div>
	);
};

export default withMainButton('mainButton', true, GroupDetails);