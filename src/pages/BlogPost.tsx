import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, Share2, Twitter, Facebook, Linkedin } from "lucide-react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import epikLogo from "@/assets/epik-logo.png";

// Blog posts data with full content
export const blogPostsData = [
  {
    slug: "10-proven-strategies-instagram-2025",
    title: "10 Proven Strategies to Grow Your Instagram in 2025",
    excerpt: "Discover the latest techniques that top influencers use to skyrocket their Instagram following.",
    date: "Dec 15, 2025",
    readTime: "5 min read",
    category: "Instagram",
    content: `
      <p>Growing your Instagram following in 2025 requires a mix of creativity, consistency, and strategic thinking. Here are 10 proven strategies that top influencers use to build massive audiences.</p>

      <h2>1. Master Reels and Short-Form Video</h2>
      <p>Instagram's algorithm heavily favors Reels. Creating engaging, entertaining, or educational short videos is one of the fastest ways to reach new audiences. Aim for 15-30 second videos that hook viewers in the first 3 seconds.</p>

      <h2>2. Post Consistently at Optimal Times</h2>
      <p>Consistency is key. Use Instagram Insights to find when your audience is most active and schedule your posts accordingly. Most accounts see best engagement between 11am-1pm and 7pm-9pm in their target timezone.</p>

      <h2>3. Leverage Instagram Stories</h2>
      <p>Stories keep your audience engaged between posts. Use polls, questions, and quizzes to boost interaction. Aim for 5-7 stories per day to stay at the top of your followers' feeds.</p>

      <h2>4. Optimize Your Bio and Profile</h2>
      <p>Your bio is your elevator pitch. Make it clear what value you provide and include a call-to-action. Use a professional profile picture and ensure your username is memorable and searchable.</p>

      <h2>5. Engage Authentically with Your Community</h2>
      <p>Spend 30 minutes before and after each post engaging with your followers and similar accounts. Reply to every comment on your posts and genuinely interact with content in your niche.</p>

      <h2>6. Use Strategic Hashtags</h2>
      <p>Mix popular and niche hashtags. Use 20-30 relevant hashtags per post. Research trending hashtags in your industry and create a few variations to test what works best.</p>

      <h2>7. Collaborate with Other Creators</h2>
      <p>Cross-promotion exposes you to new audiences. Partner with creators in complementary niches for Lives, Reels collabs, or shoutout exchanges.</p>

      <h2>8. Create Shareable Content</h2>
      <p>Think about what makes people want to share content: humor, inspiration, education, or controversy. Create carousel posts with valuable information that people save and share.</p>

      <h2>9. Analyze and Adapt</h2>
      <p>Regularly review your Instagram Insights. Identify what content performs best and double down on those formats. Test different posting times, formats, and content types.</p>

      <h2>10. Consider Growth Services</h2>
      <p>Platforms like Epik can help jumpstart your growth by boosting your visibility and social proof. When new visitors see an engaged following, they're more likely to follow too.</p>

      <h2>Conclusion</h2>
      <p>Growing on Instagram takes time and effort, but with these strategies, you'll be well on your way to building a thriving account. Remember, quality always beats quantity – focus on creating value for your audience.</p>
    `,
  },
  {
    slug: "tiktok-algorithm-secrets-viral",
    title: "TikTok Algorithm Secrets: How to Go Viral",
    excerpt: "Understanding the TikTok algorithm is key to getting your content seen by millions.",
    date: "Dec 10, 2025",
    readTime: "7 min read",
    category: "TikTok",
    content: `
      <p>TikTok's algorithm is one of the most powerful recommendation systems in social media. Understanding how it works is the key to going viral.</p>

      <h2>How the TikTok Algorithm Works</h2>
      <p>Unlike other platforms, TikTok's For You Page (FYP) algorithm doesn't prioritize follower count. Instead, it focuses on content performance metrics, giving everyone an equal chance to go viral.</p>

      <h2>Key Ranking Factors</h2>
      <p>The algorithm considers several factors when deciding whether to show your content:</p>
      <ul>
        <li><strong>Watch Time:</strong> The most important metric. Videos watched to completion or rewatched signal high quality.</li>
        <li><strong>Engagement:</strong> Likes, comments, shares, and saves all boost your video's reach.</li>
        <li><strong>Video Information:</strong> Captions, sounds, and hashtags help categorize your content.</li>
        <li><strong>Account Settings:</strong> Language and country preferences affect distribution.</li>
      </ul>

      <h2>The Testing Phase</h2>
      <p>Every video starts by being shown to a small group (typically 300-500 users). If it performs well, it's pushed to larger audiences in waves. This is why the first hour after posting is crucial.</p>

      <h2>Tips for Going Viral</h2>
      <h3>Hook Viewers Immediately</h3>
      <p>You have about 1 second to capture attention. Start with movement, a surprising statement, or an intriguing visual.</p>

      <h3>Keep Videos Short</h3>
      <p>While TikTok allows up to 10-minute videos, shorter content (15-30 seconds) typically performs better because it's easier to get full watch-throughs.</p>

      <h3>Use Trending Sounds</h3>
      <p>Videos using trending sounds get boosted by the algorithm. Check the Trending section regularly and adapt trends to your niche.</p>

      <h3>Post at the Right Time</h3>
      <p>Posting when your audience is active increases initial engagement. Test different times and track performance in TikTok Analytics.</p>

      <h3>Encourage Engagement</h3>
      <p>Ask questions, create debates, or use calls-to-action that encourage comments. The algorithm loves videos with high comment rates.</p>

      <h2>Common Mistakes to Avoid</h2>
      <ul>
        <li>Deleting and reposting videos (hurts your account)</li>
        <li>Using banned hashtags or sounds</li>
        <li>Posting too many videos in quick succession</li>
        <li>Ignoring comments on your videos</li>
      </ul>

      <h2>Conclusion</h2>
      <p>Going viral on TikTok isn't just luck – it's about understanding the algorithm and creating content that keeps viewers watching. Focus on that crucial first second, use trending sounds, and engage with your community.</p>
    `,
  },
  {
    slug: "ultimate-guide-youtube-shorts",
    title: "The Ultimate Guide to YouTube Shorts Success",
    excerpt: "YouTube Shorts is the fastest-growing feature. Learn how to leverage it for massive growth.",
    date: "Dec 5, 2025",
    readTime: "6 min read",
    category: "YouTube",
    content: `
      <p>YouTube Shorts has exploded in popularity, offering creators a powerful way to reach new audiences. Here's everything you need to know to succeed with Shorts.</p>

      <h2>What Are YouTube Shorts?</h2>
      <p>Shorts are vertical videos up to 60 seconds long. They appear in a dedicated Shorts shelf and can be discovered by non-subscribers, making them ideal for growth.</p>

      <h2>Why Shorts Matter for Creators</h2>
      <p>Unlike regular YouTube videos, Shorts can go viral even with zero subscribers. YouTube actively promotes Shorts to help creators build audiences, making it one of the best growth opportunities on the platform.</p>

      <h2>Creating Effective Shorts</h2>
      <h3>Optimal Format</h3>
      <ul>
        <li>Vertical aspect ratio (9:16)</li>
        <li>Under 60 seconds (15-30 seconds is ideal)</li>
        <li>Include #Shorts in title or description</li>
      </ul>

      <h3>Content That Works</h3>
      <ul>
        <li><strong>Tutorials:</strong> Quick tips and how-tos perform exceptionally well</li>
        <li><strong>Before/After:</strong> Transformation content is highly engaging</li>
        <li><strong>Lists:</strong> "3 things you didn't know about..." format is popular</li>
        <li><strong>Reactions:</strong> Quick reactions to trending topics</li>
      </ul>

      <h2>The Shorts Algorithm</h2>
      <p>YouTube's Shorts algorithm prioritizes:</p>
      <ul>
        <li>Watch time and completion rate</li>
        <li>Engagement (likes, comments, shares)</li>
        <li>Click-through rate on thumbnails</li>
        <li>Viewer retention patterns</li>
      </ul>

      <h2>Converting Shorts Viewers to Subscribers</h2>
      <p>The challenge with Shorts is converting casual viewers into subscribers. Here's how:</p>
      <ul>
        <li>End with a call-to-action to subscribe</li>
        <li>Create series that encourage following</li>
        <li>Pin a comment with a link to your long-form content</li>
        <li>Maintain consistent branding across all Shorts</li>
      </ul>

      <h2>Best Practices</h2>
      <ul>
        <li>Post 1-3 Shorts per day for maximum growth</li>
        <li>Use trending sounds and music</li>
        <li>Hook viewers in the first second</li>
        <li>Add text overlays for viewers watching without sound</li>
        <li>Cross-promote from TikTok and Reels (remove watermarks first)</li>
      </ul>

      <h2>Monetization</h2>
      <p>YouTube now shares ad revenue from Shorts with creators. To qualify, you need 1,000 subscribers and 10 million Shorts views in 90 days. This makes Shorts not just a growth tool but a potential income stream.</p>

      <h2>Conclusion</h2>
      <p>YouTube Shorts represents one of the biggest opportunities for creators right now. With the right strategy, you can rapidly grow your channel and build a loyal audience.</p>
    `,
  },
  {
    slug: "building-personal-brand-linkedin",
    title: "Building Your Personal Brand on LinkedIn",
    excerpt: "LinkedIn isn't just for job hunting. It's a powerful platform for establishing thought leadership.",
    date: "Nov 28, 2025",
    readTime: "8 min read",
    category: "LinkedIn",
    content: `
      <p>LinkedIn has evolved far beyond a job-hunting platform. Today, it's one of the most powerful tools for building a personal brand and establishing yourself as a thought leader.</p>

      <h2>Why LinkedIn for Personal Branding?</h2>
      <p>With over 900 million members, LinkedIn offers unique advantages:</p>
      <ul>
        <li>Professional audience with purchasing power</li>
        <li>Less competition than other social platforms</li>
        <li>Algorithm favors organic reach</li>
        <li>Direct access to decision-makers</li>
      </ul>

      <h2>Optimizing Your Profile</h2>
      <h3>Headline</h3>
      <p>Don't just list your job title. Use your headline to communicate value: "Helping SaaS companies increase conversions by 40% through data-driven marketing"</p>

      <h3>About Section</h3>
      <p>Tell your story. Include your background, what you do, who you help, and a call-to-action. Use first person and show personality.</p>

      <h3>Featured Section</h3>
      <p>Showcase your best work: articles, videos, case studies, or portfolio pieces that demonstrate your expertise.</p>

      <h2>Content Strategy</h2>
      <h3>What to Post</h3>
      <ul>
        <li><strong>Personal stories:</strong> Lessons learned, failures, and successes</li>
        <li><strong>Industry insights:</strong> Your take on trends and news</li>
        <li><strong>How-to content:</strong> Actionable tips your audience can use</li>
        <li><strong>Thought leadership:</strong> Contrarian views and predictions</li>
      </ul>

      <h3>Posting Format</h3>
      <p>LinkedIn's algorithm favors native content. Text-only posts and carousels currently get the best reach. Use hooks to capture attention and break up text with line breaks for readability.</p>

      <h3>Posting Schedule</h3>
      <p>Consistency matters more than frequency. Start with 3 posts per week and scale up. Tuesday through Thursday mornings typically see highest engagement.</p>

      <h2>Building Your Network</h2>
      <ul>
        <li>Connect with people in your industry</li>
        <li>Engage meaningfully on others' posts</li>
        <li>Join and participate in relevant groups</li>
        <li>Respond to every comment on your posts</li>
      </ul>

      <h2>Advanced Strategies</h2>
      <h3>LinkedIn Newsletter</h3>
      <p>Start a newsletter to build a subscriber base. Subscribers get notified of each issue, ensuring consistent reach.</p>

      <h3>LinkedIn Live</h3>
      <p>Go live to engage with your audience in real-time. LinkedIn notifies your connections when you go live.</p>

      <h3>Creator Mode</h3>
      <p>Enable Creator Mode to access additional features and signal to LinkedIn that you're building an audience.</p>

      <h2>Conclusion</h2>
      <p>Building a personal brand on LinkedIn takes time, but the professional opportunities it creates are unmatched. Start posting consistently, engage with your community, and watch your influence grow.</p>
    `,
  },
  {
    slug: "engagement-rate-vs-follower-count",
    title: "Why Engagement Rate Matters More Than Follower Count",
    excerpt: "Learn why brands are prioritizing engagement over followers when choosing influencers.",
    date: "Nov 20, 2025",
    readTime: "4 min read",
    category: "Strategy",
    content: `
      <p>The days of judging an influencer's value solely by follower count are over. Smart brands now look at engagement rate as the primary metric for partnership decisions.</p>

      <h2>What is Engagement Rate?</h2>
      <p>Engagement rate measures how actively your audience interacts with your content. It's typically calculated as: (Likes + Comments + Shares) / Followers × 100</p>

      <h2>Why Engagement Beats Followers</h2>
      <h3>Fake Followers Are Rampant</h3>
      <p>Studies estimate that 10-20% of Instagram followers are fake or inactive. Engagement rate reveals the true, active audience.</p>

      <h3>Algorithm Visibility</h3>
      <p>Social media algorithms prioritize content with high engagement. A smaller account with great engagement often gets more reach than a large account with poor engagement.</p>

      <h3>Conversion Potential</h3>
      <p>An engaged audience is more likely to act on recommendations. Brands see better ROI from influencers with high engagement, even if they have fewer followers.</p>

      <h2>What's a Good Engagement Rate?</h2>
      <p>Engagement rates vary by platform and account size:</p>
      <ul>
        <li><strong>Instagram:</strong> 1-3% is average, 3-6% is good, 6%+ is excellent</li>
        <li><strong>TikTok:</strong> 3-9% is average, 9%+ is excellent</li>
        <li><strong>Twitter:</strong> 0.5-1% is average, 1-3% is good</li>
        <li><strong>YouTube:</strong> 2-5% engagement on views is typical</li>
      </ul>

      <h2>How to Improve Your Engagement Rate</h2>
      <h3>1. Know Your Audience</h3>
      <p>Create content that resonates with your specific audience. Use analytics to understand what performs best.</p>

      <h3>2. Ask Questions</h3>
      <p>Encourage comments by asking questions in your captions. Open-ended questions work better than yes/no questions.</p>

      <h3>3. Respond to Comments</h3>
      <p>Reply to every comment, especially within the first hour. This encourages more engagement and signals to algorithms that your content is generating conversation.</p>

      <h3>4. Post When Active</h3>
      <p>Use insights to find when your audience is most active and post during those windows.</p>

      <h3>5. Use Stories and Polls</h3>
      <p>Interactive features like polls, questions, and quizzes drive engagement and keep your audience active.</p>

      <h2>The Micro-Influencer Advantage</h2>
      <p>Micro-influencers (1K-100K followers) typically have higher engagement rates than mega-influencers. Their audiences feel more personal connection, leading to stronger trust and better conversion rates for brands.</p>

      <h2>Conclusion</h2>
      <p>Focus on building a genuine, engaged community rather than chasing follower numbers. Quality always beats quantity when it comes to social media success.</p>
    `,
  },
  {
    slug: "social-media-trends-2025",
    title: "Social Media Trends to Watch in 2025",
    excerpt: "Stay ahead of the curve with our predictions for the biggest social media trends this year.",
    date: "Nov 15, 2025",
    readTime: "10 min read",
    category: "Trends",
    content: `
      <p>The social media landscape is constantly evolving. Here are the biggest trends shaping the industry in 2025 and how you can leverage them for growth.</p>

      <h2>1. AI-Generated Content</h2>
      <p>AI tools are becoming mainstream for content creation. From writing captions to generating images, creators are using AI to scale their output. However, authenticity remains crucial – AI should enhance, not replace, your unique voice.</p>

      <h2>2. Short-Form Video Dominance</h2>
      <p>Short-form video continues its takeover. TikTok, Reels, and Shorts are where attention is focused. If you're not creating short videos, you're missing the biggest growth opportunity available.</p>

      <h2>3. Social Commerce Expansion</h2>
      <p>Shopping directly through social media is becoming seamless. Instagram Shop, TikTok Shop, and similar features are turning social platforms into marketplaces. Creators with engaged audiences can monetize through product sales.</p>

      <h2>4. Authenticity Over Polish</h2>
      <p>Overly produced content is losing favor. Audiences crave authentic, behind-the-scenes content. Raw, real moments often outperform highly edited posts.</p>

      <h2>5. Community-Centric Platforms</h2>
      <p>Private communities (Discord, Telegram, private Instagram accounts) are growing as creators seek deeper connections with their core fans. Building a community, not just a following, is the new goal.</p>

      <h2>6. Audio Content Revival</h2>
      <p>Podcasts and audio content continue to grow. Platforms are adding audio features, and creators are diversifying into audio formats to reach audiences during commutes and workouts.</p>

      <h2>7. Micro-Influencer Marketing</h2>
      <p>Brands are shifting budgets from mega-influencers to micro-influencers. Smaller creators with engaged audiences deliver better ROI and more authentic endorsements.</p>

      <h2>8. Platform Diversification</h2>
      <p>Smart creators are no longer putting all eggs in one basket. With platform instability and algorithm changes, diversifying across multiple platforms is essential for long-term success.</p>

      <h2>9. Subscription-Based Creator Economy</h2>
      <p>More creators are launching paid subscriptions, exclusive content, and membership communities. Direct monetization reduces dependence on brand deals and platform algorithms.</p>

      <h2>10. Mental Health Awareness</h2>
      <p>Both platforms and creators are prioritizing mental health. Features to limit screen time, reduce comparison, and protect creator wellbeing are becoming standard.</p>

      <h2>How to Adapt</h2>
      <ul>
        <li>Embrace short-form video if you haven't already</li>
        <li>Build genuine community, not just followers</li>
        <li>Experiment with AI tools to improve efficiency</li>
        <li>Diversify your platform presence</li>
        <li>Focus on authentic, valuable content</li>
      </ul>

      <h2>Conclusion</h2>
      <p>2025 is shaping up to be an exciting year for social media. The creators who adapt to these trends while staying true to their authentic voice will thrive. Stay curious, keep experimenting, and remember – the best time to start is now.</p>
    `,
  },
];

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPostsData.find((p) => p.slug === slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const shareUrl = window.location.href;
  const shareText = encodeURIComponent(post.title);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-20 border-b border-border bg-card/50 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto h-full flex items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={epikLogo} alt="Epik" className="h-10 md:h-12 w-auto" />
          </Link>
          <Link to="/blog">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
            </Button>
          </Link>
        </div>
      </header>

      {/* Article */}
      <article className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            {/* Category & Meta */}
            <div className="flex items-center gap-4 mb-6">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {post.category}
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {post.date}
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {post.readTime}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-muted-foreground mb-8">{post.excerpt}</p>

            {/* Share Buttons */}
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Share2 className="h-4 w-4" /> Share:
              </span>
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Twitter className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Facebook className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </a>
              <a
                href={`https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Linkedin className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </a>
            </div>

            {/* Content */}
            <div
              className="prose prose-lg max-w-none 
                prose-headings:text-foreground prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4
                prose-p:text-muted-foreground prose-p:mb-4 prose-p:leading-relaxed
                prose-li:text-muted-foreground prose-li:mb-2
                prose-ul:my-4 prose-ol:my-4
                prose-strong:text-foreground
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* CTA */}
            <div className="mt-12 p-8 bg-primary/5 rounded-2xl border border-primary/20 text-center">
              <h3 className="text-xl font-bold text-foreground mb-2">Ready to grow your social media?</h3>
              <p className="text-muted-foreground mb-4">
                Join thousands of creators using Epik to boost their online presence.
              </p>
              <Link to="/auth">
                <Button>Get Started Free</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogPost;
