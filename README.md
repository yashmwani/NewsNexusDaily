# NewsNexus Daily

NewsNexus Daily is a personalized news aggregation and delivery service that sends daily news summaries to subscribers based on their interests. The service uses AI to summarize news articles and delivers them via email at the subscriber's preferred time.

## Features

- **Personalized News Delivery**: Get daily news summaries based on your chosen topics
- **AI-Powered Summaries**: News articles are summarized using AI for concise, informative content
- **Customizable Topics**: Choose from a variety of news topics or add your own
- **Timezone Support**: Receive news at your preferred local time
- **Subscription Management**: Easily manage your subscription preferences
- **Unsubscribe Option**: Simple one-click unsubscribe process

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Email Service**: Nodemailer
- **AI Integration**: OpenAI API for news summarization
- **News API**: NewsAPI.org for fetching news articles
- **Frontend**: HTML, CSS, JavaScript

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- OpenAI API key
- NewsAPI.org API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/NewsNexusDaily.git
cd NewsNexusDaily
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
MONGODB_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key
NEWS_API_KEY=your_newsapi_key
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_password
```

## Project Structure

```
NewsNexusDaily/
├── public/                 # Static files
│   ├── subscribe.html     # Subscription page
│   ├── subscriber.html    # Subscription management page
│   └── unsubscribe.html   # Unsubscribe page
├── server.js              # Main application file
├── package.json           # Project dependencies
└── README.md             # Project documentation
```

## API Endpoints

### Subscription Management
- `POST /api/subscribe`: Create or update a subscription
- `GET /api/subscriber/:email`: Get subscriber details
- `POST /api/unsubscribe-by-email`: Unsubscribe by email
- `GET /api/unsubscribe/:token`: Unsubscribe using token

### News Delivery
- `GET /api/news`: Fetch recent news articles
- `GET /api/summarize`: Get AI-generated summaries

## Usage

1. Start the server:
```bash
node server.js
```

2. Access the application:
- Main page: `http://localhost:4000`
- Subscribe: `http://localhost:4000/subscribe`
- Manage subscription: `http://localhost:4000/subscriber.html`

## Features in Detail

### News Aggregation
- Fetches news from multiple sources using NewsAPI.org
- Categorizes articles by topic
- Removes duplicates and irrelevant content

### AI Summarization
- Uses OpenAI's GPT model to generate concise summaries
- Maintains key information while reducing length
- Preserves important context and facts

### Email Delivery
- Sends personalized news digests
- Includes article summaries and source links
- Delivers at subscriber's preferred time

### Subscription Management
- Easy subscription process
- Topic customization
- Timezone selection
- Simple unsubscribe option

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for providing the AI summarization capabilities
- NewsAPI.org for the news aggregation service
- MongoDB for the database solution
- Express.js for the web framework

## Support

For support, email yashmwani@gmail.com or open an issue in the repository. 