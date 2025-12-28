import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";

const blogPosts = [
  {
    title: "10 Proven Strategies to Grow Your Instagram in 2025",
    excerpt: "Discover the latest techniques that top influencers use to skyrocket their Instagram following.",
    date: "Dec 15, 2025",
    readTime: "5 min read",
    category: "Instagram",
  },
  {
    title: "TikTok Algorithm Secrets: How to Go Viral",
    excerpt: "Understanding the TikTok algorithm is key to getting your content seen by millions.",
    date: "Dec 10, 2025",
    readTime: "7 min read",
    category: "TikTok",
  },
  {
    title: "The Ultimate Guide to YouTube Shorts Success",
    excerpt: "YouTube Shorts is the fastest-growing feature. Learn how to leverage it for massive growth.",
    date: "Dec 5, 2025",
    readTime: "6 min read",
    category: "YouTube",
  },
  {
    title: "Building Your Personal Brand on LinkedIn",
    excerpt: "LinkedIn isn't just for job hunting. It's a powerful platform for establishing thought leadership.",
    date: "Nov 28, 2025",
    readTime: "8 min read",
    category: "LinkedIn",
  },
  {
    title: "Why Engagement Rate Matters More Than Follower Count",
    excerpt: "Learn why brands are prioritizing engagement over followers when choosing influencers.",
    date: "Nov 20, 2025",
    readTime: "4 min read",
    category: "Strategy",
  },
  {
    title: "Social Media Trends to Watch in 2025",
    excerpt: "Stay ahead of the curve with our predictions for the biggest social media trends this year.",
    date: "Nov 15, 2025",
    readTime: "10 min read",
    category: "Trends",
  },
];

const Blog = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-20 border-b border-border bg-card/50 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto h-full flex items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-3xl font-extrabold text-foreground tracking-tight">
              E<span className="text-primary">p</span>ic
            </span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Epic <span className="text-primary">Blog</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Tips, strategies, and insights to help you grow your social media presence.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post, index) => (
              <motion.article
                key={post.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-card transition-shadow group"
              >
                <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <span className="text-4xl font-bold text-primary/30">{post.category}</span>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {post.readTime}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">{post.excerpt}</p>
                  <Button variant="ghost" size="sm" className="group/btn">
                    Read More <ArrowRight className="ml-1 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-xl mx-auto"
          >
            <h2 className="text-2xl font-bold text-foreground mb-4">Stay Updated</h2>
            <p className="text-muted-foreground mb-6">
              Subscribe to our newsletter for the latest social media tips and updates.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button>Subscribe</Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
