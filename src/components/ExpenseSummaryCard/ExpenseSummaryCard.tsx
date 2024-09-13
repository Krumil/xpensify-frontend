import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ExpenseSummaryCardProps {
	totalExpenses: number;
	averagePerPerson: number;
	currency: string;
}

const ExpenseSummaryCard: React.FC<ExpenseSummaryCardProps> = ({ totalExpenses, averagePerPerson, currency }) => (
	<Card className="bg-gradient-to-br from-[#2B5278] to-[#242F3D] border-none shadow-lg">
		<CardHeader className="pb-2">
			<CardTitle className="text-[#F5F5F5] text-xl">Expense Summary</CardTitle>
		</CardHeader>
		<CardContent>
			<div className="grid grid-cols-2 gap-4">
				<div className="bg-[#17212B] rounded-lg p-3">
					<p className="text-xs text-[#A8B8C7]">Total Expenses</p>
					<p className="text-lg font-bold text-[#F5F5F5]">
						{currency} {totalExpenses.toFixed(2)}
					</p>
				</div>
				<div className="bg-[#17212B] rounded-lg p-3">
					<p className="text-xs text-[#A8B8C7]">Average per Person</p>
					<p className="text-lg font-bold text-[#F5F5F5]">
						{currency} {averagePerPerson.toFixed(2)}
					</p>
				</div>
			</div>
		</CardContent>
	</Card>
);

export default ExpenseSummaryCard;