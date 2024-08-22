'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { useInitData, useHapticFeedback } from '@telegram-apps/sdk-react';
import { ArrowLeft, ArrowRight, DollarSign } from 'lucide-react';

const OnboardingPage = () => {
	const [step, setStep] = React.useState(0);
	const [walletId, setWalletId] = React.useState('');
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState('');

	const router = useRouter();
	const initData = useInitData();
	const haptic = useHapticFeedback();

	React.useEffect(() => {
		const checkUserExists = async () => {
			if (initData?.user?.id) {
				try {
					const response = await fetch(`/api/wallet?tgId=${initData.user.id}`);
					if (response.ok) {
						router.push('/dashboard');
					} else if (response.status === 404) {
						setStep(0);
					} else {
						throw new Error('Failed to check user');
					}
				} catch (err) {
					setError('Failed to check user status. Please try again.');
					console.error(err);
				} finally {
					setLoading(false);
				}
			}
		};

		checkUserExists();
	}, [initData, router]);

	const handleCreateWallet = async () => {
		setLoading(true);
		setError('');
		haptic.impactOccurred('medium');
		try {
			if (!initData || !initData.user) {
				throw new Error('User data not available');
			}

			const response = await fetch('/api/wallet', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					tgId: initData.user.id.toString(),
					username: initData.user.username,
					firstName: initData.user.firstName,
					lastName: initData.user.lastName
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to create wallet');
			}

			const data = await response.json();
			setWalletId(data.wallet_id);
			setStep(2);
		} catch (err) {
			setError('Failed to create wallet. Please try again.');
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const handleFinish = async () => {
		haptic.impactOccurred('medium');
		try {
			// const response = await fetch('/api/onboarding/complete', {
			// 	method: 'POST',
			// 	headers: {
			// 		'Content-Type': 'application/json',
			// 	},
			// 	body: JSON.stringify({ tgId: initData?.user?.id.toString() }),
			// });

			// if (!response.ok) {
			// 	throw new Error('Failed to complete onboarding');
			// }

			router.push('/dashboard');
		} catch (err) {
			setError('Failed to complete onboarding. Please try again.');
			console.error(err);
		}
	};

	const steps = [
		{
			title: 'Welcome',
			description: 'Welcome to the Group Expense Splitter!',
			content: (
				<div className="space-y-4">
					<p className="text-[#F5F5F5]">Hi {initData?.user?.firstName || 'there'}! Let's get you set up with a wallet.</p>
					<button
						onClick={() => {
							setStep(1);
							haptic.impactOccurred('light');
						}}
						className="w-full bg-[#5EBBF0] text-[#0E1621] py-2 px-4 rounded-lg font-medium hover:bg-[#4C9ED9] transition-colors duration-300"
					>
						Get Started
					</button>
				</div>
			),
		},
		{
			title: 'Create Wallet',
			description: 'Create your Coinbase wallet',
			content: (
				<div className="space-y-4">
					<p className="text-[#F5F5F5]">Click the button below to create your Coinbase wallet.</p>
					{error && <p className="text-[#E53935]">{error}</p>}
					<button
						onClick={handleCreateWallet}
						disabled={loading}
						className="w-full bg-[#5EBBF0] text-[#0E1621] py-2 px-4 rounded-lg font-medium hover:bg-[#4C9ED9] transition-colors duration-300 disabled:bg-[#2B5278] disabled:cursor-not-allowed"
					>
						{loading ? 'Creating...' : 'Create Wallet'}
					</button>
				</div>
			),
		},
		{
			title: 'Wallet Created',
			description: 'Your wallet has been created',
			content: (
				<div className="space-y-4">
					<p className="text-[#F5F5F5]">Great! Your wallet has been created successfully.</p>
					<p className="text-[#5EBBF0] bg-[#242F3D] p-3 rounded-lg">Your wallet ID is: {walletId}</p>
					<button
						onClick={handleFinish}
						className="w-full bg-[#5EBBF0] text-[#0E1621] py-2 px-4 rounded-lg font-medium hover:bg-[#4C9ED9] transition-colors duration-300"
					>
						Finish
					</button>
				</div>
			),
		},
	];

	if (!initData || loading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-[#0E1621]">
				<div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#5EBBF0]"></div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#0E1621] text-[#F5F5F5] flex flex-col">
			<header className="bg-[#17212B] p-4 sticky top-0 z-10 shadow-md flex items-center">
				{step > 0 && (
					<button
						onClick={() => {
							setStep(step - 1);
							haptic.impactOccurred('light');
						}}
						className="mr-4 p-2 rounded-full bg-[#2B5278] hover:bg-[#3A6D9A] focus:outline-none focus:ring-2 focus:ring-[#5EBBF0] transition-all duration-300"
					>
						<ArrowLeft className="h-6 w-6" />
					</button>
				)}
				<h1 className="text-2xl font-bold text-[#5EBBF0]">Onboarding</h1>
			</header>
			<main className="flex-grow flex items-center justify-center p-4">
				<div className="w-full max-w-md bg-[#17212B] rounded-lg shadow-lg p-6 space-y-6">
					<div className="flex items-center space-x-4 mb-4">
						<div className="bg-[#2B5278] rounded-full p-3">
							<DollarSign className="h-8 w-8 text-[#5EBBF0]" />
						</div>
						<div>
							<h2 className="text-xl font-semibold text-[#5EBBF0]">{steps[step].title}</h2>
							<p className="text-[#8E99A4]">{steps[step].description}</p>
						</div>
					</div>
					{steps[step].content}
					<div className="flex justify-between items-center mt-6">
						<p className="text-sm text-[#8E99A4]">Step {step + 1} of {steps.length}</p>
						{step < steps.length - 1 && (
							<button
								onClick={() => {
									setStep(step + 1);
									haptic.impactOccurred('light');
								}}
								className="p-2 rounded-full bg-[#2B5278] hover:bg-[#3A6D9A] focus:outline-none focus:ring-2 focus:ring-[#5EBBF0] transition-all duration-300"
							>
								<ArrowRight className="h-6 w-6 text-[#5EBBF0]" />
							</button>
						)}
					</div>
				</div>
			</main>
		</div>
	);
};

export default OnboardingPage;