import { getVersion } from '@/lib/version';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const version = getVersion();

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">PizzaHub</h3>
            <p className="text-gray-400 dark:text-gray-500">
              Serving the best pizzas in town since 2025. Made fresh daily with quality ingredients.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400 dark:text-gray-500">
              <li><a href="/menu" className="hover:text-white transition-colors">Menu</a></li>
              <li><a href="/cart" className="hover:text-white transition-colors">Cart</a></li>
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-4">Contact</h3>
            <ul className="space-y-2 text-gray-400 dark:text-gray-500">
              <li>📞 (555) 123-4567</li>
              <li>📧 info@pizzahub.com</li>
              <li>📍 123 Pizza Street, Food City</li>
              <li>🕒 Mon-Sun: 11AM - 10PM</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 dark:border-gray-900 mt-8 pt-6 text-center text-gray-400 dark:text-gray-500">
          <p>&copy; {currentYear} PizzaHub. All rights reserved.</p>
          <p className="mt-2 text-sm">
            v{version}
            {' · '}
            <a href="/changelog" className="hover:text-white transition-colors underline">
              Changelog
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
