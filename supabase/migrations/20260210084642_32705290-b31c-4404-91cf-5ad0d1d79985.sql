
-- Create platforms table for admin to manage which platforms appear on the site
CREATE TABLE public.platforms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_key text NOT NULL UNIQUE,
  name text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  is_enabled boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  icon_key text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;

-- Anyone can view platforms (needed for NewOrder page)
CREATE POLICY "Anyone can view platforms" ON public.platforms FOR SELECT USING (true);

-- Admins can manage platforms
CREATE POLICY "Admins can manage platforms" ON public.platforms FOR ALL USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_platforms_updated_at
  BEFORE UPDATE ON public.platforms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed all platforms
INSERT INTO public.platforms (platform_key, name, keywords, display_order, icon_key, is_enabled) VALUES
  ('facebook', 'Facebook', ARRAY['facebook', 'fb '], 1, 'facebook', true),
  ('instagram', 'Instagram', ARRAY['instagram', 'ig ', 'insta'], 2, 'instagram', true),
  ('twitter', 'X (Twitter)', ARRAY['twitter', 'tweet', 'x '], 3, 'twitter', true),
  ('tiktok', 'TikTok', ARRAY['tiktok', 'tik tok', 'tt '], 4, 'tiktok', true),
  ('snapchat', 'Snapchat', ARRAY['snapchat', 'snap'], 5, 'snapchat', true),
  ('threads', 'Threads', ARRAY['threads'], 6, 'threads', true),
  ('linkedin', 'LinkedIn', ARRAY['linkedin'], 7, 'linkedin', true),
  ('pinterest', 'Pinterest', ARRAY['pinterest'], 8, 'pinterest', true),
  ('tumblr', 'Tumblr', ARRAY['tumblr'], 9, 'tumblr', true),
  ('reddit', 'Reddit', ARRAY['reddit'], 10, 'reddit', true),
  ('mastodon', 'Mastodon', ARRAY['mastodon'], 11, 'mastodon', true),
  ('bluesky', 'Bluesky', ARRAY['bluesky', 'bsky'], 12, 'bluesky', true),
  ('hive', 'Hive', ARRAY['hive social'], 13, NULL, true),
  ('mewe', 'MeWe', ARRAY['mewe'], 14, NULL, true),
  ('minds', 'Minds', ARRAY['minds'], 15, NULL, true),
  ('wtsocial', 'WT.Social', ARRAY['wt.social', 'wtsocial'], 16, NULL, true),
  ('nextdoor', 'Nextdoor', ARRAY['nextdoor'], 17, NULL, true),
  ('youtube', 'YouTube', ARRAY['youtube', 'yt ', 'youtuber'], 18, 'youtube', true),
  ('twitch', 'Twitch', ARRAY['twitch'], 19, 'twitch', true),
  ('kick', 'Kick', ARRAY['kick'], 20, NULL, true),
  ('vimeo', 'Vimeo', ARRAY['vimeo'], 21, NULL, true),
  ('dailymotion', 'Dailymotion', ARRAY['dailymotion'], 22, NULL, true),
  ('rumble', 'Rumble', ARRAY['rumble'], 23, NULL, true),
  ('bilibili', 'Bilibili', ARRAY['bilibili'], 24, NULL, true),
  ('trovo', 'Trovo', ARRAY['trovo'], 25, NULL, true),
  ('likee', 'Likee', ARRAY['likee'], 26, NULL, true),
  ('triller', 'Triller', ARRAY['triller'], 27, NULL, true),
  ('whatsapp', 'WhatsApp', ARRAY['whatsapp'], 28, 'whatsapp', true),
  ('telegram', 'Telegram', ARRAY['telegram', 'tg '], 29, 'telegram', true),
  ('discord', 'Discord', ARRAY['discord'], 30, 'discord', true),
  ('messenger', 'Messenger', ARRAY['messenger'], 31, NULL, true),
  ('wechat', 'WeChat', ARRAY['wechat'], 32, NULL, true),
  ('line', 'LINE', ARRAY['line'], 33, NULL, true),
  ('viber', 'Viber', ARRAY['viber'], 34, NULL, true),
  ('signal', 'Signal', ARRAY['signal'], 35, NULL, true),
  ('kakaotalk', 'KakaoTalk', ARRAY['kakaotalk', 'kakao'], 36, NULL, true),
  ('qq', 'QQ', ARRAY['qq'], 37, NULL, true),
  ('zalo', 'Zalo', ARRAY['zalo'], 38, NULL, true),
  ('flickr', 'Flickr', ARRAY['flickr'], 39, NULL, true),
  ('500px', '500px', ARRAY['500px'], 40, NULL, true),
  ('vsco', 'VSCO', ARRAY['vsco'], 41, NULL, true),
  ('deviantart', 'DeviantArt', ARRAY['deviantart'], 42, NULL, true),
  ('behance', 'Behance', ARRAY['behance'], 43, NULL, true),
  ('dribbble', 'Dribbble', ARRAY['dribbble'], 44, NULL, true),
  ('artstation', 'ArtStation', ARRAY['artstation'], 45, NULL, true),
  ('clubhouse', 'Clubhouse', ARRAY['clubhouse'], 46, NULL, true),
  ('xspaces', 'X Spaces', ARRAY['x spaces', 'twitter spaces'], 47, NULL, true),
  ('spoon', 'Spoon', ARRAY['spoon'], 48, NULL, true),
  ('stereo', 'Stereo', ARRAY['stereo'], 49, NULL, true),
  ('soundcloud', 'SoundCloud', ARRAY['soundcloud'], 50, NULL, true),
  ('medium', 'Medium', ARRAY['medium'], 51, NULL, true),
  ('substack', 'Substack', ARRAY['substack'], 52, NULL, true),
  ('wordpress', 'WordPress.com', ARRAY['wordpress'], 53, NULL, true),
  ('blogger', 'Blogger', ARRAY['blogger'], 54, NULL, true),
  ('ghost', 'Ghost', ARRAY['ghost'], 55, NULL, true),
  ('vocal', 'Vocal', ARRAY['vocal'], 56, NULL, true),
  ('steam', 'Steam Community', ARRAY['steam'], 57, NULL, true),
  ('gamerlink', 'GamerLink', ARRAY['gamerlink'], 58, NULL, true),
  ('roblox', 'Roblox', ARRAY['roblox'], 59, NULL, true),
  ('vrchat', 'VRChat', ARRAY['vrchat'], 60, NULL, true),
  ('patreon', 'Patreon', ARRAY['patreon'], 61, NULL, true),
  ('kofi', 'Ko-fi', ARRAY['ko-fi', 'kofi'], 62, NULL, true),
  ('buymeacoffee', 'Buy Me a Coffee', ARRAY['buymeacoffee', 'buy me a coffee'], 63, NULL, true),
  ('fanbase', 'Fanbase', ARRAY['fanbase'], 64, NULL, true),
  ('tinder', 'Tinder', ARRAY['tinder'], 65, NULL, true),
  ('bumble', 'Bumble', ARRAY['bumble'], 66, NULL, true),
  ('badoo', 'Badoo', ARRAY['badoo'], 67, NULL, true),
  ('okcupid', 'OkCupid', ARRAY['okcupid'], 68, NULL, true),
  ('hinge', 'Hinge', ARRAY['hinge'], 69, NULL, true),
  ('pof', 'Plenty of Fish', ARRAY['plenty of fish', 'pof'], 70, NULL, true),
  ('weibo', 'Weibo', ARRAY['weibo'], 71, NULL, true),
  ('xiaohongshu', 'Xiaohongshu (RED)', ARRAY['xiaohongshu', 'red', 'little red book'], 72, NULL, true),
  ('douyin', 'Douyin', ARRAY['douyin'], 73, NULL, true),
  ('qqzone', 'QQ Zone', ARRAY['qq zone', 'qzone'], 74, NULL, true),
  ('vk', 'VK (VKontakte)', ARRAY['vk', 'vkontakte'], 75, NULL, true),
  ('odnoklassniki', 'Odnoklassniki', ARRAY['odnoklassniki', 'ok.ru'], 76, NULL, true),
  ('eskimi', 'Eskimi', ARRAY['eskimi'], 77, NULL, true),
  ('yookos', 'Yookos', ARRAY['yookos'], 78, NULL, true),
  ('mixi', 'Mixi', ARRAY['mixi'], 79, NULL, true),
  ('onlyfans', 'OnlyFans', ARRAY['onlyfans'], 80, NULL, true),
  ('fansly', 'Fansly', ARRAY['fansly'], 81, NULL, true),
  ('justforfans', 'JustForFans', ARRAY['justforfans'], 82, NULL, true),
  ('spotify', 'Spotify', ARRAY['spotify'], 83, 'spotify', true);
