import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { NewOrder } from "@/components/NewOrder";
import { OrdersHistory } from "@/components/OrdersHistory";
import { AddFunds } from "@/components/AddFunds";
import { Support } from "@/components/Support";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <Hero />
        <NewOrder />
        <OrdersHistory />
        <AddFunds />
        <Support />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
