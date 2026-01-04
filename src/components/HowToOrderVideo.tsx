import { motion } from "framer-motion";
import { Play, CirclePlay } from "lucide-react";
import { useState } from "react";
import videoThumbnail from "@/assets/video-thumbnail.png";

interface HowToOrderVideoProps {
  variant?: "sidebar" | "landing";
}

const HowToOrderVideo = ({ variant = "sidebar" }: HowToOrderVideoProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Google Drive video embed URL
  const videoEmbedUrl = "https://drive.google.com/file/d/1UgruD4N-emxa57fAIGhhbSDyhW8VA0Iv/preview";

  if (variant === "landing") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        <div className="relative rounded-3xl overflow-hidden bg-card border border-border shadow-xl purple-glow">
          {/* Video Header */}
          <div className="bg-gradient-primary p-4 flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <CirclePlay className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-heading font-bold text-lg">How to Place an Order</h3>
              <p className="text-white/80 text-sm">Watch our quick tutorial</p>
            </div>
          </div>
          
          {/* Video Container */}
          <div className="relative aspect-video bg-secondary">
            {!isPlaying ? (
              <button
                onClick={() => setIsPlaying(true)}
                className="absolute inset-0 flex items-center justify-center group cursor-pointer"
              >
                {/* Thumbnail image */}
                <img 
                  src={videoThumbnail} 
                  alt="How to Order Tutorial" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
                
                {/* Play button */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative z-10 w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg purple-glow-intense group-hover:scale-110 transition-transform"
                >
                  <Play className="h-8 w-8 text-white ml-1" fill="currentColor" />
                </motion.div>
                
                {/* Click to play text */}
                <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-muted-foreground font-medium">
                  Click to play
                </span>
              </button>
            ) : (
              <iframe
                src={videoEmbedUrl}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="How to Order Tutorial"
              />
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Sidebar variant for dashboard
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-card rounded-2xl border border-border shadow-card overflow-hidden h-fit"
    >
      {/* Header */}
      <div className="bg-gradient-primary p-3 lg:p-4 flex items-center gap-3">
        <div className="p-1.5 lg:p-2 bg-white/20 rounded-full">
          <CirclePlay className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
        </div>
        <div>
          <h3 className="text-white font-heading font-semibold text-sm lg:text-base">How to Order</h3>
          <p className="text-white/80 text-xs hidden sm:block">Quick video guide</p>
        </div>
      </div>
      
      <div className="relative aspect-[16/10] bg-secondary">
        {!isPlaying ? (
          <button
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 flex items-center justify-center group cursor-pointer"
          >
            {/* Thumbnail image */}
            <img 
              src={videoThumbnail} 
              alt="How to Order Tutorial" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-background/10 to-transparent" />
            
            {/* Play button */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative z-10 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-primary flex items-center justify-center shadow-lg purple-glow group-hover:scale-110 transition-transform"
            >
              <Play className="h-5 w-5 lg:h-6 lg:w-6 text-white ml-0.5" fill="currentColor" />
            </motion.div>
            
            {/* Text */}
            <span className="absolute bottom-3 lg:bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-medium">
              Click to play
            </span>
          </button>
        ) : (
          <iframe
            src={videoEmbedUrl}
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="How to Order Tutorial"
          />
        )}
      </div>
      
      {/* Tips */}
      <div className="p-3 lg:p-4 bg-accent/30 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Follow the steps in the video for best results
        </p>
      </div>
    </motion.div>
  );
};

export default HowToOrderVideo;
