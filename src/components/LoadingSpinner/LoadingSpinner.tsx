import React from 'react';

interface LoadingSpinnerProps {
	size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'medium' }) => {
	const sizeClasses = {
		small: 'h-8 w-8',
		medium: 'h-16 w-16',
		large: 'h-24 w-24',
	};

	return (
		<div className="flex items-center justify-center bg-[#17212B] mb-2">
			<div className={`animate-spin rounded-full border-t-4 border-b-4 border-[#5288C1] ${sizeClasses[size]}`}></div>
		</div>
	);
};

export default LoadingSpinner;