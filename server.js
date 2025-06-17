require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const NewsAPI = require('newsapi');
const OpenAI = require('openai');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const axios = require('axios');
const sgMail = require('@sendgrid/mail');
const schedule = require('node-schedule');
const moment = require('moment-timezone');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from public directory
app.use(express.static('public'));
app.use(express.json());

// Initialize APIs
const newsapi = new NewsAPI(process.env.NEWS_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Create SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verify SMTP configuration
console.log('SMTP Configuration:', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Subscriber Schema
const subscriberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    topics: [{
        type: String,
        required: true
    }],
    timezone: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    unsubscribeToken: {
        type: String,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Generate unsubscribe token before saving
subscriberSchema.pre('save', function(next) {
    if (!this.unsubscribeToken) {
        this.unsubscribeToken = crypto.randomBytes(32).toString('hex');
    }
    next();
});

// Create model with explicit collection name
const Subscriber = mongoose.model('Subscriber', subscriberSchema, 'subscribers');

// Email template function
function createEmailTemplate(topics, summaries, articles = []) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { 
                    background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
                    color: white; 
                    padding: 20px; 
                    text-align: center;
                    border-radius: 10px;
                    margin-bottom: 20px;
                }
                .content { padding: 20px; }
                .topic { 
                    margin-bottom: 30px;
                    background: #fff;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    padding: 20px;
                }
                .topic h2 { 
                    color: #2d3748; 
                    border-bottom: 2px solid #e2e8f0; 
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                .article { 
                    margin-bottom: 30px;
                    padding: 15px;
                    background: #f8fafc;
                    border-radius: 8px;
                    border-left: 4px solid #5a67d8;
                }
                .article h3 { 
                    color: #2d3748; 
                    margin-bottom: 15px;
                    font-size: 1.3em;
                    padding-bottom: 5px;
                }
                .article-content {
                    margin-bottom: 15px;
                    line-height: 1.8;
                }
                .article a { 
                    color: #5a67d8; 
                    text-decoration: none;
                    font-weight: 600;
                    display: inline-block;
                    margin: 0 2px;
                    padding: 2px 5px;
                    border-radius: 4px;
                    background: rgba(90, 103, 216, 0.1);
                    transition: all 0.3s ease;
                }
                .article a:hover { 
                    color: #4c51bf;
                    background: rgba(90, 103, 216, 0.2);
                    transform: translateY(-1px);
                }
                .footer { 
                    text-align: center; 
                    padding: 20px; 
                    font-size: 0.9em; 
                    color: #718096;
                    border-top: 1px solid #e2e8f0;
                    margin-top: 30px;
                }
                .unsubscribe-link {
                    color: #e53e3e;
                    text-decoration: none;
                    font-weight: 500;
                    padding: 5px 10px;
                    border-radius: 4px;
                    background: rgba(229, 62, 62, 0.1);
                    transition: all 0.3s ease;
                    display: inline-block;
                    margin-top: 10px;
                }
                .unsubscribe-link:hover {
                    background: rgba(229, 62, 62, 0.2);
                    text-decoration: none;
                }
                .source-link {
                    color: #718096;
                    font-size: 0.9em;
                    font-style: italic;
                    margin-top: 10px;
                }
                .source-link a {
                    color: #4a5568;
                    text-decoration: none;
                    font-weight: 500;
                    padding: 2px 5px;
                    border-radius: 3px;
                    background: rgba(74, 85, 104, 0.1);
                }
                .source-link a:hover {
                    background: rgba(74, 85, 104, 0.2);
                }
                .read-more {
                    display: inline-block;
                    margin-top: 10px;
                    color: #5a67d8;
                    text-decoration: none;
                    font-weight: 500;
                    padding: 5px 10px;
                    border-radius: 4px;
                    background: rgba(90, 103, 216, 0.1);
                    transition: all 0.3s ease;
                }
                .read-more:hover {
                    background: rgba(90, 103, 216, 0.2);
                    transform: translateY(-1px);
                }
                .news-link {
                    color: #5a67d8;
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    display: inline-block;
                    margin: 0 2px;
                    padding: 2px 5px;
                    border-radius: 4px;
                    background: rgba(90, 103, 216, 0.1);
                }
                .news-link:hover {
                    color: #4c51bf;
                    transform: translateY(-1px);
                    background: rgba(90, 103, 216, 0.2);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Your Daily News Summary</h1>
                    <p>Stay informed with the latest updates</p>
                </div>
                <div class="content">
                    ${topics.map((topic, index) => {
                        const topicArticles = articles[index] || [];
                        // Robustly split summary into blocks for each article
                        const blocks = summaries[index].split(/\n{2,}(?=## )/).filter(b => b.trim().startsWith('##'));
                        console.log(`Summary blocks for topic '${topic}':`, blocks);
                        return `
                            <div class="topic">
                                <h2>${topic}</h2>
                                ${blocks.map(block => {
                                    if (block.startsWith('##')) {
                                        const [title, ...content] = block.split('\n');
                                        // Find the matching article for this block
                                        const articleIndex = parseInt(content[0]?.match(/\[(\d+)\]/)?.[1]) - 1;
                                        const matchingArticle = topicArticles[articleIndex];
                                        const processedContent = content.join('\n').replace(/\[(\d+)\]/g, (match, num) => {
                                            const articleIndex = parseInt(num) - 1;
                                            const article = topicArticles[articleIndex];
                                            if (article) {
                                                return `<a href="${article.url}" target="_blank" class="news-link">[${num}]</a>`;
                                            }
                                            return match;
                                        });
                                        return `
                                            <div class="article">
                                                <h3>${title.replace('##', '').trim()}</h3>
                                                <div class="article-content">
                                                    ${processedContent}
                                                </div>
                                                ${matchingArticle ? `
                                                    <a href="${matchingArticle.url}" target="_blank" class="read-more">
                                                        Read full article: ${matchingArticle.heading}
                                                    </a>
                                                ` : ''}
                                            </div>
                                        `;
                                    }
                                    return `<p>${block}</p>`;
                                }).join('')}
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="footer">
                    <p>This email was sent by NewsNexus Daily.</p>
                    <p>To manage your subscription preferences, <a href="https://newsnexusdaily.onrender.com/unsubscribe.html" class="unsubscribe-link">click here</a>.</p>
                    <p class="source-link">Sources: ${topics.map((topic, index) => {
                        const topicArticles = articles[index] || [];
                        return topicArticles.map(article => 
                            `<a href="${article.url}" target="_blank">${article.source.name}</a>`
                        ).join(', ');
                    }).join(' | ')}</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/main.html');
});

app.get('/subscribe', (req, res) => {
    res.sendFile(__dirname + '/public/subscribe.html');
});

app.post('/api/subscribe', async (req, res) => {
    try {
        const { email, topics, timezone } = req.body;

        // Validate input
        if (!email || !topics || !Array.isArray(topics) || topics.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Email and at least one topic are required'
            });
        }

        // Check if subscriber exists (including inactive ones)
        let subscriber = await Subscriber.findOne({ email });
        
        if (subscriber) {
            // Update existing subscriber
            subscriber.topics = topics;
            subscriber.timezone = timezone || 'UTC';
            subscriber.isActive = true; // Reactivate if previously unsubscribed
            await subscriber.save();
            return res.json({
                success: true,
                message: 'Subscription updated successfully!',
                subscriber
            });
        }

        // Create new subscriber
        subscriber = new Subscriber({
            email,
            topics,
            timezone: timezone || 'UTC',
            isActive: true
        });

        await subscriber.save();
        
        res.json({
            success: true,
            message: 'Successfully subscribed!',
            subscriber
        });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to subscribe'
        });
    }
});

// Add route to get subscriber topics
app.get('/api/subscriber/:email', async (req, res) => {
    try {
        const subscriber = await Subscriber.findOne({ email: req.params.email });
        if (!subscriber) {
            return res.status(404).json({
                success: false,
                message: 'Subscriber not found'
            });
        }
        res.json({
            success: true,
            topics: subscriber.topics,
            timezone: subscriber.timezone
        });
    } catch (error) {
        console.error('Error fetching subscriber:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subscriber data'
        });
    }
});

// Real-time news fetching
async function fetchNews(topic) {
    try {
        console.log('Fetching news for topic:', topic);
        
        // Handle sports queries specifically
        let searchQuery = topic;
        if (topic.toLowerCase().includes('football') || 
            topic.toLowerCase().includes('soccer') || 
            topic.toLowerCase().includes('sport')) {
            searchQuery = topic + ' sport';
        }

        console.log('Search query:', searchQuery);

        const response = await newsapi.v2.everything({
            q: searchQuery,
            language: 'en',
            sortBy: 'publishedAt',
            pageSize: 10,
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        });

        if (!response.articles || response.articles.length === 0) {
            console.log('No articles found in API response');
            return [];
        }

        // Filter and index articles with headings
        const relevantArticles = response.articles
            .filter(article => {
                const title = article.title?.toLowerCase() || '';
                const description = article.description?.toLowerCase() || '';
                const searchTerms = topic.toLowerCase().split(' ');
                return searchTerms.some(term => 
                    title.includes(term) || description.includes(term)
                );
            })
            .map((article, index) => ({
                ...article,
                index: index + 1, // Add 1-based index
                heading: article.title, // Store the heading
                category: determineCategory(article.source.name) // Add category based on source
            }));

        console.log('Relevant articles found:', relevantArticles.length);
        return relevantArticles.length > 0 ? relevantArticles : response.articles.map((article, index) => ({
            ...article,
            index: index + 1,
            heading: article.title,
            category: determineCategory(article.source.name)
        }));
    } catch (error) {
        console.error('Error fetching news:', error);
        return [];
    }
}

// Helper function to determine category based on source name
function determineCategory(sourceName) {
    const source = sourceName.toLowerCase();
    if (source.includes('tech')) return 'Technology';
    if (source.includes('sport')) return 'Sports';
    if (source.includes('business')) return 'Business';
    if (source.includes('politics')) return 'Politics';
    if (source.includes('entertainment')) return 'Entertainment';
    return 'General';
}

// AI summarization with sources and formatted headings
async function summarizeNews(articles) {
    try {
        if (!articles || articles.length === 0) {
            return "No articles available for this topic.";
        }

        const articlesText = articles.map((article, index) => {
            return `[${index + 1}] ${article.heading}\n${article.description || ''}\nSource: ${article.source.name}\nURL: ${article.url}\n\n`;
        }).join('\n');

        const prompt = `Please summarize the following news articles. Include key points and maintain the article reference numbers [1], [2], etc. in your summary. Each article should be on a new line and should include its heading. Format each article summary as follows:

## [Article Heading]
[Summary content with reference numbers]

Here are the articles to summarize:

${articlesText}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4.1",
            messages: [
                {
                    role: "system",
                    content: "You are a news summarizer. Summarize the articles while maintaining the reference numbers [1], [2], etc. in your text. Every new article should be on new line and should have heading of the news. Use the exact headings provided in the articles."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error in summarizeNews:', error);
        return "Error generating summary.";
    }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('requestNews', async (topic) => {
        const articles = await fetchNews(topic);
        const summary = await summarizeNews(articles);
        
        // Format the summary with HTML links
        const formattedSummary = summary.split('\n\n').map(block => {
            if (block.startsWith('##')) {
                const [title, ...content] = block.split('\n');
                const formattedContent = content.join('\n').replace(/\[(\d+)\]/g, (match, num) => {
                    const articleIndex = parseInt(num) - 1;
                    const article = articles[articleIndex];
                    return article ? `<a href="${article.url}" target="_blank" class="news-link">[${num}]</a>` : match;
                });
                return `<h3>${title.replace('##', '').trim()}</h3>${formattedContent}`;
            }
            return block;
        }).join('\n\n');

        socket.emit('newsUpdate', { 
            topic, 
            summary: formattedSummary, 
            articles 
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Test route to manually trigger email sending
app.get('/test-email', async (req, res) => {
  try {
    console.log('\n=== MANUAL EMAIL TEST STARTED ===');
    console.log('Current time:', new Date().toLocaleString());

    // Verify SMTP configuration
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('SMTP configuration is incomplete');
      return res.status(500).json({ 
        error: 'SMTP configuration error', 
        details: 'SMTP configuration is incomplete. Please check your environment variables.' 
      });
    }

    // Test SMTP connection
    console.log('Testing SMTP connection...');
    const testMsg = {
      to: 'newsnexusdaily@gmail.com',
      from: 'newsnexusdaily@gmail.com',
      subject: 'Test Email from NewsNexus Daily',
      text: 'This is a test email to verify SMTP configuration.',
      html: '<h1>Test Email</h1><p>This is a test email to verify SMTP configuration.</p>'
    };

    try {
      const info = await transporter.sendMail(testMsg);
      console.log('Test email sent successfully:', info);
    } catch (error) {
      console.error('SMTP test failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      return res.status(500).json({ 
        error: 'SMTP test failed', 
        details: error.message 
      });
    }

    // Test MongoDB connection and fetch subscribers
    console.log('\nTesting MongoDB connection and fetching subscribers...');
    const subscribers = await Subscriber.find({ isActive: true });
    console.log(`Found ${subscribers.length} active subscribers`);

    if (subscribers.length === 0) {
      console.log('No active subscribers found');
      return res.json({ 
        message: 'Test completed',
        smtp: 'Success',
        subscribers: 'None found'
      });
    }

    // Print subscriber details
    subscribers.forEach((subscriber, index) => {
      console.log(`\nSubscriber ${index + 1}:`);
      console.log('Email:', subscriber.email);
      console.log('Topics:', subscriber.topics);
      console.log('Active:', subscriber.isActive);
      console.log('ID:', subscriber._id);
    });

    res.json({ 
      message: 'Test completed',
      smtp: 'Success',
      subscribers: subscribers.length,
      details: subscribers.map(s => ({
        email: s.email,
        topics: s.topics,
        active: s.isActive
      }))
    });

    } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({ error: 'Test failed', details: error.message });
  }
});

// Schedule job to run every minute and send emails at 8:00 AM in each subscriber's timezone (testing)
schedule.scheduleJob('*/10 * * * *', async () => {
  try {
    const now = new Date();
    console.log(`\n=== TIMEZONE-AWARE EMAIL JOB ===`);
    console.log(`Server time: ${now.toISOString()}`);
    const subscribers = await Subscriber.find({ isActive: true });
    console.log(`Active subscribers: ${subscribers.length}`);

    for (const subscriber of subscribers) {
      if (!subscriber.topics || subscriber.topics.length === 0) continue;
      const userTime = moment.tz(now, subscriber.timezone);
      console.log(`Checking: ${subscriber.email} | TZ: ${subscriber.timezone} | User time: ${userTime.format('YYYY-MM-DD HH:mm')}`);
      // Send if it's between 8:00 and 8:19 AM in their timezone (wider window for testing)
      if (userTime.hour() === 8 && userTime.minute() < 10) {
        try {
          console.log(`--> SENDING EMAIL to ${subscriber.email} (user time: ${userTime.format('HH:mm')})`);
          // Fetch articles for each topic
          const articlesByTopic = await Promise.all(
            subscriber.topics.map(async (topic) => await fetchNews(topic))
          );
          // Summarize news for each topic
          const summaries = await Promise.all(
            articlesByTopic.map(async (articles) => await summarizeNews(articles))
          );
          // Generate email content using createEmailTemplate
          const emailContent = createEmailTemplate(
            subscriber.topics,
            summaries,
            articlesByTopic
          );
          // Prepare and send email
          const msg = {
            to: subscriber.email,
            from: 'newsnexusdaily@gmail.com',
            subject: 'Your Personalized Daily News Update - NewsNexus Daily',
            html: emailContent
          };
          const info = await transporter.sendMail(msg);
          console.log(`Email sent successfully to ${subscriber.email}`);
        } catch (error) {
          console.error(`Error processing subscriber ${subscriber.email}:`, error);
          continue;
        }
      }
    }
    console.log('=== END OF JOB ===');
  } catch (error) {
    console.error('Error in scheduled news email distribution:', error);
  }
});

// Recent news endpoint
app.get('/api/recent-news', async (req, res) => {
    try {
        const recentNews = await fetchRecentNews();
        res.json(recentNews);
    } catch (error) {
        console.error('Error fetching recent news:', error);
        res.status(500).json({ error: 'Failed to fetch recent news' });
    }
});

// Function to fetch recent news
async function fetchRecentNews() {
    try {
        const response = await newsapi.v2.topHeadlines({
            language: 'en',
            pageSize: 6
        });

        if (!response.articles || response.articles.length === 0) {
            return [];
        }

        // Process and format the news articles
        const formattedNews = await Promise.all(response.articles.map(async (article) => {
            // Determine category based on source or content
            let category = 'General';
            if (article.source.name.toLowerCase().includes('tech')) {
                category = 'Technology';
            } else if (article.source.name.toLowerCase().includes('sport')) {
                category = 'Sports';
            } else if (article.source.name.toLowerCase().includes('business')) {
                category = 'Business';
            }

            // Format the time
            const publishedDate = new Date(article.publishedAt);
            const time = publishedDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
            });
            const date = publishedDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            return {
                category,
                headline: article.title,
                summary: article.description || 'No description available',
                source: article.source.name,
                time,
                date,
                url: article.url
            };
        }));

        return formattedNews;
    } catch (error) {
        console.error('Error in fetchRecentNews:', error);
        return [];
    }
}

// Unsubscribe by token endpoint - MUST be before /api/unsubscribe-by-email
app.get('/api/unsubscribe/:token', async (req, res) => {
    try {
        const { token } = req.params;
        console.log('Attempting to unsubscribe with token:', token); // Debug log
        
        // Find subscriber by token
        const subscriber = await Subscriber.findOne({ unsubscribeToken: token });
        console.log('Found subscriber:', subscriber ? 'Yes' : 'No'); // Debug log
        
        if (!subscriber) {
            console.log('No subscriber found for token'); // Debug log
            return res.status(404).send(`
                <html>
                    <head>
                        <title>Unsubscribe Failed</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                height: 100vh;
                                margin: 0;
                                background: #f7fafc;
                            }
                            .container {
                                text-align: center;
                                padding: 2rem;
                                background: white;
                                border-radius: 8px;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            }
                            h1 { color: #e53e3e; }
                            p { color: #4a5568; }
                            a {
                                color: #5a67d8;
                                text-decoration: none;
                            }
                            a:hover { text-decoration: underline; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>Unsubscribe Failed</h1>
                            <p>Invalid or expired unsubscribe link.</p>
                            <p><a href="/subscriber.html">Return to subscription page</a></p>
                        </div>
                    </body>
                </html>
            `);
        }

        // Update subscriber status
        subscriber.isActive = false;
        await subscriber.save();
        console.log('Successfully unsubscribed subscriber:', subscriber.email); // Debug log

        // Send success response
        res.send(`
            <html>
                <head>
                    <title>Unsubscribed Successfully</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            background: #f7fafc;
                        }
                        .container {
                            text-align: center;
                            padding: 2rem;
                            background: white;
                            border-radius: 8px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        }
                        h1 { color: #38a169; }
                        p { color: #4a5568; }
                        a {
                            color: #5a67d8;
                            text-decoration: none;
                        }
                        a:hover { text-decoration: underline; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Unsubscribed Successfully</h1>
                        <p>You have been unsubscribed from NewsNexus Daily updates.</p>
                        <p>You will no longer receive news updates at ${subscriber.email}.</p>
                        <p><a href="/subscriber.html">Return to subscription page</a></p>
                    </div>
                </body>
            </html>
        `);
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).send(`
            <html>
                <head>
                    <title>Error</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            background: #f7fafc;
                        }
                        .container {
                            text-align: center;
                            padding: 2rem;
                            background: white;
                            border-radius: 8px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        }
                        h1 { color: #e53e3e; }
                        p { color: #4a5568; }
                        a {
                            color: #5a67d8;
                            text-decoration: none;
                        }
                        a:hover { text-decoration: underline; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Error</h1>
                        <p>An error occurred while processing your request.</p>
                        <p><a href="/subscriber.html">Return to subscription page</a></p>
                    </div>
                </body>
            </html>
        `);
    }
});

// Unsubscribe by email endpoint - MUST be after /api/unsubscribe/:token
app.post('/api/unsubscribe-by-email', async (req, res) => {
    try {
        const { email } = req.body;
        console.log('Attempting to unsubscribe email:', email); // Debug log
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Find subscriber by email
        const subscriber = await Subscriber.findOne({ email: email.toLowerCase() });
        console.log('Found subscriber:', subscriber ? 'Yes' : 'No'); // Debug log
        
        if (!subscriber) {
            console.log('No subscriber found for email'); // Debug log
            return res.status(404).json({
                success: false,
                message: 'No subscription found for this email address'
            });
        }

        // Delete the subscriber record
        await Subscriber.deleteOne({ email: email.toLowerCase() });
        console.log('Successfully deleted subscriber:', email); // Debug log

        res.json({
            success: true,
            message: 'Successfully unsubscribed'
        });
    } catch (error) {
        console.error('Unsubscribe by email error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while processing your request'
        });
    }
});

// AI Assistant Chat Route
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a real-time news assistant. For any news-related query, ALWAYS respond with 3 to 5 news items, even if the query is specific. Only include news from trusted, reputable sources such as BBC, Reuters, The New York Times, The Washington Post, The Guardian, Associated Press, and similar. For each news item, provide: a clear heading (the article title), a short summary, and a direct hyperlink to the original article. List each news item clearly and separately, using bullet points or a numbered list if needed."
        },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const aiResponse = completion.choices[0].message.content;
    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({ error: 'Failed to process chat request' });
  }
});

// Update the server listen section at the bottom of the file
const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Server is ready to accept connections');
}); 