# Xpensify - Telegram Mini App for Expense Splitting

Xpensify is a Telegram Mini App designed to simplify expense splitting among friends and groups. Built with Next.js and integrated with Telegram's platform, it offers a seamless experience for managing shared expenses.

## Features

- Create and manage expense groups
- Add expenses and split them among group members
- View balances and settlements
- Secure wallet integration for transactions
- User-friendly interface designed for Telegram

## Technologies Used

- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Prisma](https://www.prisma.io/)
- [@telegram-apps/sdk-react](https://docs.telegram-mini-apps.com/packages/telegram-apps-sdk-react)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Zustand](https://github.com/pmndrs/zustand)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   pnpm install
   ```
3. Set up environment variables (see `.env.example`)
4. Run the development server:
   ```
   pnpm run dev
   ```

### Environment Variables

Create a `.env` file in the root directory and add the following variables:

	DATABASE_URL=your_database_url
	COINBASE_KEY_NAME=your_coinbase_key_name
	COINBASE_PRIVATE_KEY=your_coinbase_private_key
	ENCRYPTION_KEY=your_32_byte_encryption_key
	API_URL=your_api_url

Replace the placeholder values with your actual credentials and URLs.

### Database Setup

1. Make sure you have PostgreSQL installed and running
2. Update the `DATABASE_URL` in your `.env` file
3. Run Prisma migrations:
   ```
   npx prisma migrate dev
   ```

## Development

To start the development server with HTTPS:
```
pnpm run dev:https
```

This will start the server using the experimental HTTPS feature of Next.js.

## Deployment

This project is designed to be deployed as a Telegram Mini App. Follow these steps:

1. Build the project: `pnpm run build`
2. Deploy the `.next` folder to your hosting provider
3. Set up your Telegram Bot and configure the Web App URL
4. Ensure all environment variables are set in your production environment

For more detailed deployment instructions, refer to the [Telegram Mini Apps documentation](https://docs.telegram-mini-apps.com/).

## Video Demo

Check out our video demo to see Xpensify in action:

[Watch the Demo Video](./Xpensify.mp4)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
