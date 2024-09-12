'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useInitData, useHapticFeedback } from '@telegram-apps/sdk-react'
import { Users, ChevronRight, Search, Loader2, Wallet, Plus, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useGroupStore } from '@/lib/store'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'

interface Group {
	id: number
	title: string
	type: string
	memberCount: number
	lastActive: string
}

interface WalletInfo {
	balances: {
		[key: string]: number
	},
	id: string,
	walletId: string
}

export default function Dashboard() {
	const [groups, setGroups] = useState<Group[]>([])
	const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [refreshing, setRefreshing] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [processingGroup, setProcessingGroup] = useState<number | null>(null)

	const router = useRouter()
	const initData = useInitData()
	const haptic = useHapticFeedback()

	const fetchData = useCallback(async () => {
		setRefreshing(true)
		try {
			if (!initData?.user?.id) {
				throw new Error('User ID not found')
			}

			// TEST Replace initData.user.id with your own Telegram ID for testing
			const testUserId = process.env.NEXT_PUBLIC_TEST_USER_ID
			const userId = testUserId
			// const userId = initData?.user?.id

			const [groupsResponse, walletResponse] = await Promise.all([
				fetch(`/api/groups?tgId=${userId}`),
				fetch(`/api/wallet?tgId=${userId}`)
			])

			if (!groupsResponse.ok || !walletResponse.ok) {
				throw new Error('Failed to fetch data')
			}

			const groupsData = await groupsResponse.json()
			const walletData = await walletResponse.json()

			setGroups(groupsData.groups)
			setWalletInfo(walletData.user.wallet)
		} catch (err) {
			setError('Failed to fetch data. Please try again.')
			console.error(err)
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}, [initData])

	useEffect(() => {
		fetchData()
	}, [fetchData])

	const processMessages = async (groupId: number) => {
		setProcessingGroup(groupId)
		haptic.impactOccurred('light')
		try {
			const response = await fetch('/api/groups', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(groupId),
			})

			if (!response.ok) {
				throw new Error('Failed to process messages')
			}

			const data = await response.json()
			data.group.currency = data.group.currency === 'USD' ? '$' : data.group.currency === 'EUR' ? '€' : data.group.currency
			useGroupStore.getState().setGroupData(data)
			// save data to local storage
			localStorage.setItem('groupData', JSON.stringify(data))
			router.push(`/group-details?id=${groupId}`)
		} catch (err) {
			setError('Failed to process messages. Please try again.')
			console.error(err)
		} finally {
			setProcessingGroup(null)
		}
	}

	const filteredGroups = groups.filter(group =>
		group.title.toLowerCase().includes(searchTerm.toLowerCase())
	)

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen bg-[#17212B]">
				<LoadingSpinner size="large" />
			</div>
		)
	}

	return (
		<div className="flex flex-col h-screen bg-[#17212B] text-[#F5F5F5]">
			<main className="flex-grow overflow-y-auto p-4 space-y-4">
				{error && (
					<div className="bg-[#E53935] bg-opacity-20 border border-[#E53935] text-[#E53935] px-4 py-3 rounded mb-4 animate-pulse">
						<p>{error}</p>
					</div>
				)}
				<Card className="bg-gradient-to-br from-[#2B5278] to-[#242F3D] border-none shadow-lg">
					<CardHeader className="pb-2">
						<CardTitle className="text-[#F5F5F5] flex items-center text-xl">
							<div className="flex items-center">
								<Wallet className="mr-2 h-6 w-6" />
								<span className="mr-2">Your Wallet</span>
								<a href={`https://sepolia.basescan.org/address/${walletInfo?.id.toLowerCase()}`} target="_blank" rel="noopener noreferrer">
									<ExternalLink className="h-4 w-4 text-[#A8B8C7] hover:text-[#F5F5F5] transition-colors duration-300" />
								</a>
							</div>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div>
								<p className="text-sm text-[#A8B8C7] mb-1">Balances</p>
								{walletInfo ? (
									<div className="grid grid-cols-2 gap-2">
										{Object.entries(walletInfo.balances).map(([currency, amount]) => (
											<div key={currency} className="bg-[#17212B] rounded-lg p-3">
												<p className="text-xs text-[#A8B8C7]">{currency.toUpperCase()}</p>
												<p className="text-lg font-bold text-[#F5F5F5]">{amount}</p>
											</div>
										))}
									</div>
								) : (
									<p className="text-[#F5F5F5] italic">No balance information available</p>
								)}
							</div>
							<Button
								onClick={() => {
									haptic.impactOccurred('light')
									window.open('https://faucet.circle.com/', '_blank')
								}}
								className="w-full bg-[#5288C1] hover:bg-[#4A7EB0] text-white transition-colors duration-300"
							>
								<Plus className="mr-2 h-4 w-4" /> Add Funds
							</Button>
						</div>
					</CardContent>
				</Card>

				<div>
					<h2 className="text-xl font-bold text-[#5288C1] mb-2">Your Groups</h2>
					<div className="relative mb-4">
						<Search className="absolute left-3 top-2.5 h-5 w-5 text-[#8E99A4]" />
						<Input
							type="text"
							placeholder="Search groups..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full bg-[#242F3D] text-[#F5F5F5] rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-[#5288C1] border-none"
						/>
					</div>
					<ul className="space-y-3">
						{filteredGroups.map((group, index) => (
							<li
								key={group.id}
								className="bg-[#242F3D] rounded-lg shadow-lg transition-all duration-300 ease-in-out transform hover:bg-[#2B5278] border-2 border-transparent hover:border-[#5288C1]"
								style={{ animationDelay: `${index * 50}ms` }}
							>
								<button
									className="w-full text-left p-2 focus:outline-none focus:ring-2 focus:ring-[#5288C1] rounded-lg transition-colors duration-300 flex items-center justify-between"
									onClick={() => processMessages(group.id)}
									disabled={processingGroup === group.id}
								>
									<div className="flex items-center flex-1">
										<div className="flex-shrink-0 bg-[#2B5278] rounded-full p-2">
											<Users className="h-6 w-6 text-[#F5F5F5]" aria-hidden="true" />
										</div>
										<div className="ml-4 flex-1">
											<p className="text-lg font-medium text-[#F5F5F5]">{group.title}</p>
											{/* <p className="text-sm text-[#A8B8C7]">{group.memberCount} members</p> */}
											<p className="text-sm text-[#A8B8C7]">4 members</p>
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
				</div>
			</main>
		</div>
	)
}