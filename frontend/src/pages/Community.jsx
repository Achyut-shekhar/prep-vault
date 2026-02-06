import Navbar from "@/components/Navbar";
import CommunityFeed from "@/components/CommunityFeed";
import Footer from "@/components/Footer";

const Community = () => (
  <div className="min-h-screen bg-background">
    <Navbar />

    <main>
      <CommunityFeed />
    </main>

    <Footer />
  </div>
);

export default Community;
