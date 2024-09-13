import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import Confetti from 'react-confetti';

interface SettlingOverlayProps {
	isSettling: boolean;
	isSettled: boolean;
	showSettledMessage: boolean;
}

const SettlingOverlay: React.FC<SettlingOverlayProps> = ({ isSettling, isSettled, showSettledMessage }) => (
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
);

export default SettlingOverlay;