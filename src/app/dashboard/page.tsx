'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useInitData, useHapticFeedback } from '@telegram-apps/sdk-react';
import { Users, RefreshCcw, ChevronRight, Search, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGroupStore } from '@/lib/store';

interface Group {
	id: number;
	title: string;
	type: string;
	memberCount: number;
	lastActive: string;
}

const Dashboard = () => {
	const [groups, setGroups] = useState<Group[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [refreshing, setRefreshing] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [processingGroup, setProcessingGroup] = useState<number | null>(null);

	const router = useRouter();
	const initData = useInitData();
	const haptic = useHapticFeedback();

	const fetchGroups = useCallback(async () => {
		setRefreshing(true);
		try {
			if (!initData?.user?.id) {
				throw new Error('User ID not found');
			}

			const response = await fetch(`/api/groups?tgId=${initData.user.id}`);
			if (!response.ok) {
				throw new Error('Failed to fetch groups');
			}

			const data = await response.json();
			setGroups(data.groups);
		} catch (err) {
			setError('Failed to fetch groups. Please try again.');
			console.error(err);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [initData]);

	useEffect(() => {
		fetchGroups();
	}, [fetchGroups]);

	const processMessages = async (groupId: number) => {
		setProcessingGroup(groupId);
		haptic.impactOccurred('light');
		try {
			const response = await fetch('/api/groups', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(groupId),
			});

			if (!response.ok) {
				throw new Error('Failed to process messages');
			}

			const data = await response.json();
			useGroupStore.getState().setGroupData(data);
			router.push(`/group-details?id=${groupId}`);
		} catch (err) {
			setError('Failed to process messages. Please try again.');
			console.error(err);
		} finally {
			setProcessingGroup(null);
		}
	};

	const filteredGroups = groups.filter(group =>
		group.title.toLowerCase().includes(searchTerm.toLowerCase())
	);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen bg-[#0E1621]">
				<div className="animate-pulse flex flex-col items-center">
					<div className="w-20 h-20 bg-[#2B5278] rounded-full mb-4"></div>
					<div className="h-4 bg-[#2B5278] rounded w-32"></div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-screen bg-[#0E1621] text-[#F5F5F5]">
			<header className="bg-[#17212B] p-4 sticky top-0 z-10 shadow-md">
				<div className="flex justify-between items-center mb-4">
					<h1 className="text-2xl font-bold text-[#5EBBF0]">Your Groups</h1>
					<button
						onClick={() => {
							haptic.impactOccurred('medium');
							fetchGroups();
						}}
						className={`p-2 rounded-full bg-[#2B5278] hover:bg-[#3A6D9A] focus:outline-none focus:ring-2 focus:ring-[#5EBBF0] transition-all duration-300 ease-in-out transform ${refreshing ? 'rotate-180' : ''}`}
					>
						<RefreshCcw className={`h-6 w-6 ${refreshing ? 'animate-spin' : ''}`} />
					</button>
				</div>
				<div className="relative">
					<input
						type="text"
						placeholder="Search groups..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="w-full bg-[#242F3D] text-[#F5F5F5] rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-[#5EBBF0]"
					/>
					<Search className="absolute left-3 top-2.5 h-5 w-5 text-[#8E99A4]" />
				</div>
			</header>
			<main className="flex-grow overflow-y-auto p-4">
				{error && (
					<div className="bg-[#E53935] bg-opacity-20 border border-[#E53935] text-[#E53935] px-4 py-3 rounded mb-4 animate-pulse">
						<p>{error}</p>
					</div>
				)}
				<ul className="space-y-3">
					{filteredGroups.map((group, index) => (
						<li
							key={group.id}
							className="bg-[#17212B] rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:translate-x-2"
							style={{ animationDelay: `${index * 50}ms` }}
						>
							<button
								className="w-full text-left p-4 focus:outline-none focus:ring-2 focus:ring-[#5EBBF0] rounded-lg transition-colors duration-300 flex items-center justify-between"
								onClick={() => processMessages(group.id)}
								disabled={processingGroup === group.id}
							>
								<div className="flex items-center flex-1">
									<div className="flex-shrink-0 bg-[#2B5278] rounded-full p-2">
										<Users className="h-8 w-8 text-[#F5F5F5]" aria-hidden="true" />
									</div>
									<div className="ml-4 flex-1">
										<p className="text-lg font-medium text-[#F5F5F5]">{group.title}</p>
									</div>
								</div>
								{processingGroup === group.id ? (
									<Loader2 className="h-6 w-6 text-[#8E99A4] ml-2 animate-spin" />
								) : (
									<ChevronRight className="h-6 w-6 text-[#8E99A4] ml-2" />
								)}
							</button>
						</li>
					))}
				</ul>
			</main>
		</div>
	);
};

export default Dashboard;