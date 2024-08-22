'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InitData, useInitData } from '@telegram-apps/sdk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const OnboardingWizard = () => {
	const [step, setStep] = useState(0);
	const [walletId, setWalletId] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	const router = useRouter();
	let initData = useInitData();

	useEffect(() => {
		const checkUserExists = async () => {
			if (initData?.user?.id) {
				try {
					const response = await fetch(`/api/wallet?tgId=${initData.user.id}`);
					if (response.ok) {
						// User exists, redirect to dashboard
						router.push('/dashboard');
					} else if (response.status === 404) {
						// User doesn't exist, start onboarding
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
		try {
			const response = await fetch('/api/onboarding/complete', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ tgId: initData?.user?.id.toString() }),
			});

			if (!response.ok) {
				throw new Error('Failed to complete onboarding');
			}

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
					<p>Hi {initData?.user?.firstName || 'there'}! Let's get you set up with a wallet.</p>
					<Button onClick={() => setStep(1)}>Get Started</Button>
				</div>
			),
		},
		{
			title: 'Create Wallet',
			description: 'Create your Coinbase wallet',
			content: (
				<div className="space-y-4">
					<p>Click the button below to create your Coinbase wallet.</p>
					{error && <p className="text-red-500">{error}</p>}
					<Button onClick={handleCreateWallet} disabled={loading}>
						{loading ? 'Creating...' : 'Create Wallet'}
					</Button>
				</div>
			),
		},
		{
			title: 'Wallet Created',
			description: 'Your wallet has been created',
			content: (
				<div className="space-y-4">
					<p>Great! Your wallet has been created successfully.</p>
					<p>Your wallet ID is: {walletId}</p>
					<Button onClick={handleFinish}>Finish</Button>
				</div>
			),
		},
	];

	if (!initData || loading) {
		return (
			<div className="container mx-auto p-4">
				<Card className="w-full max-w-md mx-auto">
					<CardContent>
						<p>Loading user data...</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto p-4">
				<Card className="w-full max-w-md mx-auto">
					<CardContent>
						<p className="text-red-500">{error}</p>
						<Button onClick={() => window.location.reload()}>Retry</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto p-4">
			<Card className="w-full max-w-md mx-auto">
				<CardHeader>
					<CardTitle>{steps[step].title}</CardTitle>
					<CardDescription>{steps[step].description}</CardDescription>
				</CardHeader>
				<CardContent>
					{steps[step].content}
				</CardContent>
				<CardFooter>
					<p className="text-sm text-gray-500">Step {step + 1} of {steps.length}</p>
				</CardFooter>
			</Card>
		</div>
	);
};

export default OnboardingWizard;