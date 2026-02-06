import Navbar from "@/components/Navbar";
import VaultSidebar from "@/components/VaultSidebar";
import Footer from "@/components/Footer";

const Vault = () => (
  <div className="min-h-screen bg-background">
    <Navbar />

    <main>
      <VaultSidebar />
    </main>

    <Footer />
  </div>
);

export default Vault;
