'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useInitData, useHapticFeedback } from '@telegram-apps/sdk-react'
import { Wallet, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'

export default function OnboardingPage() {
	const [step, setStep] = React.useState(-1) // Start with -1 to indicate loading
	const [walletId, setWalletId] = React.useState('')
	const [walletAddress, setWalletAddress] = React.useState('')
	const [loading, setLoading] = React.useState(true)
	const [error, setError] = React.useState('')

	const router = useRouter()
	const initData = useInitData()
	const haptic = useHapticFeedback()

	// TEST Replace initData.user.id with your own Telegram ID for testing
	if (!process.env.NEXT_PUBLIC_TEST_USER_ID) {
		console.log("NEXT_PUBLIC_TEST_USER_ID is not set. Please set it in the .env file.");
	}

	const testUser = {
		id: process.env.NEXT_PUBLIC_TEST_USER_ID || '',
		username: 'testuser',
		firstName: 'Test',
		lastName: 'User'
	}
	const user = testUser
	// const user = initData?.user

	React.useEffect(() => {
		const checkUserExists = async () => {
			if (initData?.user?.id) {
				try {
					const response = await fetch(`/api/wallet?tgId=${user.id}`)
					if (response.ok) {
						router.push('/dashboard')
					} else if (response.status === 404) {
						setStep(0) // Set to first step only if user doesn't exist
					} else {
						throw new Error('Failed to check user')
					}
				} catch (err) {
					setError('Failed to check user status. Please try again.')
					console.error(err)
				} finally {
					setLoading(false)
				}
			}
		}

		checkUserExists()
	}, [initData, router])

	const handleCreateWallet = async () => {
		setLoading(true)
		setError('')
		haptic.impactOccurred('medium')
		try {
			if (!initData || !initData.user) {
				throw new Error('User data not available')
			}

			const response = await fetch('/api/wallet', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					tgId: user.id.toString(),
					username: user.username,
					firstName: user.firstName,
					lastName: user.lastName
				}),
			})

			if (!response.ok) {
				throw new Error('Failed to create wallet')
			}

			const data = await response.json()
			setWalletId(data.wallet_id)
			setWalletAddress(data.address)
			setStep(2)
		} catch (err) {
			setError('Failed to create wallet. Please try again.')
			console.error(err)
		} finally {
			setLoading(false)
		}
	}

	const handleFinish = async () => {
		haptic.impactOccurred('medium')
		try {
			router.push('/dashboard')
		} catch (err) {
			setError('Failed to complete onboarding. Please try again.')
			console.error(err)
		}
	}

	const steps = [
		{
			title: 'Welcome',
			content: (
				<div className="space-y-6">
					<p className="text-[#A8B8C7]">Hi {initData?.user?.firstName || 'there'}! Let's set up your wallet for easy expense splitting.</p>
					<Button onClick={() => { setStep(1); haptic.impactOccurred('light') }} className="w-full bg-[#5288C1] hover:bg-[#4A7EB0] text-white">
						Get Started
					</Button>
				</div>
			),
		},
		{
			title: 'Create Wallet',
			content: (
				<div className="space-y-4">
					<p className="text-[#A8B8C7]">Click the button below to create your secure Coinbase wallet.</p>
					{error && <p className="text-[#E53935]">{error}</p>}
					<Button onClick={handleCreateWallet} disabled={loading} className="w-full bg-[#5288C1] hover:bg-[#4A7EB0] text-white disabled:bg-[#3B5998] disabled:text-[#A8B8C7]">
						{loading ? 'Creating...' : 'Create Wallet'}
					</Button>
				</div>
			),
		},
		{
			title: 'Wallet Created',
			description: 'Your wallet is ready to use',
			content: (
				<div className="space-y-4">
					<p className="text-[#A8B8C7]">Great! Your wallet has been created successfully.</p>
					<Card className="bg-[#2B5278] border-none">
						<CardContent className="pt-6">
							<p className="text-sm font-medium text-[#A8B8C7]">Your wallet address is:</p>
							{/* <p className="text-xl font-bold text-white">{walletId}</p> */}
							<div className="flex items-center space-x-2">
								<p className="text-lg font-bold text-white">
									<span onClick={() => navigator.clipboard.writeText(walletAddress)}>
										{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
									</span>
								</p>
								<a href={`https://sepolia.basescan.org/address/${walletAddress.toLowerCase()}`} target="_blank" rel="noopener noreferrer" className="ml-2">
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#A8B8C7] hover:text-[#5288C1]">
										<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
										<polyline points="15 3 21 3 21 9"></polyline>
										<line x1="10" y1="14" x2="21" y2="3"></line>
									</svg>
								</a>
							</div>
						</CardContent>
					</Card>
					<Button onClick={handleFinish} className="w-full bg-[#5288C1] hover:bg-[#4A7EB0] text-white">
						Go to Dashboard
					</Button>
				</div>
			),
		},
	]

	if (!initData || loading || step === -1) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-[#17212B]">
				<LoadingSpinner size="large" />
			</div>
		)
	}


	return (
		<div className="min-h-screen bg-[#17212B] text-white flex flex-col">
			<main className="flex-grow flex flex-col items-center justify-center p-4">
				<AnimatePresence mode="wait">
					<motion.div
						key={step}
						initial={{ opacity: 0, x: 100 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -100 }}
						transition={{ duration: 0.3 }}
						className="w-full max-w-md"
					>
						<Card className="bg-[#242F3D] border-none shadow-lg">
							<CardHeader>
								<div className="flex items-center space-x-4">
									<div className="bg-[#2B5278] rounded-full p-3">
										{step === 2 ? (
											<CheckCircle className="h-8 w-8 text-[#5288C1]" />
										) : (
											<Wallet className="h-8 w-8 text-[#5288C1]" />
										)}
									</div>
									<div>
										<CardTitle className="text-[#5288C1]">{steps[step].title}</CardTitle>
										<p className="text-sm text-[#A8B8C7]">{steps[step].description}</p>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								{steps[step].content}
							</CardContent>
						</Card>
					</motion.div>
				</AnimatePresence>
				<div className="flex justify-between flex-col items-center w-full mt-6 px-10">
					<Progress value={(step + 1) / steps.length * 100} className="bg-[#2B5278] mb-2" indicatorClassName="bg-[#5288C1]" />
					<p className="text-sm text-[#A8B8C7]">Step {step + 1} of {steps.length}</p>
				</div>
			</main>
		</div>
	)
}