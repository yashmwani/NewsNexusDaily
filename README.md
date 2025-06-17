# NewsNexus Daily

NewsNexus Daily is a personalized news aggregation and delivery service that sends daily news summaries to subscribers based on their interests and preferred time. The service uses AI to summarize news articles and delivers them via email. Users can manage their subscriptions, customize topics, and unsubscribe easily.

## Features

- **Personalized News Delivery:** Get daily news summaries based on your chosen topics and timezone.
- **AI-Powered Summaries:** News articles are summarized using OpenAI for concise, informative content.
- **Customizable Topics:** Choose from a variety of news topics or add your own.
- **Timezone Support:** Receive news at your preferred local time.
- **Subscription Management:** Easily manage your subscription preferences.
- **Unsubscribe Option:** Simple one-click unsubscribe process or by email.
- **Recent News & AI Chat:** Fetch recent news or chat with an AI assistant for news queries.

## Tech Stack

- **Backend:** Node.js with Express.js
- **Database:** MongoDB with Mongoose ODM
- **Email Service:** Nodemailer (SMTP)
- **AI Integration:** OpenAI API for news summarization and chat
- **News API:** NewsAPI.org for fetching news articles
- **Frontend:** HTML, CSS, JavaScript (static files)
- **Scheduling:** node-schedule, moment-timezone

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- OpenAI API key
- NewsAPI.org API key
- SMTP credentials (for sending emails)

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
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_email_address
SMTP_PASS=your_email_password
PORT=4000
```

## Project Structure

```
NewsNexusDaily/
├── public/                 # Static files
│   ├── subscribe.html      # Subscription page
│   ├── subscriber.html     # Subscription management page
│   ├── unsubscribe.html    # Unsubscribe page
│   ├── app-icon.html       # App icon
│   └── favicon.svg         # Favicon
├── main.html               # Landing page
├── server.js               # Main application file
├── package.json            # Project dependencies
└── README.md               # Project documentation
```

## API Endpoints

### Subscription Management
- `POST /api/subscribe`: Create or update a subscription. Requires `{ email, topics, timezone }` in the body.
- `GET /api/subscriber/:email`: Get subscriber details (topics, timezone) by email.
- `POST /api/unsubscribe-by-email`: Unsubscribe by email. Requires `{ email }` in the body. Deletes the subscriber.
- `GET /api/unsubscribe/:token`: Unsubscribe using a unique token (sent in email). Deactivates the subscriber.

### News Delivery & AI
- `GET /api/news`: Fetch recent news articles (deprecated, use /api/recent-news).
- `GET /api/recent-news`: Fetches the latest top headlines (category, headline, summary, source, time, date, url).
- `GET /api/summarize`: Get AI-generated summaries (internal use).
- `POST /api/chat`: Chat with the AI news assistant. Requires `{ message }` in the body. Returns a list of news items with headings, summaries, and links.

### Other
- `GET /test-email`: Test SMTP and MongoDB connection, and print active subscribers (for development/testing).

## Usage

1. Start the server:
```bash
node server.js
```

2. Access the application:
- Main page: `http://localhost:4000`
- Subscribe: `http://localhost:4000/subscribe`
- Manage subscription: `http://localhost:4000/subscriber.html`
- Unsubscribe: `http://localhost:4000/unsubscribe.html`

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
- Delivers at subscriber's preferred time (timezone-aware)

### Subscription Management
- Easy subscription process
- Topic customization
- Timezone selection
- Simple unsubscribe option (via email link or by email)

### AI News Assistant
- Real-time chat endpoint for news queries
- Returns 3-5 news items from reputable sources with summaries and links

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Acknowledgments

- OpenAI for providing the AI summarization capabilities
- NewsAPI.org for the news aggregation service
- MongoDB for the database solution
- Express.js for the web framework

## Support

For support, email yashmwani@gmail.com or open an issue in the repository. 
