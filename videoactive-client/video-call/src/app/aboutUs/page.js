import Head from 'next/head'

/**
 * Renders the About page for the ViMeet application.
 *
 * This component displays:
 * - A hero section with a background image and a title overlay.
 * - A descriptive paragraph about the purpose and origin of ViMeet.
 * - A mission statement block outlining the platform’s goals.
 *
 * @returns {JSX.Element} The rendered About page component.
 */
export default function About() {
  return (
    <div>
      <Head>
        <title>About ViMeet - Virtual Meet Platform</title>
        <meta name="description" content="Learn about ViMeet – a virtual meeting platform built to connect people instantly and meaningfully." />
        <meta name="keywords" content="VIMEET, random call, random virtual call, virtual meetings, about VIMEET, video chat platform" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://videoactive.client.kc123.me/aboutUs" />

        {/* Open Graph */}
        <meta property="og:title" content="About ViMeet - Virtual Meet Platform" />
        <meta property="og:description" content="Learn about ViMeet – a virtual meeting platform built to connect people instantly and meaningfully." />
        <meta property="og:image" content="https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/logos/logo.svg" />
        <meta property="og:url" content="https://videoactive.client.kc123.me/about" />
        <meta property="og:type" content="website" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About ViMeet - Virtual Meet Platform" />
        <meta name="twitter:description" content="Learn about ViMeet – a virtual meeting platform built to connect people instantly and meaningfully." />
        <meta name="twitter:image" content="https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/logos/logo.svg" />
      </Head>
      <main className="text-center">
        {/* Hero Section */}
        <section className="relative w-full h-[400px]">
          <img 
            src="https://my-video-active-bucket.s3.ap-southeast-1.amazonaws.com/videoCall/public/landing3.jpg"
            alt="About ViMeet" 
            className="w-full h-full object-cover opacity-70" 
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
            <h1 className="text-4xl font-bold text-white">
              About <span className="text-pink-500">ViMeet</span>
            </h1>
          </div>
        </section>
        {/* About Us Content */}
        <section className="p-10 max-w-3xl mx-auto text-left">
          <p className="text-lg text-gray-700 leading-relaxed">
            <span className="text-pink-600 font-bold">ViMeet</span> was born from a simple question:
            <i> "What if connecting with new people was as easy as picking up your phone?"</i> 
            We wanted to create a space where anyone could experience the joy of a chance encounter.
            We’re passionate about fostering meaningful connections and we’re excited to have you join our community.
          </p>

          {/* Mission Statement - Better Readability */}
          <div className="mt-6 p-6 bg-gray-100 rounded-lg shadow">
            <p className="text-lg text-gray-700 leading-relaxed">
              ViMeet is on a mission to bring the world closer, one conversation at a time.
              We believe in the power of human connection and have built a platform to make that easy.
              Whether you’re looking to expand your social circle, practice a new language, or brighten your day with a friendly chat, 
              ViMeet is here for you. Start connecting today and discover the world of possibilities.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
