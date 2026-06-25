import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock, Truck, Star, Pizza as PizzaIcon } from 'lucide-react';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 dark:from-primary-800 dark:via-primary-900 dark:to-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="max-w-3xl animate-fade-in">
            <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
              <Star className="text-yellow-300 fill-yellow-300" size={16} />
              Rated 4.9/5 by 10,000+ happy customers
            </span>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Hot & Fresh Pizza<br />
              <span className="text-primary-200 dark:text-primary-300">Delivered Fast</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100 dark:text-primary-200">
              Authentic Italian flavors made with premium ingredients. Order in seconds and we&apos;ll have it at your door in 30 minutes &mdash; with free delivery, always.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/menu"
                className="inline-flex items-center justify-center gap-2 bg-white dark:bg-gray-100 text-primary-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-primary-50 dark:hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Order Now
                <ArrowRight size={24} />
              </Link>
              <Link
                href="/build-your-own"
                className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition-all transform hover:-translate-y-1"
              >
                <PizzaIcon size={24} />
                Build Your Own
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-10 text-primary-100 dark:text-primary-200">
              <span className="inline-flex items-center gap-2 font-medium">
                <Clock size={20} className="text-primary-200 dark:text-primary-300" />
                30-min delivery
              </span>
              <span className="inline-flex items-center gap-2 font-medium">
                <Truck size={20} className="text-primary-200 dark:text-primary-300" />
                Free delivery, no minimum
              </span>
              <span className="inline-flex items-center gap-2 font-medium">
                <Star size={20} className="text-primary-200 dark:text-primary-300" />
                Premium ingredients
              </span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-50 dark:from-gray-900 to-transparent"></div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center animate-slide-up">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <Clock className="text-primary-600 dark:text-primary-400" size={40} />
              </div>
              <h3 className="text-2xl font-bold mb-2 dark:text-white">Fast Delivery</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your pizza arrives hot and fresh in 30-45 minutes, guaranteed!
              </p>
            </div>
            
            <div className="text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <Star className="text-primary-600 dark:text-primary-400" size={40} />
              </div>
              <h3 className="text-2xl font-bold mb-2 dark:text-white">Quality Ingredients</h3>
              <p className="text-gray-600 dark:text-gray-400">
                We use only the finest ingredients for authentic Italian taste.
              </p>
            </div>
            
            <div className="text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
                <Truck className="text-primary-600 dark:text-primary-400" size={40} />
              </div>
              <h3 className="text-2xl font-bold mb-2 dark:text-white">Free Delivery</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Free delivery on all orders. No minimum purchase required!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Pizzas Preview */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 dark:text-white">Popular Pizzas</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Try our customer favorites
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              {
                name: "Margherita",
                image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80",
                description: "Classic Italian with fresh mozzarella"
              },
              {
                name: "Pepperoni",
                image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80",
                description: "America's favorite loaded with pepperoni"
              },
              {
                name: "BBQ Chicken",
                image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80",
                description: "Grilled chicken with tangy BBQ sauce"
              }
            ].map((pizza, index) => (
              <div key={index} className="card overflow-hidden animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="relative h-64">
                  <Image
                    src={pizza.image}
                    alt={pizza.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2 dark:text-white">{pizza.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{pizza.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Link href="/menu" className="btn-primary inline-flex items-center gap-2">
              View Full Menu
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 dark:bg-primary-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Craving Pizza? Let&apos;s Fix That.
          </h2>
          <p className="text-xl mb-8 text-primary-100 dark:text-primary-200 max-w-2xl mx-auto">
            Hot, fresh, and at your door in 30 minutes. Order in just a few clicks &mdash; free delivery on every order, no minimum required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/menu" className="btn-primary bg-white dark:bg-gray-100 text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-200 inline-flex items-center justify-center gap-2">
              Start Your Order
              <ArrowRight size={20} />
            </Link>
            <Link href="/build-your-own" className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-all">
              <PizzaIcon size={20} />
              Build Your Own
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
