'use client'

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, ArrowRight, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGroupStore } from '@/lib/store';
import { useMainButton, withMainButton, useBackButton } from '@telegram-apps/sdk-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'

const GroupDetails = () => {
	const router = useRouter();
	const { groupData } = useGroupStore();
	const mainButton = useMainButton();
	const backButton = useBackButton();
	const testUserId = process.env.NEXT_PUBLIC_TEST_USER_ID
	const currentUserId = testUserId
	const [isSettling, setIsSettling] = useState(false);
	const [isSettled, setIsSettled] = useState(false);
	const [showSettledMessage, setShowSettledMessage] = useState(false);

	const idToNameMap: { [key: string]: string } = {
		'1509868794': 'Emma',
		'142092237': 'John',
		'5143097120': 'Olivia',
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
			// Mock API call
			// await new Promise(resolve => setTimeout(resolve, 3000));

			// // Mock successful response
			// const mockResponse = { success: true, message: 'Your expenses settled successfully' };

			// if (mockResponse.success) {
			// 	setIsSettled(true);
			// 	setShowSettledMessage(true);
			// 	setTimeout(() => setShowSettledMessage(false), 4000);
			// 	mainButton.setText('Settled');

			// 	// Update the settlements array to remove settled transactions
			// 	const updatedSettlements = groupData.settlements.filter(
			// 		s => s.fromUserId !== currentUserId
			// 	);
			// 	useGroupStore.getState().setGroupData({
			// 		...groupData,
			// 		settlements: updatedSettlements
			// 	});
			// } else {
			// 	throw new Error(mockResponse.message || 'Settlement failed');
			// }

			// Assuming groupData.settlements is an array of settlement objects
			const response = await fetch('/api/payments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					settlements: groupData?.settlements || [],
					currentUserId: currentUserId
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			console.log(`Settlements result:`, result);

			// Update the settlements array to remove settled transactions
			const updatedSettlements = result.updatedSettlements;
			useGroupStore.getState().setGroupData({
				...groupData,
				settlements: updatedSettlements
			});

			mainButton.setText('Settled');
		} catch (error) {
			console.error('Error settling expenses:', error);
			mainButton.setText('Settlement Failed');
		} finally {
			mainButton.hideLoader();
			mainButton.enable();
			setTimeout(() => {
				setIsSettling(false);
			}, 1000);
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
	}, [mainButton, groupData, isSettled]);

	useEffect(() => {
		backButton.show();
		backButton.on('click', () => router.back());
	}, [backButton, router]);

	if (!groupData) {
		setTimeout(() => {
			const groupData = localStorage.getItem('groupData')
			if (groupData) {
				useGroupStore.getState().setGroupData(JSON.parse(groupData))
			}
		}, 1000)
		return (
			<div className="flex items-center justify-center h-screen bg-[#17212B]">
				<LoadingSpinner size="large" />
			</div>
		);
	}

	const { group, totalExpenses, averagePerPerson, settlements } = groupData;

	const getMemberName = (userId: string) => {
		if (userId in idToNameMap) {
			return idToNameMap[userId];
		}
		if (group.members.find(m => m.tgId === userId)?.username === 'Krumil') {
			return 'Krumil';
		}
		return 'Unknown User';
	};

	const userSettlements = settlements.filter(s => s.fromUserId === currentUserId || s.toUserId === currentUserId);
	const otherSettlements = settlements.filter(s => s.fromUserId !== currentUserId && s.toUserId !== currentUserId);

	const renderSettlements = (settlementsToRender: typeof settlements, title: string) => (
		<Card className="bg-gradient-to-br from-[#2B5278] to-[#242F3D] border-none shadow-lg text-[#F5F5F5]">
			<CardHeader className="pb-2">
				<CardTitle className="text-[#F5F5F5] text-xl">{title}</CardTitle>
			</CardHeader>
			<CardContent>
				{settlementsToRender.length > 0 ? (
					<ul className="space-y-2">
						{settlementsToRender.map((settlement, index) => (
							<li
								key={index}
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
									{group.currency}{settlement.amount.toFixed(2)}
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

	return (
		<div className="flex flex-col min-h-screen bg-[#17212B] text-[#F5F5F5]">
			<AnimatePresence>
				{(isSettling || showSettledMessage) && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 flex items-center justify-center bg-[#17212B]"
					>
						{showSettledMessage && <Confetti recycle={false} numberOfPieces={200} />}
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							exit={{ scale: 0 }}
							className="text-center"
						>
							{isSettled ? (
								<motion.div
									initial={{ scale: 0, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									exit={{ scale: 0, opacity: 0 }}
									transition={{
										duration: 0.8,
										type: "spring",
										stiffness: 200,
										damping: 20
									}}
								>
									<Check className="w-24 h-24 mx-auto text-green-500 mb-4" />
									<motion.h2
										initial={{ y: 40, opacity: 0 }}
										animate={{ y: 0, opacity: 1 }}
										transition={{ delay: 0.8, duration: 0.8 }}
										className="text-2xl font-bold mb-2"
									>
										Your Expenses Settled!
									</motion.h2>
									<motion.p
										initial={{ y: 40, opacity: 0 }}
										animate={{ y: 0, opacity: 1 }}
										transition={{ delay: 1.2, duration: 0.8 }}
										className="text-[#A8B8C7]"
									>
										All your payments have been processed successfully.
									</motion.p>
								</motion.div>
							) : (
								<>
									<motion.div
										animate={{ rotate: 360 }}
										transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
										className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full mx-auto mb-4"
									></motion.div>
									<h2 className="text-2xl font-bold mb-2">Settling Your Expenses</h2>
									<p className="text-[#A8B8C7]">Please wait while we process your payments...</p>
								</>
							)}
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			<div className="flex backdrop-blur-lg p-4 sticky top-0 z-10 shadow-lg">
				<div className="flex mb-2 ">
					{/* <ArrowLeft
						className="mt-[5px] cursor-pointer"
						onClick={() => router.back()}
					/> */}
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
			</div>

			<main className="flex-grow p-4 space-y-4 max-w-4xl mx-auto w-full">
				<Card className="bg-gradient-to-br from-[#2B5278] to-[#242F3D] border-none shadow-lg">
					<CardHeader className="pb-2">
						<CardTitle className="text-[#F5F5F5] text-xl">Expense Summary</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-4">
							<div className="bg-[#17212B] rounded-lg p-3">
								<p className="text-xs text-[#A8B8C7]">Total Expenses</p>
								<p className="text-lg font-bold text-[#F5F5F5]">
									{group.currency} {totalExpenses.toFixed(2)}
								</p>
							</div>
							<div className="bg-[#17212B] rounded-lg p-3">
								<p className="text-xs text-[#A8B8C7]">Average per Person</p>
								<p className="text-lg font-bold text-[#F5F5F5]">
									{group.currency} {averagePerPerson.toFixed(2)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{renderSettlements(userSettlements, "Your Settlements")}
				{renderSettlements(otherSettlements, "Other Settlements")}
			</main>
		</div>
	);
};

export default withMainButton('mainButton', true, GroupDetails);