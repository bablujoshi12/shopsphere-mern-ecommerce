import React from "react";
import HeroSection from "../components/home/HeroSection";
import CategorySection from "../components/home/CategorySection";
import FeaturedProducts from "../components/home/FeaturedProducts";
import WhyShopSphere from "../components/home/WhyShopSphere";
import Newsletter from "../components/home/Newsletter";

function Home() {
  return (
    <>
      <HeroSection />
      <CategorySection />
      <FeaturedProducts />
      <WhyShopSphere />
      <Newsletter />
    </>
  );
}

export default Home;
